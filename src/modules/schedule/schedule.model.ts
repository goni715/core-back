import { Schema, model } from "mongoose";
import { ISchedule } from "./schedule.interface";
import { SCHEDULE_DAYS_VALUES } from "./schedule.constant";
import createDateTimeFromTime from "../../utils/createDateTimeFromTime";
import formatTime12Hour from "../../utils/formatTime12Hour";

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
    startDateTime: {
      type: Date,
      required: [true, "Start date time is required"],
      index: true,
    },
    endDateTime: {
      type: Date,
      required: [true, "End date time is required"],
      index: true,
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

// Fallback pre-validate hook ensuring 12-hour format and synchronized startDateTime / endDateTime
scheduleSchema.pre("validate", function () {
  if (this.startTime) {
    this.startTime = formatTime12Hour(this.startTime);
    if (!this.startDateTime) {
      this.startDateTime = createDateTimeFromTime(this.startTime);
    }
  }
  if (this.endTime) {
    this.endTime = formatTime12Hour(this.endTime);
    if (!this.endDateTime) {
      this.endDateTime = createDateTimeFromTime(this.endTime);
    }
  }
});

// Compound indexes to optimize queries for doctor schedules by day and time
scheduleSchema.index({ doctorUserId: 1, day: 1, startTime: 1, endTime: 1 });
scheduleSchema.index({ doctorUserId: 1, day: 1, startDateTime: 1, endDateTime: 1 });
scheduleSchema.index({ startDateTime: 1, endDateTime: 1 });

const ScheduleModel = model<ISchedule>("Schedule", scheduleSchema);
export default ScheduleModel;
