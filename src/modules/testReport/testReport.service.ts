import { PipelineStage, Types } from "mongoose";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { TEST_REPORT_SEARCHABLE_FIELDS } from "./testReport.constant";
import { ITestReport, TTestReportQuery } from "./testReport.interface";
import TestReportModel, { generateSixDigitTestId } from "./testReport.model";

/*========== Create Test Report (Doctor) ==========*/
const createTestReport = async (
  doctorUserId: string,
  payload: Partial<ITestReport>,
) => {
  // Generate a guaranteed unique 6-digit testId
  const testId = generateSixDigitTestId();
  payload.testId = testId;

  // Assign doctor ID from authenticated user
  payload.doctorUserId = new Types.ObjectId(doctorUserId);

  const result = await TestReportModel.create(payload);
  return result;
};

/*========== Get Doctor Own Test Reports (Doctor) ==========*/
const getDoctorTestReports = async (
  doctorUserId: string,
  query: TTestReportQuery,
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
    patientPhoneNumber,
    reportDate,
    startDate,
    endDate,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, TEST_REPORT_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (status) {
    filterQuery.status = status;
  }

  if (patientPhoneNumber) {
    filterQuery.patientPhoneNumber = {
      $regex: patientPhoneNumber.trim(),
      $options: "i",
    };
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        doctorUserId: new Types.ObjectId(doctorUserId),
        ...searchQuery,
        ...filterQuery,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        testId: 1,
        reportCode: 1,
        reportName: 1,
        hospitalName: 1,
        reportDate: 1,
        patientId: 1,
        patientName: 1,
        patientPhoneNumber: 1,
        patientAge: 1,
        patientGender: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        testResults: 1,
        summary: 1,
        status: 1,
        fileUrl: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const reports = await TestReportModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await TestReportModel.aggregate([
    {
      $match: {
        doctorId: new Types.ObjectId(doctorUserId),
        ...searchQuery,
        ...filterQuery,
      },
    },
    { $count: "totalCount" },
  ]);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: reports,
  };
};

/*========== Get Single Test Report (by ID, testId, or reportCode) ==========*/
const getSingleTestReport = async (identifier: string) => {
  const isId = Types.ObjectId.isValid(identifier);
  const matchFilter = isId
    ? {
        $or: [
          { _id: new Types.ObjectId(identifier) },
          { testId: identifier },
          { reportCode: identifier },
        ],
      }
    : {
        $or: [
          { testId: identifier },
          { reportCode: identifier },
        ],
      };

  const reports = await TestReportModel.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        testId: 1,
        reportCode: 1,
        reportName: 1,
        hospitalName: 1,
        reportDate: 1,
        patientId: 1,
        patientName: 1,
        patientPhoneNumber: 1,
        patientAge: 1,
        patientGender: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorProfileImg: "$doctorUser.profileImg",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctor: {
          _id: "$doctorUser._id",
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
        testResults: 1,
        summary: 1,
        status: 1,
        fileUrl: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!reports || reports.length === 0) {
    throw new NotFoundError(
      "Test report not found with the provided identifier.",
    );
  }

  return reports[0];
};

/*========== Update Test Report (Doctor / Admin) ==========*/
const updateTestReport = async (
  doctorUserId: string,
  testReportId: string,
  payload: Partial<ITestReport>,
  userRole?: string,
) => {
  if (!Types.ObjectId.isValid(testReportId)) {
    throw new NotFoundError("Invalid test report ID.");
  }

  const existingReport = await TestReportModel.findById(testReportId);
  if (!existingReport) {
    throw new NotFoundError("Test report not found with the provided ID.");
  }

  const result = await TestReportModel.findByIdAndUpdate(
    testReportId,
    { $set: payload },
    { new: true, runValidators: true },
  );

  return result;
};

/*========== Delete Test Report (Doctor / Admin) ==========*/
const deleteTestReport = async (
  doctorUserId: string,
  testReportId: string,
  userRole?: string,
) => {
  if (!Types.ObjectId.isValid(testReportId)) {
    throw new NotFoundError("Invalid test report ID.");
  }

  const existingReport = await TestReportModel.findById(testReportId);
  if (!existingReport) {
    throw new NotFoundError("Test report not found with the provided ID.");
  }

  const result = await TestReportModel.findByIdAndDelete(testReportId);
  return result;
};

/*========== Get Patient Own Test Reports (Patient) ==========*/
const getPatientTestReports = async (
  patientPhone: string,
  query: TTestReportQuery,
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "reportDate",
    sortOrder = "desc",
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, TEST_REPORT_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        patientPhoneNumber: {
          $regex: `^${patientPhone.trim()}$`,
          $options: "i",
        },
        ...searchQuery,
        ...filterQuery,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        testId: 1,
        reportCode: 1,
        reportName: 1,
        hospitalName: 1,
        reportDate: 1,
        patientId: 1,
        patientName: 1,
        patientPhoneNumber: 1,
        patientAge: 1,
        patientGender: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctor: {
          _id: "$doctorUser._id",
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
        testResults: 1,
        summary: 1,
        status: 1,
        fileUrl: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const reports = await TestReportModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await TestReportModel.aggregate([
    {
      $match: {
        patientPhoneNumber: {
          $regex: `^${patientPhone.trim()}$`,
          $options: "i",
        },
        ...searchQuery,
        ...filterQuery,
      },
    },
    { $count: "totalCount" },
  ]);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: reports,
  };
};

/*========== Get All Test Reports (Admin / Super Admin) ==========*/
const getAllTestReports = async (query: TTestReportQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    doctorId,
    status,
    patientPhoneNumber,
    reportDate,
    startDate,
    endDate,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, TEST_REPORT_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (doctorId && Types.ObjectId.isValid(doctorId)) {
    filterQuery.doctorId = new Types.ObjectId(doctorId);
  }

  if (status) {
    filterQuery.status = status;
  }

  if (patientPhoneNumber) {
    filterQuery.patientPhoneNumber = {
      $regex: patientPhoneNumber.trim(),
      $options: "i",
    };
  }

  if (reportDate) {
    const targetDate = new Date(reportDate);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    filterQuery.reportDate = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate || endDate) {
    const dateRange: Record<string, Date> = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setUTCHours(0, 0, 0, 0);
      dateRange.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setUTCHours(23, 59, 59, 999);
      dateRange.$lte = e;
    }
    filterQuery.reportDate = dateRange;
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        testId: 1,
        reportCode: 1,
        reportName: 1,
        hospitalName: 1,
        reportDate: 1,
        patientId: 1,
        patientName: 1,
        patientPhoneNumber: 1,
        patientAge: 1,
        patientGender: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctor: {
          _id: "$doctorUser._id",
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
        testResults: 1,
        summary: 1,
        status: 1,
        fileUrl: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const reports = await TestReportModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await TestReportModel.aggregate([
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
    { $count: "totalCount" },
  ]);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: reports,
  };
};

const TestReportService = {
  createTestReport,
  getDoctorTestReports,
  getSingleTestReport,
  updateTestReport,
  deleteTestReport,
  getPatientTestReports,
  getAllTestReports,
};

export default TestReportService;

