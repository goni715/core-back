import express from "express";
import UserController from "./user.controller";
import authMiddleware from "../../middlewares/authMiddleware";
import { USER_ROLES } from "./user.constant";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { getPatientsValidationSchema, updateAgentProfileValidationSchema, updateProfileValidationSchema } from "./user.validation";
import upload from "../../helpers/upload";
import subAgentAuthMiddleware from "../../middlewares/subAgentAuthMIddleware";

const router = express.Router();

router.get(
    "/patients",
    authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validationMiddleware(getPatientsValidationSchema),
    UserController.getPatients
);

router.get(
    "/my-profile",
    authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.PATIENT, USER_ROLES.DOCTOR, USER_ROLES.AGENT),
    UserController.getMyProfile
);
router.get(
    "/sub-agent-profile",
    subAgentAuthMiddleware(),
    UserController.getSubAgentProfile
);

router.patch(
    "/update-profile",
    authMiddleware(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.PATIENT, USER_ROLES.DOCTOR),
    upload.single("image"),
    validationMiddleware(updateProfileValidationSchema),
    UserController.updateProfile
);

router.patch(
    "/update-agent-profile",
    authMiddleware(USER_ROLES.AGENT),
    validationMiddleware(updateAgentProfileValidationSchema),
    UserController.updateAgentProfile
);

router.patch(
    "/update-sub-agent-profile",
    subAgentAuthMiddleware(),
    validationMiddleware(updateAgentProfileValidationSchema),
    UserController.updateSubAgentProfile
);


const UserRoutes = router;
export default UserRoutes;