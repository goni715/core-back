import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import AgentPatientController from "./agentPatient.controller";
import {
  createAgentPatientValidationSchema,
  deleteAgentPatientValidationSchema,
  getAgentPatientsValidationSchema,
  getAgentAllCommissionsValidationSchema,
  getAllPatientsByAdminValidationSchema,
  getSingleAgentPatientValidationSchema,
  updateAgentPatientValidationSchema,
  updateStatusValidationSchema,
  updateAgentCommissionValidationSchema,
  updateSubAgentCommissionValidationSchema,
  updateAgentPaymentStatusValidationSchema,
  updateSubAgentPaymentStatusValidationSchema,
  updateRevenueValidationSchema,
} from "./agentPatient.validation";
import subAgentAuthMiddleware from "../../middlewares/subAgentAuthMIddleware";

const router = express.Router();

/* ==================== Create / Submit Patient ==================== */
// Agent submits a new referred patient case (JSON format)
router.post(
  "/submit-patient/by-agent",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(createAgentPatientValidationSchema),
  AgentPatientController.submitPatientByAgent,
);

router.post(
  "/submit-patient/by-sub-agent",
  subAgentAuthMiddleware(),
  validationMiddleware(createAgentPatientValidationSchema),
  AgentPatientController.submitPatientBySubAgent,
);

router.get(
  "/status-stats/by-agent",
  authMiddleware(USER_ROLES.AGENT),
  AgentPatientController.getStatusStats,
);

router.get(
  "/status-stats/by-sub-agent",
  subAgentAuthMiddleware(),
  AgentPatientController.getSubAgentStatusStats,
);

router.get(
  "/sub-agent-stats",
  subAgentAuthMiddleware(),
  AgentPatientController.getSubAgentStatusStats,
);

/* ==================== Commission Stats (Cards & 12 Months Chart) ==================== */
router.get(
  "/commission-stats/by-agent",
  authMiddleware(USER_ROLES.AGENT),
  AgentPatientController.getAgentCommissionStats,
);

router.get(
  "/commission-stats/by-sub-agent",
  subAgentAuthMiddleware(),
  AgentPatientController.getSubAgentCommissionStats,
);

/* ==================== All Commissions (Table with Pagination & Search) ==================== */
router.get(
  "/all-commissions/by-agent",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(getAgentAllCommissionsValidationSchema),
  AgentPatientController.getAgentAllCommissions,
);


router.get(
  "/all-commissions/by-sub-agent",
  subAgentAuthMiddleware(),
  validationMiddleware(getAgentAllCommissionsValidationSchema),
  AgentPatientController.getSubAgentAllCommissionsByAgent,
);

router.get(
  "/sub-agent-all-commissions",
  subAgentAuthMiddleware(),
  validationMiddleware(getAgentAllCommissionsValidationSchema),
  AgentPatientController.getSubAgentAllCommissionsByAgent,
);

router.get(
  "/sub-agent-all-commissions-by-agent",
  subAgentAuthMiddleware(),
  validationMiddleware(getAgentAllCommissionsValidationSchema),
  AgentPatientController.getSubAgentAllCommissionsByAgent,
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

/* ==================== Get All Patients for Admin & Super Admin ==================== */
// Admin & Super Admin see all submitted cases with agent & sub-agent joins
router.get(
  "/all-patients/by-admin",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(getAllPatientsByAdminValidationSchema),
  AgentPatientController.getAllPatientsByAdmin,
);

router.get(
  "/all-patients",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(getAllPatientsByAdminValidationSchema),
  AgentPatientController.getAllPatientsByAdmin,
);

/* ==================== Get Single Patient ==================== */
// Retrieve patient case by MongoDB ID or Case ID (e.g. CS-XXXXXX)
router.get(
  "/get-patient/by-agent/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(getSingleAgentPatientValidationSchema),
  AgentPatientController.getPatientByAgent,
);

router.get(
  "/get-patient/by-sub-agent/:patientId",
  subAgentAuthMiddleware(),
  validationMiddleware(getSingleAgentPatientValidationSchema),
  AgentPatientController.getPatientBySubAgent,
);

router.get(
  "/get-patient/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(getSingleAgentPatientValidationSchema),
  AgentPatientController.getPatientByAgent,
);

/* ==================== Update Patient Info ==================== */
router.patch(
  "/update-patient/by-agent/:patientId",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(updateAgentPatientValidationSchema),
  AgentPatientController.updatePatientByAgent,
);

router.patch(
  "/update-patient/by-sub-agent/:patientId",
  subAgentAuthMiddleware(),
  validationMiddleware(updateAgentPatientValidationSchema),
  AgentPatientController.updatePatientBySubAgent,
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

/* ==================== Update Agent Commission ==================== */
// Admin & Super Admin add/update commission fee for agent
router.patch(
  "/update-agent-commission/:patientId",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(updateAgentCommissionValidationSchema),
  AgentPatientController.updateAgentCommission,
);

/* ==================== Update Agent Payment Status ==================== */
// Admin & Super Admin update payment status for agent commission
router.patch(
  "/update-agent-payment-status/:patientId",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(updateAgentPaymentStatusValidationSchema),
  AgentPatientController.updateAgentPaymentStatus,
);

router.patch(
  "/agent-payment-status/:patientId",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(updateAgentPaymentStatusValidationSchema),
  AgentPatientController.updateAgentPaymentStatus,
);

/* ==================== Update Sub-Agent Commission ==================== */
// Admin & Super Admin add/update commission for sub-agent
router.patch(
  "/update-sub-agent-commission/:patientId",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(updateSubAgentCommissionValidationSchema),
  AgentPatientController.updateSubAgentCommission,
);

/* ==================== Update Sub-Agent Payment Status ==================== */
// Admin & Super Admin update payment status for sub-agent commission
router.patch(
  "/update-sub-agent-payment-status/:patientId",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(updateSubAgentPaymentStatusValidationSchema),
  AgentPatientController.updateSubAgentPaymentStatus,
);

router.patch(
  "/sub-agent-payment-status/:patientId",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(updateSubAgentPaymentStatusValidationSchema),
  AgentPatientController.updateSubAgentPaymentStatus,
);

router.patch(
  "/update-revenue/:patientId",
  authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validationMiddleware(updateRevenueValidationSchema),
  AgentPatientController.updateRevenue,
);

const AgentPatientRoutes = router;
export default AgentPatientRoutes;
