import express from 'express';
import DashboardController from './dashboard.controller';
import authMiddleware from '../../middlewares/authMiddleware';
import subAgentAuthMiddleware from '../../middlewares/subAgentAuthMIddleware';
import { USER_ROLES } from '../user/user.constant';
import AgentPatientController from '../agentPatient/agentPatient.controller';

const router = express.Router();

router.get(
    '/stats',
    authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    DashboardController.getStats,
);

router.get(
    '/doctor-stats',
    authMiddleware(USER_ROLES.DOCTOR),
    DashboardController.getDoctorStats,
);

/* ==================== Agent & Sub-Agent Commission Dashboard ==================== */
router.get(
    '/agent-commission-stats',
    authMiddleware(USER_ROLES.AGENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    AgentPatientController.getAgentCommissionStats,
);

router.get(
    '/sub-agent-commission-stats',
    subAgentAuthMiddleware(),
    AgentPatientController.getSubAgentCommissionStats,
);

router.get(
    '/sub-agent-stats',
    subAgentAuthMiddleware(),
    DashboardController.getSubAgentStats,
);

const DashboardRoutes = router;
export default DashboardRoutes;