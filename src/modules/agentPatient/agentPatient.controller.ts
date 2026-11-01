import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import AgentPatientService from "./agentPatient.service";
import { USER_ROLES } from "../user/user.constant";

/* ==================== Create Patient Case ==================== */
const submitPatientByAgent = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

  const result = await AgentPatientService.submitPatientByAgent(
    userId as string,
    req.body,
    files,
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
  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

  const result = await AgentPatientService.submitPatientBySubAgent(
    userId as string,
    req.body,
    files,
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

/* ==================== Get Single Patient Case ==================== */
const getPatientById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { patientId } = req.params;

  const result = await AgentPatientService.getPatientById(
    patientId as string,
    userId as string,
  );

  res.status(200).json({
    success: true,
    message: "Patient case retrieved successfully",
    data: result,
  });
});

/* ==================== Update Patient Case ==================== */
const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { patientId } = req.params;
  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

  const result = await AgentPatientService.updatePatient(
    patientId as string,
    userId as string,
    req.body,
    files,
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
    const patientId =
      req.params.patientId ||
      req.params.agentPatientId ||
      req.body.patientId ||
      req.body.agentPatientId;
    const {
      agentUserId,
      agentCommissionFee,
      paymentStatus,
      agentPaymentStatus,
    } = req.body;

    const result = await AgentPatientService.updateAgentCommission(
      patientId as string,
      {
        agentUserId,
        agentCommissionFee:
          agentCommissionFee !== undefined
            ? Number(agentCommissionFee)
            : undefined,
        paymentStatus: paymentStatus || agentPaymentStatus,
      },
    );

    res.status(200).json({
      success: true,
      message: "Agent commission and payment status updated successfully",
      data: result,
    });
  },
);

/* ==================== Update Sub-Agent Commission ==================== */
const updateSubAgentCommission = asyncHandler(
  async (req: Request, res: Response) => {
    const patientId =
      req.params.patientId ||
      req.params.agentPatientId ||
      req.body.patientId ||
      req.body.agentPatientId;
    const {
      subAgentId,
      subAgentCommission,
      subAgentCommissionFee,
      paymentStatus,
      subAgentPaymentStatus,
    } = req.body;

    const commission =
      subAgentCommission !== undefined
        ? subAgentCommission
        : subAgentCommissionFee;

    const result = await AgentPatientService.updateSubAgentCommission(
      patientId as string,
      {
        subAgentId,
        subAgentCommission:
          commission !== undefined ? Number(commission) : undefined,
        paymentStatus: paymentStatus || subAgentPaymentStatus,
      },
    );

    res.status(200).json({
      success: true,
      message: "Sub-agent commission and payment status updated successfully",
      data: result,
    });
  },
);

/* ==================== Update Agent Payment Status ==================== */
const updateAgentPaymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const patientId =
      req.params.patientId ||
      req.params.agentPatientId ||
      req.body.patientId ||
      req.body.agentPatientId;
    const { agentUserId, paymentStatus, agentPaymentStatus } = req.body;

    const result = await AgentPatientService.updateAgentPaymentStatus(
      patientId as string,
      {
        agentUserId,
        paymentStatus: paymentStatus || agentPaymentStatus,
      },
    );

    res.status(200).json({
      success: true,
      message: "Agent payment status updated successfully",
      data: result,
    });
  },
);

/* ==================== Update Sub-Agent Payment Status ==================== */
const updateSubAgentPaymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const patientId =
      req.params.patientId ||
      req.params.agentPatientId ||
      req.body.patientId ||
      req.body.agentPatientId;
    const { subAgentId, paymentStatus, subAgentPaymentStatus } = req.body;

    const result = await AgentPatientService.updateSubAgentPaymentStatus(
      patientId as string,
      {
        subAgentId,
        paymentStatus: paymentStatus || subAgentPaymentStatus,
      },
    );

    res.status(200).json({
      success: true,
      message: "Sub-agent payment status updated successfully",
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
  getAgentCommissionStats,
  getSubAgentCommissionStats,
  getPatientById,
  updatePatient,
  updatePatientStatus,
  deletePatient,
  updateAgentCommission,
  updateSubAgentCommission,
  updateAgentPaymentStatus,
  updateSubAgentPaymentStatus,
};

export default AgentPatientController;
