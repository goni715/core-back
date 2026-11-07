import { Schema, model } from "mongoose";
import { IConsultation } from "./consultation.interface";

const consultationSchema = new Schema<IConsultation>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
      unique: true,
      index: true,
    },
    patientName: {
      type: String,
      trim: true,
      default: "",
    },
    patientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    patientPhone: {
      type: String,
      trim: true,
      default: "",
    },
    doctorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
      index: true,
    },
    diagnosisNotes: {
      type: String,
      required: [true, "Diagnosis notes are required"],
      trim: true,
    },
    treatmentAdvice: {
      type: String,
      trim: true,
      default: "",
    },
    followUpRecommendation: {
      type: String,
      trim: true,
      default: "",
    },
    nextFollowUpDate: {
      type: Date,
    },
    internalDoctorNote: {
      type: String,
      trim: true,
      default: "",
    },
    medicines: [
      {
        type: Schema.Types.ObjectId,
        ref: "Medicine",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ConsultationModel = model<IConsultation>(
  "Consultation",
  consultationSchema
);

export default ConsultationModel;
