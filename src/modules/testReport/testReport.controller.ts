import asyncHandler from "../../utils/asyncHandler";
import TestReportService from "./testReport.service";

/*========== Create Test Report (Doctor) ==========*/
const createTestReport = asyncHandler(async (req, res) => {
  const { userId } = req.headers;

  const result = await TestReportService.createTestReport(
    userId as string,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Test report created successfully",
    data: result,
  });
});

/*========== Get Doctor Own Test Reports (Doctor) ==========*/
const getMyTestReports = asyncHandler(async (req, res) => {
  const { userId } = req.headers;
  const validatedQuery = (req as any).validatedQuery;

  const result = await TestReportService.getDoctorTestReports(
    userId as string,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "Test reports retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*========== Get Single Test Report (by ID, testId, or reportCode) ==========*/
const getSingleTestReport = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const result = await TestReportService.getSingleTestReport(
    identifier as string,
  );

  res.status(200).json({
    success: true,
    message: "Test report retrieved successfully",
    data: result,
  });
});

/*========== Update Test Report (Doctor / Admin) ==========*/
const updateTestReport = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const userRole = (req as any).user?.role || (req.headers.role as string);
  const { testReportId } = req.params;

  const result = await TestReportService.updateTestReport(
    doctorUserId,
    testReportId as string,
    req.body,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Test report updated successfully",
    data: result,
  });
});

/*========== Delete Test Report (Doctor / Admin) ==========*/
const deleteTestReport = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const userRole = (req as any).user?.role || (req.headers.role as string);
  const { testReportId } = req.params;

  const result = await TestReportService.deleteTestReport(
    doctorUserId,
    testReportId as string,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Test report deleted successfully",
    data: result,
  });
});

/*========== Get Patient Test Reports (Patient / Public with phone) ==========*/
const getPatientTestReports = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const patientPhone =
    (validatedQuery.patientPhoneNumber as string) ||
    (req.query.patientPhoneNumber as string) ||
    ((req as any).user?.phone as string) ||
    (req.headers.phone as string);

  const result = await TestReportService.getPatientTestReports(
    patientPhone || "",
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "Patient test reports retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*========== Get All Test Reports (Admin / Super Admin) ==========*/
const getAllTestReports = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;

  const result = await TestReportService.getAllTestReports(validatedQuery);

  res.status(200).json({
    success: true,
    message: "All test reports retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const TestReportController = {
  createTestReport,
  getMyTestReports,
  getSingleTestReport,
  updateTestReport,
  deleteTestReport,
  getPatientTestReports,
  getAllTestReports,
};

export default TestReportController;

