import { Schema, model } from "mongoose";
import { IAgent } from "./agent.interface";
import {
  AGENT_APPROVAL_STATUS,
  AGENT_APPROVAL_STATUS_VALUES,
  AGENT_STATUS,
  AGENT_STATUS_VALUES,
} from "./agent.constant";

const agentSchema = new Schema<IAgent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    agencyName: {
      type: String,
      required: [true, "Agency name is required"],
      trim: true,
    },
    approvalStatus: {
      type: String,
      enum: {
        values: AGENT_APPROVAL_STATUS_VALUES,
        message: "{VALUE} is not a valid approval status",
      },
      default: AGENT_APPROVAL_STATUS.PENDING,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: AGENT_STATUS_VALUES,
        message: "{VALUE} is not a valid status",
      },
      default: AGENT_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const AgentModel = model<IAgent>("Agent", agentSchema);
export default AgentModel;
