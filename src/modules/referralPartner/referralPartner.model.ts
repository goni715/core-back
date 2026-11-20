import { Schema, model } from "mongoose";
import {
  REFERRAL_PARTNER_STATUS,
  REFERRAL_PARTNER_STATUS_VALUES,
} from "./referralPartner.constant";
import { IReferralPartner } from "./referralPartner.interface";

const referralPartnerSchema = new Schema<IReferralPartner>(
  {
    refCode: {
      type: String,
      required: false,
      trim: true,
      default: null,
      index: true,
    },
    agentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    agencyName: {
      type: String,
      required: [true, "Agency name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Partner email is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    initials: {
      type: String,
      trim: true,
      uppercase: true,
      default: function () {
        const targetName = (this as any).fullName || "";
        const parts = targetName.trim().split(/\s+/);
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return (targetName.substring(0, 2) || "RP").toUpperCase();
      },
    },
    joinedDate: {
      type: Date,
      default: null,
    },
    cases: {
      type: Number,
      default: 0,
      min: [0, "Cases count cannot be negative"],
    },
    ongoing: {
      type: Number,
      default: 0,
      min: [0, "Ongoing cases count cannot be negative"],
    },
    done: {
      type: Number,
      default: 0,
      min: [0, "Done cases count cannot be negative"],
    },
    earnings: {
      type: Number,
      default: 0,
      min: [0, "Earnings cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: REFERRAL_PARTNER_STATUS_VALUES,
        message: "{VALUE} is not a valid partner status",
      },
      default: REFERRAL_PARTNER_STATUS.INVITED,
      index: true,
    },
    inviteToken: {
      type: String,
      trim: true,
      default: null,
    },
    inviteLink: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Auto-fill initials & hash password before saving
referralPartnerSchema.pre("save", async function () {
  if (!this.initials && this.fullName) {
    const parts = this.fullName.trim().split(/\s+/);
    const firstWord = parts[0] || "";
    const lastWord = parts[parts.length - 1] || "";
    if (firstWord && lastWord && firstWord[0] && lastWord[0]) {
      this.initials = `${firstWord[0]}${lastWord[0]}`.toUpperCase();
    } else {
      this.initials = (this.fullName.substring(0, 2) || "RP").toUpperCase();
    }
  }
  if (this.status === REFERRAL_PARTNER_STATUS.ACTIVE && !this.joinedDate) {
    this.joinedDate = new Date();
  }
});

// Indexes for query performance
referralPartnerSchema.index({ agentUserId: 1, status: 1 });
referralPartnerSchema.index({ agentUserId: 1, createdAt: -1 });
referralPartnerSchema.index({ agentUserId: 1, cases: -1 });
referralPartnerSchema.index({ agentUserId: 1, earnings: -1 });

const ReferralPartnerModel = model<IReferralPartner>(
  "ReferralPartner",
  referralPartnerSchema,
);

export default ReferralPartnerModel;
