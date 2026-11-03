import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import AppointmentController from "./appointment.controller";
import {
  bookAppointmentValidationSchema,
  getAllAppointmentsValidationSchema,
  getDoctorAppointmentsValidationSchema,
  getSingleAppointmentValidationSchema,
  updateAppointmentStatusValidationSchema,
  getMyAppointmentsValidationSchema,
} from "./appointment.validation";

const router = express.Router();

/* Public / Any user: Book appointment */
router.post(
  "/book-appointment",
  validationMiddleware(bookAppointmentValidationSchema),
  AppointmentController.bookAppointment,
);

/* Doctor: Get own appointments */
router.get(
  "/my-appointments",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(getMyAppointmentsValidationSchema),
  AppointmentController.getMyAppointments,
);

/* Admin: Get all appointments with pagination, filters and search */
router.get(
  "/all-appointments",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getAllAppointmentsValidationSchema),
  AppointmentController.getAllAppointments,
);

/* Doctor / Admin: Get appointments of a specific doctor */
router.get(
  "/doctor/:doctorUserId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.DOCTOR),
  validationMiddleware(getDoctorAppointmentsValidationSchema),
  AppointmentController.getDoctorAppointments,
);


/* Get single appointment by ID */
router.get(
  "/single-appointment/:appointmentId",
  validationMiddleware(getSingleAppointmentValidationSchema),
  AppointmentController.getSingleAppointment,
);

/* Doctor / Admin: Update appointment status (confirm, complete, cancel) */
router.patch(
  "/update-status/:appointmentId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(updateAppointmentStatusValidationSchema),
  AppointmentController.updateAppointmentStatus,
);

/* Doctor / Admin: Delete appointment */
router.delete(
  "/delete-appointment/:appointmentId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getSingleAppointmentValidationSchema),
  AppointmentController.deleteAppointment,
);

const AppointmentRoutes = router;
export default AppointmentRoutes;

