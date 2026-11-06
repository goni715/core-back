import { Document } from "mongoose";
import { FAQ_CATEGORY } from "./faq.constant";

export type TFaqCategory = (typeof FAQ_CATEGORY)[keyof typeof FAQ_CATEGORY];

export interface IFaq extends Document {
  question: string;
  slug: string;
  answer: string;
  category: TFaqCategory;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TFaqQuery = {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: string | boolean;
  category?: TFaqCategory;
};

export type TUserFaqQuery = {
  category?: TFaqCategory;
  searchTerm?: string;
};
