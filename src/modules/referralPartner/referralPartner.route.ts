import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import ReferralPartnerController from "./referralPartner.controller";
import {
  changePartnerStatusValidationSchema,
  deleteReferralPartnerValidationSchema,
  getMyNetworksValidationSchema,
  getReferralPartnersValidationSchema,
  getSingleReferralPartnerValidationSchema,
  inviteReferralPartnerValidationSchema,
  registerReferralPartnerValidationSchema,
  updateReferralPartnerValidationSchema,
} from "./referralPartner.validation";

const router = express.Router();

const allowedRoles = [
  USER_ROLES.AGENT,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
];

/* ==================== Register Partner (Public / Self-Registration) ==================== */
router.post(
  "/register",
  validationMiddleware(registerReferralPartnerValidationSchema),
  ReferralPartnerController.registerPartner,
);


router.post(
  "/generate-link",
  authMiddleware(USER_ROLES.AGENT),
  ReferralPartnerController.generateInvitationLink,
);

/* ==================== Network Stats ==================== */
// Overview stats cards: Referral partners, Active this month, Cases in network, Network earnings & tabs
router.get(
  "/stats",
  authMiddleware(USER_ROLES.AGENT),
  ReferralPartnerController.getNetworkStats,
);

/* ==================== Channel Partner Network Invite Link ==================== */
// Get the unique invitation link for "Grow your network" section
router.get(
  "/invitation-link",
  authMiddleware(...allowedRoles),
  ReferralPartnerController.getInvitationLink,
);

/* ==================== Invite Referral Partner ==================== */
// Channel Partner clicks "+ Invite referral partner"
router.post(
  "/invite",
  authMiddleware(...allowedRoles),
  validationMiddleware(inviteReferralPartnerValidationSchema),
  ReferralPartnerController.invitePartner,
);

router.post(
  "/invite-partner",
  authMiddleware(...allowedRoles),
  validationMiddleware(inviteReferralPartnerValidationSchema),
  ReferralPartnerController.invitePartner,
);

/* ==================== Seed Sample Partners ==================== */
// Seeds initial partners from the design if the list is empty
router.post(
  "/seed",
  authMiddleware(...allowedRoles),
  ReferralPartnerController.seedSamplePartners,
);

/* ==================== List Referral Partners ==================== */
// Filterable by tabs: all, active, invited, paused & searchable by name or ID
router.get(
  "/get-partners",
  authMiddleware(...allowedRoles),
  validationMiddleware(getReferralPartnersValidationSchema),
  ReferralPartnerController.getReferralPartners,
);

/* ==================== Get Agent's Networks ==================== */
router.get(
  "/my-networks",
  authMiddleware(USER_ROLES.AGENT),
  validationMiddleware(getMyNetworksValidationSchema),
  ReferralPartnerController.getMyNetworks,
);

router.get(
  "/",
  authMiddleware(...allowedRoles),
  validationMiddleware(getReferralPartnersValidationSchema),
  ReferralPartnerController.getReferralPartners,
);

/* ==================== Single Referral Partner ==================== */
// Retrieve partner by MongoDB ObjectId or Partner ID (e.g. RP-0112)
router.get(
  "/get-partner/:partnerId",
  authMiddleware(...allowedRoles),
  validationMiddleware(getSingleReferralPartnerValidationSchema),
  ReferralPartnerController.getSinglePartner,
);

router.get(
  "/:partnerId",
  authMiddleware(...allowedRoles),
  validationMiddleware(getSingleReferralPartnerValidationSchema),
  ReferralPartnerController.getSinglePartner,
);

/* ==================== Update Partner Info ==================== */
router.patch(
  "/update-partner/:partnerId",
  authMiddleware(...allowedRoles),
  validationMiddleware(updateReferralPartnerValidationSchema),
  ReferralPartnerController.updatePartner,
);

router.patch(
  "/:partnerId",
  authMiddleware(...allowedRoles),
  validationMiddleware(updateReferralPartnerValidationSchema),
  ReferralPartnerController.updatePartner,
);

/* ==================== Change Status ==================== */
// Active, Invited, Paused
router.patch(
  "/change-status/:partnerId",
  authMiddleware(...allowedRoles),
  validationMiddleware(changePartnerStatusValidationSchema),
  ReferralPartnerController.changePartnerStatus,
);

/* ==================== Delete Partner ==================== */
router.delete(
  "/delete-partner/:partnerId",
  authMiddleware(...allowedRoles),
  validationMiddleware(deleteReferralPartnerValidationSchema),
  ReferralPartnerController.deletePartner,
);

router.delete(
  "/:partnerId",
  authMiddleware(...allowedRoles),
  validationMiddleware(deleteReferralPartnerValidationSchema),
  ReferralPartnerController.deletePartner,
);

const ReferralPartnerRoutes = router;
export default ReferralPartnerRoutes;
