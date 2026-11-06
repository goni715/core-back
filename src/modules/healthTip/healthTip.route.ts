import express from "express";
import upload from "../../helpers/upload";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import HealthTipController from "./healthTip.controller";
import {
  createHealthTipValidationSchema,
  deleteHealthTipValidationSchema,
  getHealthTipsValidationSchema,
  getPublishedHealthTipsValidationSchema,
  getSingleHealthTipValidationSchema,
  updateHealthTipValidationSchema,
} from "./healthTip.validation";

const router = express.Router();

router.post(
  "/create-health-tip",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("image"),
  validationMiddleware(createHealthTipValidationSchema),
  HealthTipController.createHealthTip,
);

router.get(
  "/health-tips",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getHealthTipsValidationSchema),
  HealthTipController.getHealthTips,
);

router.get(
  "/published-tips",
  validationMiddleware(getPublishedHealthTipsValidationSchema),
  HealthTipController.getPublishedHealthTips,
);

router.get(
  "/single-tip/:identifier",
  validationMiddleware(getSingleHealthTipValidationSchema),
  HealthTipController.getSingleHealthTip,
);

router.patch(
  "/update-health-tip/:healthTipId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("image"),
  validationMiddleware(updateHealthTipValidationSchema),
  HealthTipController.updateHealthTip,
);

router.delete(
  "/delete-health-tip/:healthTipId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteHealthTipValidationSchema),
  HealthTipController.deleteHealthTip,
);

router.patch(
  "/share/:healthTipId",
  HealthTipController.incrementShareCount,
);

const HealthTipRoutes = router;
export default HealthTipRoutes;

