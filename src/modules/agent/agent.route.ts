import express from "express";
import AgentController from "./agent.controller";
import validationMiddleware from "../../middlewares/validationMiddleware";
import {
  approvalAgentValidationSchema,
  changeAgentStatusValidationSchema,
  deleteAgentValidationSchema,
  getAgentsValidationSchema,
  getSingleAgentValidationSchema,
  updateAgentValidationSchema,
} from "./agent.validation";
import authMiddleware from "../../middlewares/authMiddleware";
import { USER_ROLES } from "../user/user.constant";
import upload from "../../helpers/upload";

const router = express.Router();

/* Admin: Approve or Reject agent registration */
router.patch(
  "/approval-status/:agentId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(approvalAgentValidationSchema),
  AgentController.approveOrRejectAgent,
);

/* Admin: Change agent status */
router.patch(
  "/change-status/:agentId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(changeAgentStatusValidationSchema),
  AgentController.changeAgentStatus,
);

/* Admin: Get all agents */
router.get(
  "/get-agents",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getAgentsValidationSchema),
  AgentController.getAgents,
);

/* Admin / Agent: Get single agent */
router.get(
  "/get-agent/:agentId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.AGENT),
  validationMiddleware(getSingleAgentValidationSchema),
  AgentController.getSingleAgent,
);

/* Admin / Agent: Update agent */
router.patch(
  "/update-agent/:agentId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.AGENT),
  upload.single("image"),
  validationMiddleware(updateAgentValidationSchema),
  AgentController.updateAgent,
);

/* Admin: Delete agent */
router.delete(
  "/delete-agent/:agentId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteAgentValidationSchema),
  AgentController.deleteAgent,
);

const AgentRoutes = router;
export default AgentRoutes;
