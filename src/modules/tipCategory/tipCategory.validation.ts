import z from "zod";
import { enumSchema } from "../../schemas/enum.schema";
import { requiredStringSchema } from "../../schemas/required.schema";
import isObjectId from "../../utils/isObjectId";
import {
  TIP_CATEGORY_STATUS,
  TIP_CATEGORY_STATUS_VALUES,
} from "./tipCategory.constant";

export const categoryIdZodSchema = requiredStringSchema("categoryId").refine(
  (id) => isObjectId(id),
  {
    message: "categoryId must be a valid ObjectId",
  },
);

export const tipCategoryStatusZodSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "status is required"
        : "status must be a string",
  })
  .transform((val) => val.toUpperCase())
  .refine(
    (val) => TIP_CATEGORY_STATUS_VALUES.includes(val as any),
    {
      message: `status must be ${TIP_CATEGORY_STATUS_VALUES.map((t) => `'${t}'`).join(" or ")}`,
    },
  );

export const createTipCategoryValidationSchema = z.object({
  body: z.object({
    name: requiredStringSchema("name"),
    status: tipCategoryStatusZodSchema.default(TIP_CATEGORY_STATUS.PUBLISHED),
  }),
});

export const updateTipCategoryValidationSchema = z.object({
  params: z.object({
    categoryId: categoryIdZodSchema,
  }),
  body: z
    .object({
      name: requiredStringSchema("name").optional(),
      status: tipCategoryStatusZodSchema.optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

export const getSingleTipCategoryValidationSchema = z.object({
  params: z.object({
    categoryId: categoryIdZodSchema,
  }),
});

export const deleteTipCategoryValidationSchema = z.object({
  params: z.object({
    categoryId: categoryIdZodSchema,
  }),
});

export const getTipCategoriesValidationSchema = z.object({
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
        (val) => TIP_CATEGORY_STATUS_VALUES.includes(val as any),
        {
          message: `status must be ${TIP_CATEGORY_STATUS_VALUES.map((t) => `'${t}'`).join(" or ")}`,
        },
      )
      .optional(),
  }),
});

