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
  getPublishedHospitalsValidationSchema,
  getSinglePublishedHospitalValidationSchema,
  updateHospitalValidationSchema,
} from "./hospital.validation";
import subAgentAuthMiddleware from "../../middlewares/subAgentAuthMIddleware";

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
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.AGENT),
  validationMiddleware(getHospitalsValidationSchema),
  HospitalController.getHospitals,
);

router.get(
  "/get-sub-agent-hospitals",
  subAgentAuthMiddleware(),
  validationMiddleware(getHospitalsValidationSchema),
  HospitalController.getHospitals,
);

router.get(
  "/published-hospitals",
  validationMiddleware(getPublishedHospitalsValidationSchema),
  HospitalController.getPublishedHospitals,
);

router.get(
  "/agent-country-stats",
  authMiddleware(USER_ROLES.AGENT),
  HospitalController.getHospitalCountryStats,
);

router.get(
  "/sub-agent-country-stats",
  subAgentAuthMiddleware(),
  HospitalController.getHospitalCountryStats,
);

router.get(
  "/single-published-hospital/:hospitalId",
  validationMiddleware(getSinglePublishedHospitalValidationSchema),
  HospitalController.getSinglePublishedHospital,
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
