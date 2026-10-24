import { PipelineStage, Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import ConflictError from "../../errors/ConflictError";
import ForbiddenError from "../../errors/ForbiddenError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { USER_ROLES } from "../user/user.constant";
import UserModel from "../user/user.model";
import {
  SCHEDULE_DAYS,
  SCHEDULE_SEARCHABLE_FIELDS,
} from "./schedule.constant";
import {
  ISchedule,
  TCreateSchedulePayload,
  TScheduleDay,
  TScheduleQuery,
  TUpdateSchedulePayload,
} from "./schedule.interface";
import ScheduleModel from "./schedule.model";

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

// Convert HH:mm to minutes since midnight
const timeToMinutes = (time: string): number => {
  const parts = time.split(":").map(Number);
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
  if (payload.startTime >= payload.endTime) {
    throw new BadRequestError("startTime must be earlier than endTime");
  }

  // Check for overlapping schedule for the doctor on the same day
  const existingSchedules = await ScheduleModel.find({
    doctorUserId: new Types.ObjectId(doctorUserId),
    day: payload.day,
  });

  for (const existing of existingSchedules) {
    if (
      isTimeOverlapping(
        payload.startTime,
        payload.endTime,
        existing.startTime,
        existing.endTime,
      )
    ) {
      throw new ConflictError(
        `Schedule overlaps with an existing schedule (${existing.startTime} - ${existing.endTime}) on ${payload.day}`,
      );
    }
  }

  const result = await ScheduleModel.create({
    ...payload,
    doctorUserId: new Types.ObjectId(doctorUserId),
  });

  return await ScheduleModel.findById(result._id).populate({
    path: "doctorUserId",
    select: "fullName email phone profileImg",
  });
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

  // Sort by day order then startTime
  return schedules.sort((a, b) => {
    const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
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

  return schedules.sort((a, b) => {
    const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
};

/*========== Get Single Schedule ==========*/
const getSingleSchedule = async (scheduleId: string) => {
  const schedule = await ScheduleModel.findById(scheduleId).populate({
    path: "doctorUserId",
    select: "fullName email phone profileImg",
  });

  if (!schedule) {
    throw new NotFoundError("Schedule not found with the provided ID");
  }

  return schedule;
};

/*========== Get All Schedules (Admin / Search) ==========*/
const getAllSchedules = async (query: TScheduleQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    doctorUserId,
    day,
    isActive,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, SCHEDULE_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (doctorUserId) {
    filterQuery.doctorUserId = new Types.ObjectId(doctorUserId);
  }

  if (day) {
    filterQuery.day = day;
  }

  if (typeof isActive === "boolean") {
    filterQuery.isActive = isActive;
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorUserId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    { $unwind: "$doctorUser" },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorUserId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        doctorUserId: 1,
        day: 1,
        startTime: 1,
        endTime: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        doctor: {
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
      },
    },
  ];

  const result = await ScheduleModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
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

  const targetDay = payload.day || schedule.day;
  const targetStartTime = payload.startTime || schedule.startTime;
  const targetEndTime = payload.endTime || schedule.endTime;

  // Validate start time is before end time
  if (targetStartTime >= targetEndTime) {
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
          `Schedule overlaps with an existing schedule (${existing.startTime} - ${existing.endTime}) on ${targetDay}`,
        );
      }
    }
  }

  const updatedSchedule = await ScheduleModel.findByIdAndUpdate(
    scheduleId,
    payload,
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "doctorUserId",
    select: "fullName email phone profileImg",
  });

  return updatedSchedule;
};

/*========== Delete Schedule (Doctor Only - Own Schedule) ==========*/
const deleteSchedule = async (
  scheduleId: string,
  doctorUserId: string,
) => {
  const schedule = await ScheduleModel.findById(scheduleId);
  if (!schedule) {
    throw new NotFoundError("Schedule not found with the provided ID");
  }

  // Doctor can only delete their own schedule
  if (schedule.doctorUserId.toString() !== doctorUserId) {
    throw new ForbiddenError("You are only authorized to delete your own schedule");
  }

  await ScheduleModel.findByIdAndDelete(scheduleId);
  return schedule;
};

const ScheduleService = {
  createSchedule,
  getMySchedules,
  getDoctorSchedules,
  getSingleSchedule,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
};

export default ScheduleService;
