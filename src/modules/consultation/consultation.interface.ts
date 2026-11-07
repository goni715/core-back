import { Document, Types } from "mongoose";

export interface IMedicineItem {
  _id?: Types.ObjectId | string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IMedicine extends Document {
  consultationId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConsultation extends Document {
  appointmentId: Types.ObjectId;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorUserId: Types.ObjectId;
  diagnosisNotes: string;
  treatmentAdvice?: string;
  followUpRecommendation?: string;
  nextFollowUpDate?: Date;
  internalDoctorNote?: string;
  medicines: Types.ObjectId[] | IMedicine[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type TConsultationQuery = {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
};
