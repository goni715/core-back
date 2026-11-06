import { Document, Types } from "mongoose";
import { HEALTH_TIP_STATUS } from "./healthTip.constant";

export type THealthTipStatus =
  (typeof HEALTH_TIP_STATUS)[keyof typeof HEALTH_TIP_STATUS];

export interface IHealthTip extends Document {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  categoryId: Types.ObjectId;
  authorName?: string;
  image?: string;
  status: THealthTipStatus;
  isFeatured: boolean;
  viewsCount: number;
  sharesCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type THealthTipQuery = {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: THealthTipStatus;
  categoryId?: string;
  categorySlug?: string;
  isFeatured?: string | boolean;
};

