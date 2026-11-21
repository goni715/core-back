import { Document } from "mongoose";
import { BLOG_STATUS_VALUES } from "./blog.constant";

export type TBlogStatus = (typeof BLOG_STATUS_VALUES)[number];

export interface IBlog extends Document {
  title: string;
  slug: string;
  author: string;
  isFeatured: boolean;
  image: string;
  status: TBlogStatus;
  views: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TBlogQuery = {
  searchTerm?: string;
  status?: TBlogStatus | "all";
  isFeatured?: boolean | string;
  author?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
