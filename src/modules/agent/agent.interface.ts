import { Document, Types } from "mongoose";
import { TAccountStatus } from "../user/user.interface";
import {
  AGENT_APPROVAL_STATUS,
} from "./agent.constant";

export type TAgentApprovalStatus =
  (typeof AGENT_APPROVAL_STATUS)[keyof typeof AGENT_APPROVAL_STATUS];


export interface IAgent extends Document {
  userId: Types.ObjectId;
  agencyName: string;
  approvalStatus: TAgentApprovalStatus;
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
  approvalStatus?: TAgentApprovalStatus;
};

export type TUpdateAgentPayload = Partial<TAgentPayload>;

export type TAgentQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  approvalStatus?: TAgentApprovalStatus;
  userStatus?: TAccountStatus;
};
