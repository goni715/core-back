import z from "zod";
import {
  fullNameZodSchema,
  phoneNumberZodSchema,
} from "../auth/auth.validation";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";
import { enumSchema } from "../../schemas/enum.schema";
import {
  AGENT_APPROVAL_STATUS,
  AGENT_APPROVAL_STATUS_VALUES,
  AGENT_STATUS_VALUES,
} from "./agent.constant";
import { ACCOUNT_STATUS_VALUES } from "../user/user.constant";

export const agentIdZodSchema = requiredStringSchema("agentId").refine(
  (id) => isObjectId(id),
  {
    message: "agentId must be a valid ObjectId",
  },
);

export const approvalAgentValidationSchema = z.object({
  params: z.object({
    agentId: agentIdZodSchema,
  }),
  body: z.object({
    approvalStatus: enumSchema("approvalStatus", [
      AGENT_APPROVAL_STATUS.APPROVED,
      AGENT_APPROVAL_STATUS.REJECTED,
    ]),
  }),
});

export const changeAgentStatusValidationSchema = z.object({
  params: z.object({
    agentId: agentIdZodSchema,
  }),
  body: z.object({
    status: enumSchema("status", AGENT_STATUS_VALUES),
  }),
});

export const updateAgentValidationSchema = z.object({
  params: z.object({
    agentId: agentIdZodSchema,
  }),
  body: z
    .object({
      fullName: fullNameZodSchema.optional(),
      phone: phoneNumberZodSchema.optional(),
      agencyName: z.string().trim().optional(),
      profileImg: z.string().optional(),
      status: enumSchema("status", AGENT_STATUS_VALUES).optional(),
      approvalStatus: enumSchema(
        "approvalStatus",
        AGENT_APPROVAL_STATUS_VALUES,
      ).optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

export const getSingleAgentValidationSchema = z.object({
  params: z.object({
    agentId: agentIdZodSchema,
  }),
});

export const deleteAgentValidationSchema = z.object({
  params: z.object({
    agentId: agentIdZodSchema,
  }),
});

export const getAgentsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortOrder: z.string().optional(),
    sortBy: z.string().optional(),
    status: enumSchema("status", AGENT_STATUS_VALUES).optional(),
    approvalStatus: enumSchema(
      "approvalStatus",
      AGENT_APPROVAL_STATUS_VALUES,
    ).optional(),
    userStatus: enumSchema("userStatus", ACCOUNT_STATUS_VALUES).optional(),
  }),
});
