import express from "express";
import upload from "../../helpers/upload";
import authMiddleware from "../../middlewares/authMiddleware";
import validationMiddleware from "../../middlewares/validationMiddleware";
import { USER_ROLES } from "../user/user.constant";
import BlogController from "./blog.controller";
import {
  createBlogValidationSchema,
  deleteBlogValidationSchema,
  getBlogsValidationSchema,
  getSingleBlogValidationSchema,
  updateBlogValidationSchema,
} from "./blog.validation";

const router = express.Router();

/* ==================== Create Blog ==================== */
router.post(
  "/create-blog",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("image"),
  validationMiddleware(createBlogValidationSchema),
  BlogController.createBlog,
);

/* ==================== Get All Blogs (Admin) ==================== */
router.get(
  "/get-blogs",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(getBlogsValidationSchema),
  BlogController.getBlogs,
);

/* ==================== Get Published Blogs (Public) ==================== */
router.get(
  "/published-blogs",
  validationMiddleware(getBlogsValidationSchema),
  BlogController.getPublishedBlogs,
);

/* ==================== Get Single Blog (Public, Increments Views) ==================== */
router.get(
  "/single-blog/:identifier",
  validationMiddleware(getSingleBlogValidationSchema),
  BlogController.getSingleBlog,
);

/* ==================== Update Blog ==================== */
router.patch(
  "/update-blog/:blogId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  upload.single("image"),
  validationMiddleware(updateBlogValidationSchema),
  BlogController.updateBlog,
);

/* ==================== Toggle Featured ==================== */
router.patch(
  "/toggle-featured/:blogId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  BlogController.toggleFeatured,
);

/* ==================== Delete Blog ==================== */
router.delete(
  "/delete-blog/:blogId",
  authMiddleware(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validationMiddleware(deleteBlogValidationSchema),
  BlogController.deleteBlog,
);

const BlogRoutes = router;
export default BlogRoutes;
