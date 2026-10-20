import express from "express";
import DoctorController from "./doctor.controller";
import validationMiddleware from "../../middlewares/validationMiddleware";
import {
  approvalDoctorValidationSchema,
  changeDoctorStatusValidationSchema,
  createDoctorValidationSchema,
  deleteDoctorValidationSchema,
  getDoctorsValidationSchema,
  getPublishedDoctorsValidationSchema,
  updateDoctorValidationSchema,
} from "./doctor.validation";
import authMiddleware from "../../middlewares/authMiddleware";
import { USER_ROLES } from "../user/user.constant";
import upload from "../../helpers/upload";

const router = express.Router();

/* Public: Get published doctors list */
router.get(
  "/published-doctors",
  validationMiddleware(getPublishedDoctorsValidationSchema),
  DoctorController.getPublishedDoctors
);

/* Admin: Create doctor directly */
router.post(
  "/create-doctor",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("image"),
  validationMiddleware(createDoctorValidationSchema),
  DoctorController.createDoctor,
);

/* Admin: Approve or Reject doctor registration */
router.patch(
  "/approval-status/:doctorId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(approvalDoctorValidationSchema),
  DoctorController.approveOrRejectDoctor,
);

/* Admin: Publish or Inactivate doctor profile */
router.patch(
  "/change-status/:doctorId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(changeDoctorStatusValidationSchema),
  DoctorController.changeDoctorStatus,
);

/* Admin: Get all doctors */
router.get(
  "/get-doctors",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getDoctorsValidationSchema),
  DoctorController.getDoctors,
);

/* Public/Authenticated: Get single doctor details */
router.get("/get-doctor/:doctorId", DoctorController.getDoctorById);

/* Admin: Update doctor details */
router.patch(
  "/update-doctor/:doctorId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("profileImg"),
  validationMiddleware(updateDoctorValidationSchema),
  DoctorController.updateDoctor,
);

/* Admin: Delete doctor */
router.delete(
  "/delete-doctor/:doctorId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteDoctorValidationSchema),
  DoctorController.deleteDoctor,
);

const DoctorRoutes = router;
export default DoctorRoutes;
