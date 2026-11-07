import { PipelineStage, Types } from "mongoose";
import ConflictError from "../../errors/ConflictError";
import ForbiddenError from "../../errors/ForbiddenError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { ACCOUNT_STATUS, USER_ROLES } from "../user/user.constant";
import UserModel from "../user/user.model";
import {
  APPOINTMENT_SEARCHABLE_FIELDS,
  APPOINTMENT_STATUS,
  PATIENT_OWN_APPOINTMENT_SEARCHABLE_FIELDS,
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

/*========== Book Appointment login petient ==========*/
const bookAppointmentByLoginPatient = async (patientUserId: string, payload: TBookAppointmentPayload) => {
  const { scheduleId, appointmentDate, problem } = payload;

  // check patient
  const patientUser = await UserModel.findOne({
    _id: new Types.ObjectId(patientUserId),
    role: USER_ROLES.PATIENT,
  })
  if (!patientUser) {
    throw new NotFoundError("Patient not found")
  }

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
    fullName: patientUser.fullName,
    email: patientUser.email,
    phone: patientUser.phone,
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
    {
      $project: {
        doctorUserId: 0
      }
    }
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

/*========== Get My Patients (Doctor - Unique Patients Grouped by Email) ==========*/
const getMyPatients = async (
  doctorUserId: string,
  query: {
    searchTerm?: string;
    page?: string | number;
    limit?: string | number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "lastAppointmentDate",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchCondition: Record<string, unknown> = {};
  if (searchTerm && searchTerm.trim()) {
    searchCondition = {
      $or: [
        { fullName: { $regex: searchTerm.trim(), $options: "i" } },
        { email: { $regex: searchTerm.trim(), $options: "i" } },
        { phone: { $regex: searchTerm.trim(), $options: "i" } },
      ],
    };
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        doctorUserId: new Types.ObjectId(doctorUserId),
        ...searchCondition,
      },
    },
    // Sort appointments descending by appointmentDate/createdAt so that $first picks the latest appointment
    {
      $sort: { appointmentDate: -1, createdAt: -1 },
    },
    // Group by email (case-insensitive)
    {
      $group: {
        _id: { $toLower: "$email" },
        email: { $first: "$email" },
        patientEmail: { $first: "$email" },
        fullName: { $first: "$fullName" },
        patientName: { $first: "$fullName" },
        phone: { $first: "$phone" },
        patientPhone: { $first: "$phone" },
        patientPhoneNumber: { $first: "$phone" },
        bloodGroup: { $first: "$bloodGroup" },
        dateOfBirth: { $first: "$dateOfBirth" },
        totalAppointments: { $sum: 1 },
        totalBookings: { $sum: 1 },
        appointmentCount: { $sum: 1 },
        bookingCount: { $sum: 1 },
        lastAppointmentDate: { $first: "$appointmentDate" },
        lastAppointmentSchedule: { $first: "$schedule" },
        lastAppointment: {
          $first: {
            _id: "$_id",
            appointmentCode: "$appointmentCode",
            appointmentDate: "$appointmentDate",
            schedule: "$schedule",
            problem: "$problem",
            status: "$status",
          },
        },
      },
    },
    // Lookup registered user info if patient has an account in users collection
    {
      $lookup: {
        from: "users",
        localField: "email",
        foreignField: "email",
        as: "registeredUser",
      },
    },
    {
      $unwind: {
        path: "$registeredUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: "$email",
        patientName: "$fullName",
        fullName: "$fullName",
        email: "$email",
        patientEmail: "$email",
        phone: "$phone",
        patientPhone: "$phone",
        patientPhoneNumber: "$phone",
        profileImg: "$registeredUser.profileImg",
        bloodGroup: "$bloodGroup",
        dateOfBirth: "$dateOfBirth",
        totalAppointments: "$totalAppointments",
        totalBookings: "$totalBookings",
        appointmentCount: "$appointmentCount",
        bookingCount: "$bookingCount",
        lastAppointmentDate: "$lastAppointmentDate",
        lastAppointmentSchedule: "$lastAppointmentSchedule",
        lastAppointment: "$lastAppointment",
      },
    },
  ];

  const patients = await AppointmentModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await AppointmentModel.aggregate([
    {
      $match: {
        doctorUserId: new Types.ObjectId(doctorUserId),
        ...searchCondition,
      },
    },
    {
      $group: {
        _id: { $toLower: "$email" },
      },
    },
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
      totalPatients: totalCount,
    },
    data: patients,
  };
};

/*========== Get Patient Own Appointments (Patient) ==========*/
const getPatientOwnAppointments = async (
  patientEmail: string,
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
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, PATIENT_OWN_APPOINTMENT_SEARCHABLE_FIELDS);
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
        email: patientEmail,
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
        appointmentCode: "$appointmentCode",
        doctorUserId: "$doctorUserId",
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorProfileImg: "$doctorUser.profileImg",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctorConsultationFee: "$doctorProfile.consultationFee",
        appointmentDate: "$appointmentDate",
        schedule: "$schedule",
        problem: "$problem",
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

/*========== get appointment stats (Admin) ==============*/
const getAppointmentStats = async () => {
  const result = await AppointmentModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      }
    }
  ]);

  // Initialize all possible statuses with 0
  const stats = {
    total: 0,
    pending: 0,
    completed: 0,
    confirmed: 0,
    cancelled: 0
  };

  // Populate counts and calculate the total
  result.forEach(item => {
    if (stats.hasOwnProperty(item._id)) {
      stats[item._id as keyof typeof stats] = item.count;
      stats.total += item.count;
    }
  });

  return stats;
};

const AppointmentService = {
  bookAppointment,
  bookAppointmentByLoginPatient,
  getMyAppointments,
  getMyPatients,
  getPatientOwnAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentStats
};

export default AppointmentService;

