import { Schema, model } from "mongoose";
import { ISchedule } from "./schedule.interface";
import { SCHEDULE_DAYS_VALUES } from "./schedule.constant";

const scheduleSchema = new Schema<ISchedule>(
  {
    doctorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor User ID is required"],
      index: true,
    },
    day: {
      type: String,
      enum: {
        values: SCHEDULE_DAYS_VALUES,
        message: "{VALUE} is not a valid day",
      },
      required: [true, "Day is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compound index to optimize queries for doctor schedules by day
scheduleSchema.index({ doctorUserId: 1, day: 1, startTime: 1, endTime: 1 });

const ScheduleModel = model<ISchedule>("Schedule", scheduleSchema);
export default ScheduleModel;
