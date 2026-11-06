import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import TipCategoryController from "./tipCategory.controller";
import {
  createTipCategoryValidationSchema,
  deleteTipCategoryValidationSchema,
  getSingleTipCategoryValidationSchema,
  getTipCategoriesValidationSchema,
  updateTipCategoryValidationSchema,
} from "./tipCategory.validation";

const router = express.Router();

router.post(
  "/create-category",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(createTipCategoryValidationSchema),
  TipCategoryController.createTipCategory,
);

router.get(
  "/categories",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getTipCategoriesValidationSchema),
  TipCategoryController.getTipCategories,
);

router.get(
  "/category-dropdown",
  TipCategoryController.getCategoryDropdown,
);

router.get(
  "/dropdown",
  TipCategoryController.getCategoryDropdown,
);

router.get(
  "/single-category/:categoryId",
  validationMiddleware(getSingleTipCategoryValidationSchema),
  TipCategoryController.getTipCategoryById,
);

router.patch(
  "/update-category/:categoryId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(updateTipCategoryValidationSchema),
  TipCategoryController.updateTipCategory,
);

router.delete(
  "/delete-category/:categoryId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteTipCategoryValidationSchema),
  TipCategoryController.deleteTipCategory,
);

const TipCategoryRoutes = router;
export default TipCategoryRoutes;

