import express from "express";
import reportUpload from "../../helpers/reportUpload";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import AgentPatientController from "./agentPatient.controller";
import {
  createAgentPatientValidationSchema,
  deleteAgentPatientValidationSchema,
  getAgentPatientsValidationSchema,
  getSingleAgentPatientValidationSchema,
  updateAgentPatientValidationSchema,
  updateStatusValidationSchema,
} from "./agentPatient.validation";
import subAgentAuthMiddleware from "../../middlewares/subAgentAuthMIddleware";

const router = express.Router();

/* ==================== Create / Submit Patient ==================== */
// Agent submits a new referred patient case
router.post(
  "/submit-patient/by-agent",
  authMiddleware(USER_ROLES.AGENT),
  reportUpload.array("reports", 10),
  validationMiddleware(createAgentPatientValidationSchema),
  AgentPatientController.submitPatientByAgent,
);

router.post(
  "/submit-patient/by-sub-agent",
  subAgentAuthMiddleware(),
  reportUpload.array("reports", 10),
  validationMiddleware(createAgentPatientValidationSchema),
  AgentPatientController.submitPatientBySubAgent,
);

router.get(
  "/status-stats/by-agent",
  authMiddleware(USER_ROLES.AGENT),
  AgentPatientController.getStatusStats,
);

/* ==================== Get Patients List ==================== */
// Agent sees their own submitted cases
router.get(
  "/all-patients/by-agent",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(getAgentPatientsValidationSchema),
  AgentPatientController.getPatientsByAgent,
);

router.get(
  "/all-patients/by-sub-agent",
  subAgentAuthMiddleware(),
  validationMiddleware(getAgentPatientsValidationSchema),
  AgentPatientController.getPatientsBySubAgent,
);

/* ==================== Get Single Patient ==================== */
// Retrieve patient case by MongoDB ID or Case ID (e.g. CS-XXXXXX)
router.get(
  "/get-patient/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(getSingleAgentPatientValidationSchema),
  AgentPatientController.getPatientById,
);

/* ==================== Update Patient Info ==================== */
router.patch(
  "/update-patient/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  reportUpload.array("reports", 10),
  validationMiddleware(updateAgentPatientValidationSchema),
  AgentPatientController.updatePatient,
);

/* ==================== Update Patient Case Status ==================== */
// Agent updates case status (submitted, under_review, confirmed, ongoing, completed, cancelled)
router.patch(
  "/change-status/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(updateStatusValidationSchema),
  AgentPatientController.updatePatientStatus,
);

router.patch(
  "/update-status/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(updateStatusValidationSchema),
  AgentPatientController.updatePatientStatus,
);

/* ==================== Delete Patient Case ==================== */
router.delete(
  "/delete-patient/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(deleteAgentPatientValidationSchema),
  AgentPatientController.deletePatient,
);

const AgentPatientRoutes = router;
export default AgentPatientRoutes;
