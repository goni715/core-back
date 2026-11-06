import { Document } from "mongoose";
import { TIP_CATEGORY_STATUS } from "./tipCategory.constant";

export type TTipCategoryStatus =
  (typeof TIP_CATEGORY_STATUS)[keyof typeof TIP_CATEGORY_STATUS];

export interface ITipCategory extends Document {
  name: string;
  slug: string;
  status: TTipCategoryStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TTipCategoryQuery = {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TTipCategoryStatus;
};

