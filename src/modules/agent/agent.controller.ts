import asyncHandler from "../../utils/asyncHandler";
import AgentService from "./agent.service";

const approveOrRejectAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.approveOrRejectAgent(
    agentId as string,
    req.body,
  );
  const message =
    req.body.approvalStatus === "approved"
      ? "Agent has been approved and activated successfully"
      : "Agent registration has been rejected";

  res.status(200).json({
    success: true,
    message,
    data: result,
  });
});

const changeAgentStatus = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.changeAgentStatus(
    agentId as string,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: `Agent status updated to ${result?.status} successfully`,
    data: result,
  });
});

const getAgents = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery;
  const result = await AgentService.getAgents(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Agents are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.getSingleAgent(agentId as string);
  res.status(200).json({
    success: true,
    message: "Agent is retrieved successfully",
    data: result,
  });
});

const updateAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const result = await AgentService.updateAgent(agentId as string, req);
  res.status(200).json({
    success: true,
    message: "Agent is updated successfully",
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
  approveOrRejectAgent,
  changeAgentStatus,
  getAgents,
  getSingleAgent,
  updateAgent,
  deleteAgent,
};

export default AgentController;
