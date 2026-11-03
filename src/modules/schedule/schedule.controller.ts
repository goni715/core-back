import asyncHandler from "../../utils/asyncHandler";
import { TScheduleDay } from "./schedule.interface";
import ScheduleService from "./schedule.service";

/*========== Create Schedule (Doctor Only - Own Schedule) ==========*/
const createSchedule = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);

  const result = await ScheduleService.createSchedule(doctorUserId, req.body);

  res.status(201).json({
    success: true,
    message: "Schedule created successfully",
    data: result,
  });
});

/*========== Get My Schedules (Doctor) ==========*/
const getMySchedules = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const validatedQuery = (req as any).validatedQuery || req.query;

  const result = await ScheduleService.getMySchedules(
    doctorUserId,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "My schedules retrieved successfully",
    data: result,
  });
});

/*========== Get Doctor Schedules (Public / Patient) ==========*/
const getDoctorSchedules = asyncHandler(async (req, res) => {
  const { doctorUserId } = req.params;
  const validatedQuery = (req as any).validatedQuery || req.query;

  const result = await ScheduleService.getDoctorSchedules(
    doctorUserId as string,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "Doctor schedules retrieved successfully",
    data: result,
  });
});

/*========== Get Single Schedule ==========*/
const getSingleSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const result = await ScheduleService.getSingleSchedule(scheduleId as string);

  res.status(200).json({
    success: true,
    message: "Schedule retrieved successfully",
    data: result,
  });
});

/*========== Get Doctor Schedule by Day ==========*/
const getDoctorSchedulesByDay = asyncHandler(async (req, res) => {
  const { doctorUserId, day } = req.params;

  const result = await ScheduleService.getDoctorSchedulesByDay(
    doctorUserId as string,
    day as TScheduleDay,
  );

  res.status(200).json({
    success: true,
    message: "Doctor schedules retrieved successfully",
    data: result,
  });
});

/*========== Get All Schedules (Doctor) ==========*/
const getAllSchedules = asyncHandler(async (req, res) => {
  const { userId } = req.headers;
  const validatedQuery = (req as any).validatedQuery;
  const result = await ScheduleService.getAllSchedules(userId as string, validatedQuery);

  res.status(200).json({
    success: true,
    message: "Schedules retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*========== Update Schedule (Doctor Only - Own Schedule) ==========*/
const updateSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);

  const result = await ScheduleService.updateSchedule(
    scheduleId as string,
    doctorUserId,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Schedule updated successfully",
    data: result,
  });
});

/*========== Update Schedule (Doctor Only - Own Schedule) ==========*/
const updateScheduleStatus = asyncHandler(async (req, res) => {
  const { userId } = req.headers;
  const { scheduleId } = req.params;

  const result = await ScheduleService.updateScheduleStatus(
    userId as string,
    scheduleId as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Schedule status updated successfully",
    data: result,
  });
});

/*========== Delete Schedule (Doctor Only - Own Schedule) ==========*/
const deleteSchedule = asyncHandler(async (req, res) => {
  const { userId } = req.headers;
  const { scheduleId } = req.params;

  const result = await ScheduleService.deleteSchedule(
    userId as string,
    scheduleId as string,
  );

  res.status(200).json({
    success: true,
    message: "Schedule deleted successfully",
    data: result,
  });
});

const ScheduleController = {
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

export default ScheduleController;
