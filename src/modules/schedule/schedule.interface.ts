import { Document, Types } from "mongoose";
import { SCHEDULE_DAYS } from "./schedule.constant";

export type TScheduleDay = (typeof SCHEDULE_DAYS)[keyof typeof SCHEDULE_DAYS];

export interface ISchedule extends Document {
  doctorUserId: Types.ObjectId;
  day: TScheduleDay;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
  startDateTime: Date; // Anchor date: 2026-01-01 + startTime
  endDateTime: Date;   // Anchor date: 2026-01-01 + endTime
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TCreateSchedulePayload = {
  day: TScheduleDay;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type TUpdateSchedulePayload = {
  day?: TScheduleDay;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
};

export type TScheduleQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  doctorUserId?: string;
  day?: TScheduleDay;
  isActive?: boolean | string;
  startTime?: string;
  endTime?: string;
  startDateTime?: string | Date;
  endDateTime?: string | Date;
};
