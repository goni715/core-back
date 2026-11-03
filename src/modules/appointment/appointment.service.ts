import { PipelineStage, Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import ConflictError from "../../errors/ConflictError";
import ForbiddenError from "../../errors/ForbiddenError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { ACCOUNT_STATUS, USER_ROLES } from "../user/user.constant";
import UserModel from "../user/user.model";
import {
  APPOINTMENT_SEARCHABLE_FIELDS,
  APPOINTMENT_STATUS,
} from "./appointment.constant";
import {
  TAppointmentQuery,
  TBookAppointmentPayload,
  TUpdateAppointmentStatusPayload,
} from "./appointment.interface";
import AppointmentModel, { generateAppointmentCode } from "./appointment.model";
import ScheduleModel from "../schedule/schedule.model";

/*========== Book Appointment (Public / Any User) ==========*/
const bookAppointment = async (payload: TBookAppointmentPayload) => {
  const { scheduleId, appointmentDate, fullName, email, phone, problem } = payload;

  //check schedule
  const schedule = await ScheduleModel.findOne({
    _id: new Types.ObjectId(scheduleId),
  });

  if (!schedule) {
    throw new NotFoundError("Schedule not found with the provided ID");
  }

  //check schedule is not active
  if (!schedule.isActive) {
    throw new ConflictError("This schedule is not active.");
  }

  // check doctor
  const doctorUser = await UserModel.findOne({
    _id: new Types.ObjectId(schedule.doctorUserId),
    role: USER_ROLES.DOCTOR,
  });

  if (!doctorUser) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }

  //check doctor is not active
  if (doctorUser.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new ConflictError("The associated doctor is not active.");
  }

  //check day
  const dayName = new Date(appointmentDate).toLocaleDateString("en-US", { weekday: "short" });
  if (schedule.day !== dayName) {
    throw new ConflictError(`This schedule is not active on ${dayName}.`);
  }

  const scheduleTime = `${schedule.startTime} - ${schedule.endTime}`;

  // 3. Check if the doctor already has a booked appointment for this schedule slot on this date
  const existingSlotAppointment = await AppointmentModel.findOne({
    doctorUserId: schedule.doctorUserId,
    appointmentDate: new Date(appointmentDate),
    schedule: scheduleTime,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
  });

  if (existingSlotAppointment) {
    throw new ConflictError(
      `The schedule slot "${scheduleTime}" is already booked for this doctor on the selected date. Please select another slot.`,
    );
  }

  // 4. Calculate daily serial number for that doctor on that date
  const sameDayAppointmentsCount = await AppointmentModel.countDocuments({
    doctorUserId: schedule.doctorUserId,
    appointmentDate: new Date(appointmentDate),
  });

  const serialNumber = sameDayAppointmentsCount + 1;

  // 5. Generate unique appointmentCode
  const appointmentCode = generateAppointmentCode();


  // 7. Create appointment document
  const result = await AppointmentModel.create({
    appointmentCode,
    doctorUserId: schedule.doctorUserId,
    fullName,
    email,
    phone,
    appointmentDate: new Date(appointmentDate),
    schedule: scheduleTime,
    problem,
    dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
    status: APPOINTMENT_STATUS.PENDING,
    serialNumber,
  });

  return result;
};

/*========== Get My Appointments (Doctor) ==========*/
const getMyAppointments = async (
  doctorUserId: string,
  query: TAppointmentQuery,
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    appointmentDate,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, APPOINTMENT_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  //filter by appointment date
  if (appointmentDate) {
    filterQuery = {
      ...filterQuery,
      appointmentDate: new Date(appointmentDate),
    }
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


  const result = await AppointmentModel.aggregate([
    ...commonPipeline,
    { $sort: { appointmentDate: 1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await AppointmentModel.aggregate([
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

/*========== Get All Appointments (Admin / Super Admin) ==========*/
const getAllAppointments = async (query: TAppointmentQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "appointmentDate",
    sortOrder = "desc",
    doctorUserId,
    appointmentDate,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, APPOINTMENT_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (doctorUserId) {
    filterQuery.doctorUserId = new Types.ObjectId(doctorUserId);
  }

  //filter by appointment date
  if (appointmentDate) {
    filterQuery = {
      ...filterQuery,
      appointmentDate: new Date(appointmentDate),
    }
  }


  const commonPipeline: PipelineStage[] = [
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
        appointmentCode: "$appointmentCode",
        patientName: "$fullName",
        patientEmail: "$email",
        patientPhone: "$phone",
        doctorUserId: "$doctorUserId",
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorProfileImg: "$doctorUser.profileImg",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation", 
        appointmentDate: "$appointmentDate",
        schedule: "$schedule",
        problem: "$problem",
        bloodGroup: "$bloodGroup",
        dateOfBirth: "$dateOfBirth",
        status: "$status",
        serialNumber: "$serialNumber",
        cancelReason: "$cancelReason",
        doctorNotes: "$doctorNotes",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
      },
    },
  ];

  const result = await AppointmentModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await AppointmentModel.aggregate([
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

/*========== Get Doctor Appointments (By Doctor ID) ==========*/
const getDoctorAppointments = async (
  doctorUserId: string,
  query: TAppointmentQuery,
) => {
  const doctor = await UserModel.findById(doctorUserId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }
  return await getMyAppointments(doctorUserId, query);
};

/*========== Get Single Appointment ==========*/
const getSingleAppointment = async (appointmentId: string) => {
  const appointment = await AppointmentModel.findById(appointmentId)
    .populate({
      path: "doctorUserId",
      select: "fullName email phone profileImg",
    })
    .populate({
      path: "patientUserId",
      select: "fullName email phone profileImg",
    });

  if (!appointment) {
    throw new NotFoundError("Appointment not found with the provided ID");
  }

  return appointment;
};

/*========== Update Appointment Status (Doctor / Admin) ==========*/
const updateAppointmentStatus = async (
  appointmentId: string,
  user: { userId: string; role: string },
  payload: TUpdateAppointmentStatusPayload,
) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) {
    throw new NotFoundError("Appointment not found with the provided ID");
  }

  // If user is doctor, they can only update their own appointments
  if (
    user.role === USER_ROLES.DOCTOR &&
    appointment.doctorUserId.toString() !== user.userId
  ) {
    throw new ForbiddenError(
      "You are only authorized to update status for your own appointments",
    );
  }

  const updateData: Record<string, unknown> = {
    status: payload.status,
  };

  if (payload.cancelReason !== undefined) {
    updateData.cancelReason = payload.cancelReason;
  }

  if (payload.doctorNotes !== undefined) {
    updateData.doctorNotes = payload.doctorNotes;
  }

  const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
    appointmentId,
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
    .populate({
      path: "patientUserId",
      select: "fullName email phone profileImg",
    });

  return updatedAppointment;
};

/*========== Delete Appointment (Doctor / Admin) ==========*/
const deleteAppointment = async (
  appointmentId: string,
  user: { userId: string; role: string },
) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) {
    throw new NotFoundError("Appointment not found with the provided ID");
  }

  if (
    user.role === USER_ROLES.DOCTOR &&
    appointment.doctorUserId.toString() !== user.userId
  ) {
    throw new ForbiddenError(
      "You are only authorized to delete your own appointments",
    );
  }

  await AppointmentModel.findByIdAndDelete(appointmentId);
  return appointment;
};

const AppointmentService = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  getSingleAppointment,
  updateAppointmentStatus,
  deleteAppointment,
};

export default AppointmentService;

