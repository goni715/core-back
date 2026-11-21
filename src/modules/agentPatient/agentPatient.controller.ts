import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import AgentPatientService from "./agentPatient.service";
import DashboardService from "../dashboard/dashboard.service";
import { USER_ROLES } from "../user/user.constant";

/* ==================== Create Patient Case ==================== */
const submitPatientByAgent = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;

  const result = await AgentPatientService.submitPatientByAgent(
    userId as string,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Patient case submitted successfully",
    data: result,
  });
});

/* ==================== Create Patient Case ==================== */
const submitPatientBySubAgent = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;

  const result = await AgentPatientService.submitPatientBySubAgent(
    userId as string,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Patient case submitted successfully",
    data: result,
  });
});

/* ==================== Get Patients List ==================== */
const getPatientsByAgent = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const validatedQuery = (req as any).validatedQuery || req.query;

  const result = await AgentPatientService.getPatientsByAgent(
    userId as string,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "Patient cases retrieved successfully",
    meta: result.meta,
    statusCounts: result.statusCounts,
    data: result.data,
  });
});

/* ==================== Get Patients List ==================== */
const getPatientsBySubAgent = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const validatedQuery = (req as any).validatedQuery || req.query;

  const result = await AgentPatientService.getPatientsBySubAgent(
    userId as string,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "Patient cases retrieved successfully",
    meta: result.meta,
    statusCounts: result.statusCounts,
    data: result.data,
  });
});

/* ==================== Get All Patients By Admin ==================== */
const getAllPatientsByAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedQuery = (req as any).validatedQuery || req.query;

    const result =
      await AgentPatientService.getAllPatientsByAdmin(validatedQuery);

    res.status(200).json({
      success: true,
      message: "Patient cases retrieved successfully",
      meta: result.meta,
      statusCounts: result.statusCounts,
      data: result.data,
    });
  },
);

/* ==================== Get Status Stats ==================== */
const getStatusStats = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const result = await AgentPatientService.getStatusStats(userId as string);

  res.status(200).json({
    success: true,
    message: "Status statistics retrieved successfully",
    data: result,
  });
});

/* ==================== Get Sub-Agent Status Stats ==================== */
const getSubAgentStatusStats = asyncHandler(
  async (req: Request, res: Response) => {
    const subAgentId =
      (req.query.subAgentId as string) ||
      (((req as any).user?.userId || req.headers.userId) as string);
    const result = await DashboardService.getSubAgentStats(subAgentId);

    res.status(200).json({
      success: true,
      message: "Sub-agent statistics retrieved successfully",
      data: result,
    });
  },
);

/* ==================== Get Agent Stats ==================== */
const getAgentStats = asyncHandler(async (req: Request, res: Response) => {
  const role = (req as any).user?.role || (req.headers.role as string);
  const authUserId =
    (req as any).user?.userId || (req.headers.userId as string);

  const agentUserId =
    (req.query.agentUserId as string) ||
    (req.query.userId as string) ||
    (role === USER_ROLES.AGENT ? authUserId : authUserId);

  const result = await DashboardService.getAgentStats(agentUserId);

  res.status(200).json({
    success: true,
    message: "Agent statistics retrieved successfully",
    data: result,
  });
});

/* ==================== Get Agent Monthly Referrals ==================== */
const getAgentMonthlyReferrals = asyncHandler(
  async (req: Request, res: Response) => {
    const role = (req as any).user?.role || (req.headers.role as string);
    const authUserId =
      (req as any).user?.userId || (req.headers.userId as string);

    const agentUserId =
      (req.query.agentUserId as string) ||
      (req.query.userId as string) ||
      (role === USER_ROLES.AGENT ? authUserId : authUserId);

    const year = req.query.year as string;
    const result = await DashboardService.getAgentMonthlyReferrals(
      agentUserId,
      year,
    );

    res.status(200).json({
      success: true,
      message: "Agent monthly referrals retrieved successfully",
      data: result,
    });
  },
);

/* ==================== Get Agent Commission Stats & 12 Months Chart ==================== */
const getAgentCommissionStats = asyncHandler(
  async (req: Request, res: Response) => {
    const role = (req as any).user?.role || (req.headers.role as string);
    const authUserId =
      (req as any).user?.userId || (req.headers.userId as string);

    // If query provides agentUserId, or if caller is agent use their authUserId
    const agentUserId =
      (req.query.agentUserId as string) ||
      (req.query.userId as string) ||
      (role === USER_ROLES.AGENT ? authUserId : undefined);

    const query = (req as any).validatedQuery || req.query || {};

    const result = await AgentPatientService.getAgentCommissionStats(
      agentUserId,
      query,
    );

    res.status(200).json({
      success: true,
      message: "Agent commission stats retrieved successfully",
      data: result,
    });
  },
);

/* ==================== Get Sub-Agent Commission Stats & 12 Months Chart ==================== */
const getSubAgentCommissionStats = asyncHandler(
  async (req: Request, res: Response) => {
    const role = (req as any).user?.role || (req.headers.role as string);
    const authUserId =
      (req as any).user?.userId || (req.headers.userId as string);

    // If query provides subAgentId, or if caller is sub_agent use their authUserId
    const subAgentId =
      (req.query.subAgentId as string) ||
      (req.query.partnerId as string) ||
      (req.query.userId as string) ||
      (role === "sub_agent" ? authUserId : undefined);

    const query = (req as any).validatedQuery || req.query || {};

    const result = await AgentPatientService.getSubAgentCommissionStats(
      subAgentId,
      query,
    );

    res.status(200).json({
      success: true,
      message: "Sub-agent commission stats retrieved successfully",
      data: result,
    });
  },
);

/* ==================== Get Agent All Commissions ==================== */
const getAgentAllCommissions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req.headers.userId as string);
    const validatedQuery = (req as any).validatedQuery || req.query;

    const result = await AgentPatientService.getAgentAllCommissions(
      userId as string,
      validatedQuery,
    );

    res.status(200).json({
      success: true,
      message: "Agent commissions retrieved successfully",
      meta: result.meta,
      statusCounts: result.statusCounts,
      data: result.data,
    });
  },
);

/* ==================== Get Sub-Agent All Commissions ==================== */
const getSubAgentAllCommissionsByAgent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req.headers.userId as string);
    const validatedQuery = (req as any).validatedQuery || req.query;

    const result = await AgentPatientService.getSubAgentAllCommissionsByAgent(
      userId as string,
      validatedQuery,
    );

    res.status(200).json({
      success: true,
      message: "Sub-agent commissions retrieved successfully",
      meta: result.meta,
      statusCounts: result.statusCounts,
      data: result.data,
    });
  },
);

/* ==================== Get Single Patient Case By Agent ==================== */
const getPatientByAgent = asyncHandler(async (req: Request, res: Response) => {
  const userId =
    (req as any).user?.userId || (req.headers.userId as string);
  const { patientId } = req.params;

  const result = await AgentPatientService.getPatientByAgent(
    patientId as string,
    userId as string,
  );

  res.status(200).json({
    success: true,
    message: "Patient case retrieved successfully",
    data: result,
  });
});

/* ==================== Get Single Patient Case By Sub Agent ==================== */
const getPatientBySubAgent = asyncHandler(async (req: Request, res: Response) => {
  const userId =
    (req as any).user?.userId || (req.headers.userId as string);
  const { patientId } = req.params;

  const result = await AgentPatientService.getPatientBySubAgent(
    patientId as string,
    userId as string,
  );

  res.status(200).json({
    success: true,
    message: "Patient case retrieved successfully",
    data: result,
  });
});

const getPatientById = getPatientByAgent;

/* ==================== Update Patient Case ==================== */
const updatePatientByAgent = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { patientId } = req.params;

  const result = await AgentPatientService.updatePatientByAgent(
    patientId as string,
    userId as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Patient case updated successfully",
    data: result,
  });
});

/* ==================== Update Patient Case ==================== */
const updatePatientBySubAgent = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { patientId } = req.params;

  const result = await AgentPatientService.updatePatientBySubAgent(
    patientId as string,
    userId as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Patient case updated successfully",
    data: result,
  });
});

/* ==================== Update Patient Status ==================== */
const updatePatientStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.headers;
    const { patientId } = req.params;
    const { status } = req.body;

    const result = await AgentPatientService.updatePatientStatus(
      patientId as string,
      userId as string,
      status,
    );

    res.status(200).json({
      success: true,
      message: `Patient case status updated to '${status}' successfully`,
      data: result,
    });
  },
);

/* ==================== Delete Patient Case ==================== */
const deletePatient = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { patientId } = req.params;

  const result = await AgentPatientService.deletePatient(
    patientId as string,
    userId as string,
  );

  res.status(200).json({
    success: true,
    message: "Patient case deleted successfully",
    data: result,
  });
});

/* ==================== Update Agent Commission ==================== */
const updateAgentCommission = asyncHandler(
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { agentCommissionPercentage } = req.body;

    const result = await AgentPatientService.updateAgentCommission(
      patientId as string,
      agentCommissionPercentage,
    );

    res.status(200).json({
      success: true,
      message: "Agent commission fee updated successfully",
      data: result,
    });
  },
);

/* ==================== Update Sub-Agent Commission ==================== */
const updateSubAgentCommission = asyncHandler(
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { subAgentCommissionPercentage } = req.body;

    const result = await AgentPatientService.updateSubAgentCommission(
      patientId as string,
      subAgentCommissionPercentage,
    );

    res.status(200).json({
      success: true,
      message: "Sub-agent commission fee updated successfully",
      data: result,
    });
  },
);

/* ==================== Update Agent Payment Status ==================== */
const updateAgentPaymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { agentPaymentStatus, paymentStatus } = req.body;
    const targetStatus = agentPaymentStatus || paymentStatus;

    const result = await AgentPatientService.updateAgentPaymentStatus(
      patientId as string,
      {
        agentPaymentStatus: targetStatus,
        paymentStatus: targetStatus,
      },
    );

    res.status(200).json({
      success: true,
      message: `Agent payment status updated to '${targetStatus}' successfully`,
      data: result,
    });
  },
);

/* ==================== Update Sub-Agent Payment Status ==================== */
const updateSubAgentPaymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { subAgentPaymentStatus, paymentStatus } = req.body;
    const targetStatus = subAgentPaymentStatus || paymentStatus;

    const result = await AgentPatientService.updateSubAgentPaymentStatus(
      patientId as string,
      {
        subAgentPaymentStatus: targetStatus,
        paymentStatus: targetStatus,
      },
    );

    res.status(200).json({
      success: true,
      message: `Sub-agent payment status updated to '${targetStatus}' successfully`,
      data: result,
    });
  },
);


const updateRevenue = asyncHandler(
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { revenue } = req.body;

    const result = await AgentPatientService.updateRevenue(
      patientId as string,
      revenue as number,
    );

    res.status(200).json({
      success: true,
      message: `Revenue updated successfully`,
      data: result,
    });
  },
);

const AgentPatientController = {
  submitPatientByAgent,
  submitPatientBySubAgent,
  getPatientsByAgent,
  getPatientsBySubAgent,
  getAllPatientsByAdmin,
  getStatusStats,
  getSubAgentStatusStats,
  getAgentStats,
  getAgentMonthlyReferrals,
  getAgentCommissionStats,
  getSubAgentCommissionStats,
  getAgentAllCommissions,
  getSubAgentAllCommissionsByAgent,
  getPatientById,
  getPatientByAgent,
  getPatientBySubAgent,
  updatePatientByAgent,
  updatePatientBySubAgent,
  updatePatientStatus,
  deletePatient,
  updateAgentCommission,
  updateSubAgentCommission,
  updateAgentPaymentStatus,
  updateSubAgentPaymentStatus,
  updateRevenue
};

export default AgentPatientController;
