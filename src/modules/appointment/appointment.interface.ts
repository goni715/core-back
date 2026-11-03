import { Document, Types } from "mongoose";
import {
  APPOINTMENT_STATUS,
  BLOOD_GROUP,
} from "./appointment.constant";

export type TAppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export type TBloodGroup = (typeof BLOOD_GROUP)[keyof typeof BLOOD_GROUP];

export interface IAppointment extends Document {
  appointmentCode: string; // e.g. "APT-123456"
  doctorUserId: Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  appointmentDate: Date;
  schedule: string; // e.g. "10:00 AM - 10:30 AM"
  problem: string;
  bloodGroup?: TBloodGroup | string | null;
  dateOfBirth?: Date | null;
  status: TAppointmentStatus;
  serialNumber?: number | null;
  cancelReason?: string | null;
  doctorNotes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TBookAppointmentPayload = {
  scheduleId: string;
  fullName: string;
  email: string;
  phone: string;
  appointmentDate: string | Date;
  schedule: string;
  problem: string;
  bloodGroup?: TBloodGroup | string;
  dateOfBirth?: string | Date;
};

export type TUpdateAppointmentStatusPayload = {
  status: TAppointmentStatus;
  cancelReason?: string;
  doctorNotes?: string;
};

export type TAppointmentQuery = {
  searchTerm?: string;
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  doctorUserId?: string;
  patientUserId?: string;
  status?: TAppointmentStatus;
  appointmentDate?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
};

