import express from "express";
import validationMiddleware from "../../middlewares/validationMiddleware";
import SupportController from "./support.controller";
import { getAllSupportsValidationSchema, supportValidationSchema } from "./support.validation";
import authMiddleware from "../../middlewares/authMiddleware";
import { USER_ROLES } from "../user/user.constant";
import subAgentAuthMiddleware from "../../middlewares/subAgentAuthMIddleware";
;

const router = express.Router();


router.post(
    "/submit",
    validationMiddleware(supportValidationSchema),
    SupportController.submitSupportRequest
);

router.get(
    "/all-supports",
    authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validationMiddleware(getAllSupportsValidationSchema),
    SupportController.getSupports
);

router.get(
    "/my-supports",
    authMiddleware(USER_ROLES.AGENT, USER_ROLES.DOCTOR, USER_ROLES.PATIENT),
    validationMiddleware(getAllSupportsValidationSchema),
    SupportController.getMySupports
);

router.get(
    "/sub-agent-supports",
    subAgentAuthMiddleware(),
    validationMiddleware(getAllSupportsValidationSchema),
    SupportController.getMySupports
);

const SupportRoutes = router;
export default SupportRoutes;