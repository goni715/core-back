import { Schema, model } from 'mongoose';
import { ISupport } from './support.interface';
import { SUPPORT_STATUS, SUPPORT_STATUS_VALUES } from './support.constant';

const supportSchema = new Schema<ISupport>({
     fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    subject: {
        type: String,
        required: [true, "subject is required"],
        trim: true,
        maxlength: 150,
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        maxlength: 1000,
    },
    replyMessage: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
    },
    replyAt: {
        type: Date,
        default: null,
        index: true
    },
    status: {
        type: String,
        enum: SUPPORT_STATUS_VALUES,
        default: SUPPORT_STATUS.OPEN,
        index: true
    },
}, {
    timestamps: true,
    versionKey: false
})

// support sort by last update time
supportSchema.index({ createdAt: -1 })

const SupportModel = model<ISupport>('Support', supportSchema);
export default SupportModel;