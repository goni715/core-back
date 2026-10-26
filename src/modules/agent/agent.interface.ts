import { Document, Types } from "mongoose";
import { TAccountStatus } from "../user/user.interface";
import {
  AGENT_APPROVAL_STATUS,
  AGENT_STATUS,
} from "./agent.constant";

export type TAgentApprovalStatus =
  (typeof AGENT_APPROVAL_STATUS)[keyof typeof AGENT_APPROVAL_STATUS];

export type TAgentStatus =
  (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];

export interface IAgent extends Document {
  userId: Types.ObjectId;
  agencyName: string;
  approvalStatus: TAgentApprovalStatus;
  status: TAgentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TAgentPayload = {
  fullName: string;
  email: string;
  phone: string;
  agencyName: string;
  password: string;
  profileImg?: string;
  status?: TAgentStatus;
  approvalStatus?: TAgentApprovalStatus;
};

export type TUpdateAgentPayload = Partial<TAgentPayload>;

export type TAgentQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TAgentStatus;
  approvalStatus?: TAgentApprovalStatus;
  userStatus?: TAccountStatus;
};
