import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import TestReportController from "./testReport.controller";
import {
  createTestReportValidationSchema,
  deleteTestReportValidationSchema,
  getSingleTestReportValidationSchema,
  getTestReportsValidationSchema,
  updateTestReportValidationSchema,
} from "./testReport.validation";

const router = express.Router();

router.post(
  "/create-report",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(createTestReportValidationSchema),
  TestReportController.createTestReport,
);

router.get(
  "/my-reports",
  authMiddleware(USER_ROLES.DOCTOR),
  validationMiddleware(getTestReportsValidationSchema),
  TestReportController.getMyTestReports,
);

router.get(
  "/patient-reports",
  authMiddleware(
    USER_ROLES.PATIENT,
    USER_ROLES.DOCTOR,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  validationMiddleware(getTestReportsValidationSchema),
  TestReportController.getPatientTestReports,
);

router.get(
  "/all-reports",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getTestReportsValidationSchema),
  TestReportController.getAllTestReports,
);

router.get(
  "/single-report/:identifier",
  authMiddleware(
    USER_ROLES.DOCTOR,
    USER_ROLES.PATIENT,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
  ),
  validationMiddleware(getSingleTestReportValidationSchema),
  TestReportController.getSingleTestReport,
);

router.patch(
  "/update-report/:testReportId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(updateTestReportValidationSchema),
  TestReportController.updateTestReport,
);

router.delete(
  "/delete-report/:testReportId",
  authMiddleware(USER_ROLES.DOCTOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteTestReportValidationSchema),
  TestReportController.deleteTestReport,
);

const TestReportRoutes = router;
export default TestReportRoutes;

