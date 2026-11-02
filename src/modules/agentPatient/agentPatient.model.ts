import { Schema, model } from "mongoose";
import {
  COMMISSION_PAYMENT_STATUS,
  COMMISSION_PAYMENT_STATUS_VALUES,
  PATIENT_CASE_STATUS,
  PATIENT_CASE_STATUS_VALUES,
  PATIENT_GENDER_VALUES,
} from "./agentPatient.constant";
import { IAgentPatient } from "./agentPatient.interface";


const patientTimelineSchema = new Schema(
  {
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    underReviewAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    ongoingAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const agentPatientSchema = new Schema<IAgentPatient>(
  {
    caseId: {
      type: String,
      required: [true, "Case ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    agentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "agentUserId is required"],
      index: true,
    },
    subAgentId: {
      type: Schema.Types.ObjectId,
      ref: "ReferralPartner",
      default: null,
      index: true,
    },
    agentCommissionFee: {
      type: Number,
      default: 0,
      min: [0, "Agent commission fee cannot be negative"],
    },
    agentPaymentStatus: {
      type: String,
      enum: {
        values: COMMISSION_PAYMENT_STATUS_VALUES,
        message: "{VALUE} is not a valid agent payment status",
      },
      default: COMMISSION_PAYMENT_STATUS.UNPAID,
      index: true,
    },
    subAgentCommission: {
      type: Number,
      default: 0,
      min: [0, "Sub agent commission cannot be negative"],
    },
    subAgentPaymentStatus: {
      type: String,
      enum: {
        values: COMMISSION_PAYMENT_STATUS_VALUES,
        message: "{VALUE} is not a valid sub agent payment status",
      },
      default: COMMISSION_PAYMENT_STATUS.UNPAID,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Patient full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age must be positive"],
      max: [150, "Age cannot exceed 150"],
    },
    gender: {
      type: String,
      enum: {
        values: PATIENT_GENDER_VALUES,
        message: "{VALUE} is not a valid gender",
      },
      required: [true, "Gender is required"],
      index: true,
    },
    treatmentType: {
      type: String,
      required: [true, "Treatment type is required"],
      trim: true,
      index: true,
    },
    symptoms: {
      type: String,
      required: [true, "Symptoms is required"],
      trim: true,
    },
    preferredCountry: {
      type: String,
      required: [true, "Preferred country is required"],
      trim: true,
      index: true,
    },
    budgetRange: {
      type: String,
      required: [true, "Budget range is required"],
      trim: true,
    },
    driveLink: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: PATIENT_CASE_STATUS_VALUES,
        message: "{VALUE} is not a valid case status",
      },
      default: PATIENT_CASE_STATUS.SUBMITTED,
      index: true,
    },
    timeline: {
      type: patientTimelineSchema,
      default: () => ({
        submittedAt: new Date(),
        underReviewAt: null,
        confirmedAt: null,
        ongoingAt: null,
        completedAt: null,
        cancelledAt: null,
      }),
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual properties for easy frontend access
agentPatientSchema.virtual("commissionFee").get(function () {
  return this.agentCommissionFee ?? 0;
});

agentPatientSchema.virtual("paymentStatus").get(function () {
  return this.agentPaymentStatus ?? COMMISSION_PAYMENT_STATUS.UNPAID;
});

agentPatientSchema.virtual("subAgentCommissionFee").get(function () {
  return this.subAgentCommission ?? 0;
});

agentPatientSchema.virtual("totalCommissionFee").get(function () {
  return (this.agentCommissionFee || 0) + (this.subAgentCommission || 0);
});

agentPatientSchema.virtual("totalCommission").get(function () {
  return (this.agentCommissionFee || 0) + (this.subAgentCommission || 0);
});


// Indexes for query performance
agentPatientSchema.index({ agentUserId: 1, status: 1 });
agentPatientSchema.index({ agentUserId: 1, subAgentId: 1 });
agentPatientSchema.index({ agentUserId: 1, createdAt: -1 });
agentPatientSchema.index({ createdAt: -1 });

const AgentPatientModel = model<IAgentPatient>(
  "AgentPatient",
  agentPatientSchema,
);

export default AgentPatientModel;
