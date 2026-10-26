import mongoose, { PipelineStage } from "mongoose";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import { ACCOUNT_STATUS } from "../user/user.constant";
import UserModel from "../user/user.model";
import {
  AGENT_APPROVAL_STATUS,
  AGENT_SEARCHABLE_FIELDS,
  AGENT_STATUS,
} from "./agent.constant";
import {
  TAgentQuery,
  TUpdateAgentPayload,
} from "./agent.interface";
import AgentModel from "./agent.model";

/*=========== admin approval / rejection ============*/
const approveOrRejectAgent = async (
  agentId: string,
  payload: {
    approvalStatus: (typeof AGENT_APPROVAL_STATUS)[keyof typeof AGENT_APPROVAL_STATUS];
    status?: (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];
  },
) => {
  const agent = await AgentModel.findById(agentId);
  if (!agent) {
    throw new NotFoundError("Agent not found with the provided ID");
  }

  const { approvalStatus, status } = payload;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (approvalStatus === AGENT_APPROVAL_STATUS.APPROVED) {
      agent.approvalStatus = AGENT_APPROVAL_STATUS.APPROVED;
      agent.status = status || AGENT_STATUS.ACTIVE;

      await agent.save({ session });

      // Activate the user account
      await UserModel.findByIdAndUpdate(
        agent.userId,
        { status: ACCOUNT_STATUS.ACTIVE },
        { session },
      );
    } else if (approvalStatus === AGENT_APPROVAL_STATUS.REJECTED) {
      agent.approvalStatus = AGENT_APPROVAL_STATUS.REJECTED;
      agent.status = status || AGENT_STATUS.INACTIVE;

      await agent.save({ session });

      // Block user account
      await UserModel.findByIdAndUpdate(
        agent.userId,
        { status: ACCOUNT_STATUS.BLOCKED },
        { session },
      );
    }

    await session.commitTransaction();

    return agent;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/*=========== change agent status ============*/
const changeAgentStatus = async (
  agentId: string,
  payload: {
    status: (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];
  },
) => {
  const agent = await AgentModel.findById(agentId);
  if (!agent) {
    throw new NotFoundError("Agent not found with the provided ID");
  }

  const { status } = payload;

  agent.status = status;
  await agent.save();

  return agent;
};

/*=========== get agents ============*/
const getAgents = async (query: TAgentQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, AGENT_SEARCHABLE_FIELDS);
  }

  let filterQuery = {};
  if (Object.keys(filters).length > 0) {
    filterQuery = makeFilterQuery(filters);
  }

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $addFields: {
        fullName: "$user.fullName",
        email: "$user.email",
        phone: "$user.phone",
        profileImg: "$user.profileImg",
        userStatus: "$user.status",
      },
    },
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
  ];

  const agents = await AgentModel.aggregate([
    ...pipeline,
    {
      $project: {
        _id: 1,
        userId: "$userId",
        agencyName: "$agencyName",
        approvalStatus: "$approvalStatus",
        status: "$status",
        fullName: "$fullName",
        email: "$email",
        phone: "$phone",
        profileImg: "$profileImg",
        userStatus: "$userStatus",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
      },
    },
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: "totalCount" },
  ];
  const totalCountResult = await AgentModel.aggregate(countPipeline);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: agents,
  };
};

/*=========== get single agent ============*/
const getSingleAgent = async (agentId: string) => {
  const agent = await AgentModel.findById(agentId).populate(
    "userId",
    "fullName email phone profileImg status role",
  );

  if (!agent) {
    throw new NotFoundError("Agent not found with the provided ID");
  }

  return agent;
};

/*=========== update agent ============*/
const updateAgent = async (agentId: string, req: any) => {
  const payload = req.body as TUpdateAgentPayload;
  const { fullName, phone, profileImg, ...agentData } = payload;

  const agent = await AgentModel.findById(agentId);
  if (!agent) {
    throw new NotFoundError("Agent not found with the provided ID");
  }

  let uploadedImage: any = null;

  try {
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.path, "agent");
      (agentData as any).profileImg = uploadedImage?.img_url;
    }

    // Check phone uniqueness if phone is being updated
    if (phone) {
      const existingPhone = await UserModel.findOne({
        phone,
        _id: { $ne: agent.userId },
      });
      if (existingPhone) {
        throw new ConflictError(
          "An account with this phone number already exists.",
        );
      }
    }

    // Update user fields if provided
    if (fullName || phone || (agentData as any).profileImg || profileImg) {
      await UserModel.findByIdAndUpdate(agent.userId, {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(((agentData as any).profileImg || profileImg) && {
          profileImg: (agentData as any).profileImg || profileImg,
        }),
      });
    }

    const updatedAgent = await AgentModel.findByIdAndUpdate(
      agentId,
      { $set: agentData },
      { new: true, runValidators: true },
    ).populate("userId", "fullName email phone profileImg status role");

    return updatedAgent;
  } catch (error) {
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }
    throw error;
  }
};

/*=========== delete agent ============*/
const deleteAgent = async (agentId: string) => {
  const agent = await AgentModel.findById(agentId);
  if (!agent) {
    throw new NotFoundError("Agent not found with the provided ID");
  }

  await UserModel.findByIdAndDelete(agent.userId);
  const result = await AgentModel.findByIdAndDelete(agentId);

  return result;
};

const AgentService = {
  approveOrRejectAgent,
  changeAgentStatus,
  getAgents,
  getSingleAgent,
  updateAgent,
  deleteAgent,
};

export default AgentService;
