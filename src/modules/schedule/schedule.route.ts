import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import ScheduleController from "./schedule.controller";
import {
  createScheduleValidationSchema,
  deleteScheduleValidationSchema,
  getDoctorSchedulesByDayValidationSchema,
  getDoctorSchedulesValidationSchema,
  getSchedulesValidationSchema,
  getSingleScheduleValidationSchema,
  updateScheduleStatusValidationSchema,
  updateScheduleValidationSchema,
} from "./schedule.validation";

const router = express.Router();

/* Doctor: Create own schedule */
router.post(
  "/create-schedule",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(createScheduleValidationSchema),
  ScheduleController.createSchedule,
);

/* Doctor: Get own schedules */
router.get(
  "/my-schedules",
  authMiddleware(USER_ROLES.DOCTOR),
  ScheduleController.getMySchedules,
);

/* Public / Authenticated: Get schedules of a specific doctor */
router.get(
  "/doctor/:doctorUserId",
  validationMiddleware(getDoctorSchedulesValidationSchema),
  ScheduleController.getDoctorSchedules,
);

/* Doctor: Get all schedules with pagination, filters and search */
router.get(
  "/all-schedules",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(getSchedulesValidationSchema),
  ScheduleController.getAllSchedules,
);

/* Get single schedule by ID */
router.get(
  "/single-schedule/:scheduleId",
  validationMiddleware(getSingleScheduleValidationSchema),
  ScheduleController.getSingleSchedule,
);

router.get(
  "/doctor-schedules/:doctorUserId/:day",
  validationMiddleware(getDoctorSchedulesByDayValidationSchema),
  ScheduleController.getDoctorSchedulesByDay,
);

/* Doctor: Update own schedule status */
router.patch(
  "/update-schedule-status/:scheduleId",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(updateScheduleStatusValidationSchema),
  ScheduleController.updateScheduleStatus,
);

/* Doctor: Delete own schedule */
router.delete(
  "/delete-schedule/:scheduleId",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(deleteScheduleValidationSchema),
  ScheduleController.deleteSchedule,
);

const ScheduleRoutes = router;
export default ScheduleRoutes;
