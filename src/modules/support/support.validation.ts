import z from "zod";
import { SUPPORT_STATUS_VALUES } from "./support.constant";
import { requiredStringSchema } from "../../schemas/required.schema";
import { enumSchema } from "../../schemas/enum.schema";
import { emailZodSchema, fullNameZodSchema, phoneNumberZodSchema } from "../auth/auth.validation";
import objectIdSchema from "../../schemas/objectId.schema";

export const dateFormatRegex = /^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const supportValidationSchema = z.object({
    body: z.object({
        fullName: fullNameZodSchema,
        email: emailZodSchema,
        phone: phoneNumberZodSchema,
        subject: requiredStringSchema('subject')
            .max(150, {
                message: "Subject must not exceed 150 characters",
            }),
        message:
            requiredStringSchema('message')
                .max(500, {
                    message: "Message must not exceed 500 characters",
                }),
    })
});

export const dateZodSchema = requiredStringSchema('date')
    .superRefine((date, ctx) => {
        // validate date format
        if (!dateFormatRegex.test(date)) {
            ctx.addIssue({
                code: "custom",
                message: "date must be 'YYYY-MM-DD' format",
            });
            return;
        }
    })

export const getAllSupportsValidationSchema = z.object({
    query: z.object({
        searchTerm: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
        sortOrder: z.string().optional(),
        sortBy: z.string().optional(),
        status: enumSchema('status', SUPPORT_STATUS_VALUES)
            .optional(),
        date: dateZodSchema.optional(),
    })
});


export const updateSupportStatusValidationSchema = z.object({
    params: z.object({
        supportId: objectIdSchema('supportId')
    }),
    body: z.object({
        status: enumSchema('status', ['in_progress', 'closed'])
    })
})