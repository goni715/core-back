import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import ConsultationController from "./consultation.controller";
import {
  addMedicineValidationSchema,
  createConsultationValidationSchema,
  deleteConsultationValidationSchema,
  deleteMedicineValidationSchema,
  getByAppointmentValidationSchema,
  getConsultationsQueryValidationSchema,
  getSingleConsultationValidationSchema,
  updateConsultationValidationSchema,
  updateMedicineValidationSchema,
} from "./consultation.validation";

const router = express.Router();

router.post(
  "/create-consultation",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(createConsultationValidationSchema),
  ConsultationController.createConsultation,
);

router.get(
  "/my-consultations",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(getConsultationsQueryValidationSchema),
  ConsultationController.getMyConsultations,
);

router.get(
  "/patient-consultations",
  authMiddleware(
    USER_ROLES.PATIENT,
    USER_ROLES.DOCTOR,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  validationMiddleware(getConsultationsQueryValidationSchema),
  ConsultationController.getPatientConsultations,
);

router.get(
  "/all-consultations",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getConsultationsQueryValidationSchema),
  ConsultationController.getAllConsultations,
);

router.get(
  "/by-appointment/:appointmentId",
  authMiddleware(
    USER_ROLES.DOCTOR,
    USER_ROLES.PATIENT,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  validationMiddleware(getByAppointmentValidationSchema),
  ConsultationController.getConsultationByAppointment,
);

router.get(
  "/single-consultation/:consultationId",
  authMiddleware(
    USER_ROLES.DOCTOR,
    USER_ROLES.PATIENT,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  validationMiddleware(getSingleConsultationValidationSchema),
  ConsultationController.getSingleConsultation,
);

router.patch(
  "/update-consultation/:consultationId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(updateConsultationValidationSchema),
  ConsultationController.updateConsultation,
);

router.delete(
  "/delete-consultation/:consultationId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteConsultationValidationSchema),
  ConsultationController.deleteConsultation,
);

/*========== Standalone Medicine Routes ==========*/
router.post(
  "/add-medicine/:consultationId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(addMedicineValidationSchema),
  ConsultationController.addMedicineToConsultation,
);

router.patch(
  "/update-medicine/:medicineId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(updateMedicineValidationSchema),
  ConsultationController.updateMedicine,
);

router.delete(
  "/delete-medicine/:medicineId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteMedicineValidationSchema),
  ConsultationController.deleteMedicine,
);

const ConsultationRoutes = router;
export default ConsultationRoutes;
