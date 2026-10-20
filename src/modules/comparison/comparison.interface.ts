import { Document } from "mongoose";
import { COMPARISON_STATUS } from "./comparison.constant";

export type TComparisonStatus =
  (typeof COMPARISON_STATUS)[keyof typeof COMPARISON_STATUS];

export interface ICountryComparison {
  country: string;
  countryCode: string;
  costUSD: number;
  costBDT?: number;
  successRate?: string;
  hospitalStay?: string;
  recoveryTime?: string;
  popularHospitals?: string[];
}

export interface IComparison extends Document {
  treatmentName: string;
  slug: string;
  category?: string;
  firstCountry: ICountryComparison;
  secondCountry: ICountryComparison;
  savingsPercentage?: number;
  isPopular: boolean;
  status: TComparisonStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TComparisonQuery = {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TComparisonStatus;
}

export type TCompareQuery = {
  treatmentName?: string;
  treatment?: string;
  firstCountry?: string;
  secondCountry?: string;
};
