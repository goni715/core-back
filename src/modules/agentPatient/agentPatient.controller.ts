import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import AgentPatientService from "./agentPatient.service";

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

const AgentPatientController = {
  submitPatientByAgent,
  submitPatientBySubAgent,
  getPatientsByAgent,
  getPatientsBySubAgent,
  getStatusStats,
  getPatientById,
  updatePatient,
  updatePatientStatus,
  deletePatient,
};

export default AgentPatientController;
