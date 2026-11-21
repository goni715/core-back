import asyncHandler from "../../utils/asyncHandler";
import AgentService from "./agent.service";

const createAgent = asyncHandler(async (req, res) => {
  const result = await AgentService.createAgent(req.body);

  res.status(200).json({
    success: true,
    message: "Channel partner is added successfully",
    data: result,
  });
});

const approveOrRejectAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.approveOrRejectAgent(
    agentId as string,
    req.body,
  );
  const message =
    req.body.approvalStatus === "approved"
      ? "Channel partner has been approved and activated successfully"
      : "Channel partner registration has been rejected";

  res.status(200).json({
    success: true,
    message,
    data: result,
  });
});


const getAgents = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery;
  const result = await AgentService.getAgents(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Channel partners are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.getSingleAgent(agentId as string);
  res.status(200).json({
    success: true,
    message: "Channel partner is retrieved successfully",
    data: result,
  });
});

const updateAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.updateAgent(agentId as string, req);
  res.status(200).json({
    success: true,
    message: "Channel partner is updated successfully",
    data: result,
  });
});

const deleteAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.deleteAgent(agentId as string);
  res.status(200).json({
    success: true,
    message: "Agent is deleted successfully",
    data: result,
  });
});

const AgentController = {
  createAgent,
  approveOrRejectAgent,
  getAgents,
  getSingleAgent,
  updateAgent,
  deleteAgent,
};

export default AgentController;
