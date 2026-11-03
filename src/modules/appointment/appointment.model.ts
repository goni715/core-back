import { Schema, model } from "mongoose";
import { IAppointment } from "./appointment.interface";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_VALUES,
  BLOOD_GROUP_VALUES,
} from "./appointment.constant";

export const generateAppointmentCode = (): string => {
  const randomSixDigit = Math.floor(100000 + Math.random() * 900000);
  return `APT-${randomSixDigit}`;
};

const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentCode: {
      type: String,
      unique: true,
      trim: true,
      index: true,
      default: generateAppointmentCode,
    },
    doctorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor User ID is required"],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      index: true,
    },
    schedule: {
      type: String,
      required: [true, "Schedule is required"],
      trim: true,
    },
    problem: {
      type: String,
      required: [true, "Problem description is required"],
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: {
        values: [...BLOOD_GROUP_VALUES, "", null],
        message: "{VALUE} is not a valid blood group",
      },
      default: null,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUS_VALUES,
        message: "{VALUE} is not a valid appointment status",
      },
      default: APPOINTMENT_STATUS.PENDING,
      index: true,
    },
    serialNumber: {
      type: Number,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
      trim: true,
    },
    doctorNotes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compound indexes for optimal queries
appointmentSchema.index({ doctorUserId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ doctorUserId: 1, appointmentDate: 1, schedule: 1 });
appointmentSchema.index({ email: 1, phone: 1 });

const AppointmentModel = model<IAppointment>("Appointment", appointmentSchema);
export default AppointmentModel;

