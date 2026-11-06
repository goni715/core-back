import z from "zod";
import { enumSchema } from "../../schemas/enum.schema";
import { booleanQuerySchema } from "../../schemas/global.schema";
import { requiredStringSchema } from "../../schemas/required.schema";
import isObjectId from "../../utils/isObjectId";
import {
  HEALTH_TIP_STATUS,
  HEALTH_TIP_STATUS_VALUES,
} from "./healthTip.constant";

export const healthTipIdZodSchema = requiredStringSchema("healthTipId").refine(
  (id) => isObjectId(id),
  {
    message: "healthTipId must be a valid ObjectId",
  },
);

export const categoryIdZodSchema = requiredStringSchema("categoryId").refine(
  (id) => isObjectId(id),
  {
    message: "categoryId must be a valid ObjectId",
  },
);

export const healthTipStatusZodSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "status is required"
        : "status must be a string",
  })
  .transform((val) => val.toUpperCase())
  .refine(
    (val) => HEALTH_TIP_STATUS_VALUES.includes(val as any),
    {
      message: `status must be ${HEALTH_TIP_STATUS_VALUES.map((t) => `'${t}'`).join(" or ")}`,
    },
  );

const booleanFormSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val === "true") return true;
    if (val === "false") return false;
  }
  return val;
}, z.boolean().optional());

export const createHealthTipValidationSchema = z.object({
  body: z.object({
    title: requiredStringSchema("title"),
    summary: z.string().trim().optional(),
    content: requiredStringSchema("content"),
    categoryId: categoryIdZodSchema,
    authorName: z.string().trim().optional(),
    status: healthTipStatusZodSchema.default(HEALTH_TIP_STATUS.PUBLISHED),
    isFeatured: booleanFormSchema.default(false),
  }),
});

export const updateHealthTipValidationSchema = z.object({
  params: z.object({
    healthTipId: healthTipIdZodSchema,
  }),
  body: z.object({
    title: requiredStringSchema("title").optional(),
    summary: z.string().trim().optional(),
    content: requiredStringSchema("content").optional(),
    categoryId: categoryIdZodSchema.optional(),
    authorName: z.string().trim().optional(),
    status: healthTipStatusZodSchema.optional(),
    isFeatured: booleanFormSchema.optional(),
  }),
});

export const getSingleHealthTipValidationSchema = z.object({
  params: z.object({
    identifier: requiredStringSchema("identifier"),
  }),
});

export const deleteHealthTipValidationSchema = z.object({
  params: z.object({
    healthTipId: healthTipIdZodSchema,
  }),
});

export const getHealthTipsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: enumSchema("sortOrder", ["asc", "desc"]).optional(),
    status: z
      .string()
      .transform((val) => val.toUpperCase())
      .refine(
        (val) => HEALTH_TIP_STATUS_VALUES.includes(val as any),
        {
          message: `status must be ${HEALTH_TIP_STATUS_VALUES.map((t) => `'${t}'`).join(" or ")}`,
        },
      )
      .optional(),
    categoryId: z
      .string()
      .refine((id) => isObjectId(id), {
        message: "categoryId must be a valid ObjectId",
      })
      .optional(),
    isFeatured: booleanQuerySchema("isFeatured").optional(),
  }),
});

export const getPublishedHealthTipsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: enumSchema("sortOrder", ["asc", "desc"]).optional(),
    categoryId: z
      .string()
      .refine((id) => isObjectId(id), {
        message: "categoryId must be a valid ObjectId",
      })
      .optional(),
    categorySlug: z.string().optional(),
    isFeatured: booleanQuerySchema("isFeatured").optional(),
  }),
});

