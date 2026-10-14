import express from "express";
import DoctorController from "./doctor.controller";
import validationMiddleware from "../../middlewares/validationMiddleware";
import {
  createDoctorValidationSchema,
  deleteDoctorValidationSchema,
  updateDoctorValidationSchema,
} from "./doctor.validation";
import authMiddleware from "../../middlewares/authMiddleware";
import { USER_ROLES } from "../user/user.constant";

const router = express.Router();

router.post(
  "/create-doctor",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(createDoctorValidationSchema),
  DoctorController.createDoctor,
);

router.get(
  "/get-doctors",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  DoctorController.getDoctors,
);

router.get(
  "/get-doctor/:doctorId",
  DoctorController.getDoctorById,
);

router.patch(
  "/update-doctor/:doctorId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(updateDoctorValidationSchema),
  DoctorController.updateDoctor,
);

router.delete(
  "/delete-doctor/:doctorId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteDoctorValidationSchema),
  DoctorController.deleteDoctor,
);

const DoctorRoutes = router;
export default DoctorRoutes;
