import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import ComparisonController from "./comparison.controller";
import {
  compareSearchValidationSchema,
  createComparisonValidationSchema,
  deleteComparisonValidationSchema,
  updateComparisonValidationSchema,
} from "./comparison.validation";

const router = express.Router();

/* Public routes for visitors & frontend */
router.get("/get-comparisons", ComparisonController.getComparisons);
router.get("/popular-comparisons", ComparisonController.getPopularComparisons);
router.get(
  "/compare",
  validationMiddleware(compareSearchValidationSchema),
  ComparisonController.compareSideBySide,
);
router.get("/options", ComparisonController.getComparisonOptions);
router.get("/stats", ComparisonController.getComparisonStats);
router.get("/get-comparison/:comparisonId", ComparisonController.getComparisonById);

/* Admin routes for management */
router.post(
  "/create-comparison",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(createComparisonValidationSchema),
  ComparisonController.createComparison,
);

router.post(
  "/seed-sample",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ComparisonController.seedScreenshotComparisons,
);

router.patch(
  "/update-comparison/:comparisonId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(updateComparisonValidationSchema),
  ComparisonController.updateComparison,
);

router.delete(
  "/delete-comparison/:comparisonId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteComparisonValidationSchema),
  ComparisonController.deleteComparison,
);

const ComparisonRoutes = router;
export default ComparisonRoutes;
