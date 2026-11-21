import z from "zod";
import { requiredStringSchema } from "../../schemas/required.schema";
import isObjectId from "../../utils/isObjectId";
import { BLOG_STATUS, BLOG_STATUS_VALUES } from "./blog.constant";

export const blogIdZodSchema = requiredStringSchema("blogId").refine(
  (id) => isObjectId(id),
  {
    message: "blogId must be a valid ObjectId",
  },
);

const booleanFormSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  return val;
}, z.boolean().optional());

const blogStatusSchema = z
  .string()
  .transform((val) => val.toLowerCase().trim())
  .refine(
    (val) => BLOG_STATUS_VALUES.includes(val as any),
    {
      message: `status must be one of: ${BLOG_STATUS_VALUES.join(", ")}`,
    },
  );

export const createBlogValidationSchema = z.object({
  body: z.object({
    title: requiredStringSchema("title"),
    author: z.string().trim().optional().default("Admin"),
    isFeatured: booleanFormSchema.default(false),
    status: blogStatusSchema.default(BLOG_STATUS.PUBLISHED),
    content: requiredStringSchema("content"),
  }),
});

export const updateBlogValidationSchema = z.object({
  params: z.object({
    blogId: blogIdZodSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    author: z.string().trim().optional(),
    isFeatured: booleanFormSchema.optional(),
    status: blogStatusSchema.optional(),
    content: z.string().min(1, "Content cannot be empty").optional(),
  }),
});

export const getSingleBlogValidationSchema = z.object({
  params: z.object({
    identifier: requiredStringSchema("identifier"),
  }),
});

export const deleteBlogValidationSchema = z.object({
  params: z.object({
    blogId: blogIdZodSchema,
  }),
});

export const getBlogsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    isFeatured: z.string().optional(),
    author: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});
