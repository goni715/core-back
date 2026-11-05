import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import AppointmentController from "./appointment.controller";
import {
  bookAppointmentValidationSchema,
  getAllAppointmentsValidationSchema,
  getSingleAppointmentValidationSchema,
  updateAppointmentStatusValidationSchema,
  getMyAppointmentsValidationSchema,
  bookAppointmentByLoginPatientValidationSchema,
} from "./appointment.validation";

const router = express.Router();

/* Public / Any user: Book appointment */
router.post(
  "/book-appointment",
  validationMiddleware(bookAppointmentValidationSchema),
  AppointmentController.bookAppointment,
);

/* Public / Log in patient: Book appointment */
router.post(
  "/book-appointment-by-login-patient",
  authMiddleware(USER_ROLES.PATIENT),
  validationMiddleware(bookAppointmentByLoginPatientValidationSchema),
  AppointmentController.bookAppointmentByLoginPatient,
);

/* Doctor: Get own appointments */
router.get(
  "/my-appointments",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(getMyAppointmentsValidationSchema),
  AppointmentController.getMyAppointments,
);

router.get(
  "/patient-own-appointments",
  authMiddleware(USER_ROLES.PATIENT),
  validationMiddleware(getMyAppointmentsValidationSchema),
  AppointmentController.getPatientOwnAppointments,
);

/* Admin: Get all appointments with pagination, filters and search */
router.get(
  "/all-appointments",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getAllAppointmentsValidationSchema),
  AppointmentController.getAllAppointments,
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

router.get(
  "/stats",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AppointmentController.getAppointmentStats,
);

const AppointmentRoutes = router;
export default AppointmentRoutes;

