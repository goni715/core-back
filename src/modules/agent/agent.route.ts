import express from "express";
import AgentController from "./agent.controller";
import validationMiddleware from "../../middlewares/validationMiddleware";
import {
  approvalAgentValidationSchema,
  deleteAgentValidationSchema,
  getAgentsValidationSchema,
  getSingleAgentValidationSchema,
  updateAgentValidationSchema,
} from "./agent.validation";
import authMiddleware from "../../middlewares/authMiddleware";
import { USER_ROLES } from "../user/user.constant";
import upload from "../../helpers/upload";
import { registerAgentValidationSchema } from "../auth/auth.validation";

const router = express.Router();

router.post(
  "/create-agent",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(registerAgentValidationSchema),
  AgentController.createAgent,
);

/* Admin: Approve or Reject agent registration */
router.patch(
  "/approval-status/:agentId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(approvalAgentValidationSchema),
  AgentController.approveOrRejectAgent,
);

/* Admin: Get all agents */
router.get(
  "/all-agents",
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
