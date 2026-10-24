import asyncHandler from "../../utils/asyncHandler";
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

/*========== Get All Schedules (Admin) ==========*/
const getAllSchedules = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const result = await ScheduleService.getAllSchedules(validatedQuery);

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

/*========== Delete Schedule (Doctor Only - Own Schedule) ==========*/
const deleteSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);

  const result = await ScheduleService.deleteSchedule(
    scheduleId as string,
    doctorUserId,
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
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
};

export default ScheduleController;
