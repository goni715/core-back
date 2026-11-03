import { PipelineStage, Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import ConflictError from "../../errors/ConflictError";
import ForbiddenError from "../../errors/ForbiddenError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { ACCOUNT_STATUS, USER_ROLES } from "../user/user.constant";
import UserModel from "../user/user.model";
import {
  SCHEDULE_DAYS,
  SCHEDULE_SEARCHABLE_FIELDS,
} from "./schedule.constant";
import {
  TCreateSchedulePayload,
  TScheduleDay,
  TScheduleQuery,
  TUpdateSchedulePayload,
} from "./schedule.interface";
import ScheduleModel from "./schedule.model";
import createDateTimeFromTime, {
  normalizeTimeTo24Hour,
} from "../../utils/createDateTimeFromTime";
import formatTime12Hour from "../../utils/formatTime12Hour";

// Day ordering helper (Sat -> Fri)
const DAY_ORDER: Record<TScheduleDay, number> = {
  [SCHEDULE_DAYS.SAT]: 0,
  [SCHEDULE_DAYS.SUN]: 1,
  [SCHEDULE_DAYS.MON]: 2,
  [SCHEDULE_DAYS.TUE]: 3,
  [SCHEDULE_DAYS.WED]: 4,
  [SCHEDULE_DAYS.THU]: 5,
  [SCHEDULE_DAYS.FRI]: 6,
};

// Convert HH:mm or hh:mm AM/PM to minutes since midnight
const timeToMinutes = (time: string): number => {
  const normalized = normalizeTimeTo24Hour(time);
  const parts = normalized.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
};

// Check if two time intervals overlap (start1 < end2 && end1 > start2)
const isTimeOverlapping = (
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && e1 > s2;
};

// Helper to verify that minutes are strictly divisible by 5 (00, 05, ..., 55)
const isFiveMinuteInterval = (time: string): boolean => {
  if (!time) return true;
  const cleanTime = time.replace(/\s*(am|pm)/i, "").trim();
  const parts = cleanTime.split(":");
  const minutes = parseInt(parts[1] || "", 10);
  return !isNaN(minutes) && minutes % 5 === 0;
};

/*========== Create Schedule (Doctor Only - Own Schedule) ==========*/
const createSchedule = async (
  doctorUserId: string,
  payload: TCreateSchedulePayload,
) => {
  // Validate doctor user exists and has doctor role
  const doctorUser = await UserModel.findById(doctorUserId);
  if (!doctorUser) {
    throw new NotFoundError("Doctor user not found");
  }

  if (doctorUser.role !== USER_ROLES.DOCTOR) {
    throw new BadRequestError("You are not registered as a doctor");
  }

  // Validate start time is before end time
  if (timeToMinutes(payload.startTime) >= timeToMinutes(payload.endTime)) {
    throw new BadRequestError("startTime must be earlier than endTime");
  }

  // Validate minutes are strictly in 5-minute intervals (00, 05, 10, ..., 55)
  if (
    !isFiveMinuteInterval(payload.startTime) ||
    !isFiveMinuteInterval(payload.endTime)
  ) {
    throw new BadRequestError(
      "startTime and endTime minutes must be in 5-minute intervals (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)",
    );
  }

  // Format times to 12-hour format for database storage
  const formattedStartTime = formatTime12Hour(payload.startTime);
  const formattedEndTime = formatTime12Hour(payload.endTime);

  // Check for overlapping schedule for the doctor on the same day
  const existingSchedules = await ScheduleModel.find({
    doctorUserId: new Types.ObjectId(doctorUserId),
    day: payload.day,
  });

  for (const existing of existingSchedules) {
    if (
      isTimeOverlapping(
        formattedStartTime,
        formattedEndTime,
        existing.startTime,
        existing.endTime,
      )
    ) {
      throw new ConflictError(
        `Schedule overlaps with an existing schedule (${formatTime12Hour(existing.startTime)} - ${formatTime12Hour(existing.endTime)}) on ${payload.day}`,
      );
    }
  }

  const startDateTime = createDateTimeFromTime(payload.startTime);
  const endDateTime = createDateTimeFromTime(payload.endTime);

  const result = await ScheduleModel.create({
    ...payload,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    doctorUserId: new Types.ObjectId(doctorUserId),
    startDateTime,
    endDateTime,
  });

  const created = result.toObject();
  return {
    ...created,
    startTime: formatTime12Hour(created.startTime),
    endTime: formatTime12Hour(created.endTime),
  };
};

/*========== Get My Schedules (Doctor) ==========*/
const getMySchedules = async (
  doctorUserId: string,
  query: { day?: TScheduleDay; isActive?: boolean },
) => {
  const filter: Record<string, unknown> = {
    doctorUserId: new Types.ObjectId(doctorUserId),
  };

  if (query.day) filter.day = query.day;
  if (typeof query.isActive === "boolean") filter.isActive = query.isActive;

  const schedules = await ScheduleModel.find(filter)
    .populate({
      path: "doctorUserId",
      select: "fullName email phone profileImg",
    })
    .lean();

  // Sort by day order then chronological time
  const sorted = schedules.sort((a, b) => {
    const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
    if (dayDiff !== 0) return dayDiff;
    if (a.startDateTime && b.startDateTime) {
      return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  return sorted.map((s) => ({
    ...s,
    startTime: formatTime12Hour(s.startTime),
    endTime: formatTime12Hour(s.endTime),
  }));
};

/*========== Get Doctor Schedules (Public / Patient) ==========*/
const getDoctorSchedules = async (
  doctorUserId: string,
  query: { day?: TScheduleDay; isActive?: boolean },
) => {
  const doctorUser = await UserModel.findById(doctorUserId);
  if (!doctorUser) {
    throw new NotFoundError("Doctor user not found");
  }

  const filter: Record<string, unknown> = {
    doctorUserId: new Types.ObjectId(doctorUserId),
  };

  if (query.day) filter.day = query.day;
  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  } else {
    // Default to active schedules for public viewing
    filter.isActive = true;
  }

  const schedules = await ScheduleModel.find(filter)
    .populate({
      path: "doctorUserId",
      select: "fullName email phone profileImg",
    })
    .lean();

  const sorted = schedules.sort((a, b) => {
    const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
    if (dayDiff !== 0) return dayDiff;
    if (a.startDateTime && b.startDateTime) {
      return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  return sorted.map((s) => ({
    ...s,
    startTime: formatTime12Hour(s.startTime),
    endTime: formatTime12Hour(s.endTime),
  }));
};

/*========== Get Single Schedule ==========*/
const getSingleSchedule = async (scheduleId: string) => {
  const schedule = await ScheduleModel.findById(scheduleId)
    .populate({
      path: "doctorUserId",
      select: "fullName email phone profileImg",
    })
    .lean();

  if (!schedule) {
    throw new NotFoundError("Schedule not found with the provided ID");
  }

  return {
    ...schedule,
    startTime: formatTime12Hour(schedule.startTime),
    endTime: formatTime12Hour(schedule.endTime),
  };
};

/*========== get doctor own schedules ==========*/
const getAllSchedules = async (doctorUserId: string, query: TScheduleQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, SCHEDULE_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        doctorUserId: new Types.ObjectId(doctorUserId),
        ...searchQuery,
        ...filterQuery,
      },
    },
  ];


  const result = await ScheduleModel.aggregate([
    ...commonPipeline,
    { $sort: { startDateTime: 1, endDateTime: 1 } },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
        day: 1,
        isActive: 1,
      }
    }
  ]);

  const totalCountResult = await ScheduleModel.aggregate([
    ...commonPipeline,
    { $count: "totalCount" },
  ]);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: result,
  };
};

/*========== Get Doctor's Schedule by Day ==========*/
const getDoctorSchedulesByDay = async (doctorUserId: string, day: TScheduleDay) => {
  //check doctor
  const doctorUser = await UserModel.findOne({
    _id: doctorUserId,
    role: USER_ROLES.DOCTOR
  });

  if (!doctorUser) {
    throw new NotFoundError("Doctor user not found");
  }

  if (doctorUser.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new ForbiddenError("Doctor is not active");
  }


  const pipeline: PipelineStage[] = [
    {
      $match: {
        doctorUserId: new Types.ObjectId(doctorUserId),
        day,
        isActive: true,
      }
    },
    {
      $sort: {
        startDateTime: 1,
        endDateTime: 1
      },
    },
    {
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
      },
    },
  ];

  const schedules = await ScheduleModel.aggregate(pipeline);
  return schedules;
};

/*========== Update Schedule (Doctor Only - Own Schedule) ==========*/
const updateSchedule = async (
  scheduleId: string,
  doctorUserId: string,
  payload: TUpdateSchedulePayload,
) => {
  const schedule = await ScheduleModel.findById(scheduleId);
  if (!schedule) {
    throw new NotFoundError("Schedule not found with the provided ID");
  }

  // Doctor can only update their own schedule
  if (schedule.doctorUserId.toString() !== doctorUserId) {
    throw new ForbiddenError("You are only authorized to update your own schedule");
  }

  const formattedStartTime = payload.startTime
    ? formatTime12Hour(payload.startTime)
    : undefined;
  const formattedEndTime = payload.endTime
    ? formatTime12Hour(payload.endTime)
    : undefined;

  const targetDay = payload.day || schedule.day;
  const targetStartTime = formattedStartTime || schedule.startTime;
  const targetEndTime = formattedEndTime || schedule.endTime;

  // Validate start time is before end time
  if (timeToMinutes(targetStartTime) >= timeToMinutes(targetEndTime)) {
    throw new BadRequestError("startTime must be earlier than endTime");
  }

  // If day or times are changing, check for overlaps with other schedules
  if (payload.day || payload.startTime || payload.endTime) {
    const existingSchedules = await ScheduleModel.find({
      doctorUserId: schedule.doctorUserId,
      day: targetDay,
      _id: { $ne: schedule._id },
    });

    for (const existing of existingSchedules) {
      if (
        isTimeOverlapping(
          targetStartTime,
          targetEndTime,
          existing.startTime,
          existing.endTime,
        )
      ) {
        throw new ConflictError(
          `Schedule overlaps with an existing schedule (${formatTime12Hour(existing.startTime)} - ${formatTime12Hour(existing.endTime)}) on ${targetDay}`,
        );
      }
    }
  }

  const updateData: Record<string, unknown> = {
    ...payload,
  };

  if (formattedStartTime) {
    updateData.startTime = formattedStartTime;
    updateData.startDateTime = createDateTimeFromTime(formattedStartTime);
  }
  if (formattedEndTime) {
    updateData.endTime = formattedEndTime;
    updateData.endDateTime = createDateTimeFromTime(formattedEndTime);
  }

  const updatedSchedule = await ScheduleModel.findByIdAndUpdate(
    scheduleId,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate({
      path: "doctorUserId",
      select: "fullName email phone profileImg",
    })
    .lean();

  if (!updatedSchedule) return null;

  return {
    ...updatedSchedule,
    startTime: formatTime12Hour(updatedSchedule.startTime),
    endTime: formatTime12Hour(updatedSchedule.endTime),
  };
};

/*========== Update Schedule (Doctor Only - Own Schedule) ==========*/
const updateScheduleStatus = async (
  doctorUserId: string,
  scheduleId: string,
  payload: { isActive: boolean },
) => {
  const schedule = await ScheduleModel.findById(scheduleId);
  if (!schedule) {
    throw new NotFoundError("Schedule not found with the provided ID");
  }

  // Doctor can only update their own schedule
  if (schedule.doctorUserId.toString() !== doctorUserId) {
    throw new ForbiddenError("You are only authorized to update your own schedule");
  }

  //check status
  if (schedule.isActive === payload.isActive) {
    throw new ConflictError(`This schedule is already ${payload.isActive ? 'active' : 'inactive'}.`);
  }

  const result = await ScheduleModel.updateOne(
    {
      _id: scheduleId,
      doctorUserId
    },
    payload
  )

  return result;

};

/*========== Delete Schedule (Doctor Only - Own Schedule) ==========*/
const deleteSchedule = async (
  doctorUserId: string,
  scheduleId: string,
) => {
  const schedule = await ScheduleModel.findById(scheduleId);
  if (!schedule) {
    throw new NotFoundError("Schedule not found with the provided ID");
  }

  // Doctor can only delete their own schedule
  if (schedule.doctorUserId.toString() !== doctorUserId) {
    throw new ForbiddenError("You are only authorized to delete your own schedule");
  }

  const result = await ScheduleModel.deleteOne({
    _id: scheduleId,
    doctorUserId
  })
  return result;
};

const ScheduleService = {
  createSchedule,
  getMySchedules,
  getDoctorSchedules,
  getSingleSchedule,
  getDoctorSchedulesByDay,
  getAllSchedules,
  updateSchedule,
  updateScheduleStatus,
  deleteSchedule,
};

export default ScheduleService;
