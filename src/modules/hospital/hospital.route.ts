import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import upload from "../../helpers/upload";
import { USER_ROLES } from "../user/user.constant";
import HospitalController from "./hospital.controller";
import {
  createHospitalValidationSchema,
  deleteHospitalValidationSchema,
  getHospitalsValidationSchema,
  updateHospitalValidationSchema,
} from "./hospital.validation";

const router = express.Router();

router.post(
  "/create-hospital",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("image"),
  validationMiddleware(createHospitalValidationSchema),
  HospitalController.createHospital,
);

router.get(
  "/get-hospitals",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getHospitalsValidationSchema),
  HospitalController.getHospitals,
);

router.get(
  "/get-hospital/:hospitalId",
  HospitalController.getHospitalById,
);

router.patch(
  "/update-hospital/:hospitalId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("image"),
  validationMiddleware(updateHospitalValidationSchema),
  HospitalController.updateHospital,
);

router.delete(
  "/delete-hospital/:hospitalId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteHospitalValidationSchema),
  HospitalController.deleteHospital,
);

const HospitalRoutes = router;
export default HospitalRoutes;
