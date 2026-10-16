import { Request } from "express";
import mongoose, { PipelineStage, Types } from "mongoose";
import config from "../../config";
import BadRequestError from "../../errors/BadRequestError";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import { ACCOUNT_STATUS, USER_ROLES } from "../user/user.constant";
import UserModel from "../user/user.model";
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_REGISTRATION_SOURCE,
  DOCTOR_SEARCHABLE_FIELDS,
  DOCTOR_STATUS,
  DOCTOR_TITLE,
} from "./doctor.constant";
import { IDoctor, TDoctorQuery } from "./doctor.interface";
import DoctorModel from "./doctor.model";

/*=========== admin approval / rejection ============*/
const approveOrRejectDoctor = async (
  doctorId: string,
  adminUserId: string,
  payload: {
    approvalStatus: (typeof DOCTOR_APPROVAL_STATUS)[keyof typeof DOCTOR_APPROVAL_STATUS];
    rejectionReason?: string;
    status?: (typeof DOCTOR_STATUS)[keyof typeof DOCTOR_STATUS];
  },
) => {
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }

  const { approvalStatus, rejectionReason, status } = payload;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (approvalStatus === DOCTOR_APPROVAL_STATUS.APPROVED) {
      doctor.approvalStatus = DOCTOR_APPROVAL_STATUS.APPROVED;
      doctor.approvedAt = new Date();
      doctor.approvedBy = new Types.ObjectId(adminUserId);
      doctor.rejectedAt = null;
      doctor.rejectedBy = null;
      doctor.rejectionReason = "";
      doctor.status = status || DOCTOR_STATUS.PUBLISHED;

      await doctor.save({ session });

      // Activate the user account
      await UserModel.findByIdAndUpdate(
        doctor.userId,
        { status: ACCOUNT_STATUS.ACTIVE },
        { session },
      );
    } else if (approvalStatus === DOCTOR_APPROVAL_STATUS.REJECTED) {
      doctor.approvalStatus = DOCTOR_APPROVAL_STATUS.REJECTED;
      doctor.rejectedAt = new Date();
      doctor.rejectedBy = new Types.ObjectId(adminUserId);
      doctor.approvedAt = null;
      doctor.approvedBy = null;
      doctor.rejectionReason =
        rejectionReason || "Registration rejected by administrator.";
      doctor.status = status || DOCTOR_STATUS.ARCHIVE;

      await doctor.save({ session });

      // Block or keep user account inactive
      await UserModel.findByIdAndUpdate(
        doctor.userId,
        { status: ACCOUNT_STATUS.BLOCKED },
        { session },
      );
    }

    await session.commitTransaction();

    const updatedDoctor = await DoctorModel.findById(doctorId)
      .populate("userId", "fullName email phone profileImg status role")
      .populate("approvedBy", "fullName email")
      .populate("rejectedBy", "fullName email");

    return updatedDoctor;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/*=========== change doctor status (published, draft, archive) ============*/
const changeDoctorStatus = async (
  doctorId: string,
  payload: {
    status: (typeof DOCTOR_STATUS)[keyof typeof DOCTOR_STATUS];
  },
) => {
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }

  const { status } = payload;

  if (status === DOCTOR_STATUS.PUBLISHED) {
    // Only approved doctors can be published
    if (doctor.approvalStatus !== DOCTOR_APPROVAL_STATUS.APPROVED) {
      throw new BadRequestError(
        "Doctor must be approved by admin before being published. Please approve the doctor first.",
      );
    }
  }

  doctor.status = status;
  await doctor.save();

  const updatedDoctor = await DoctorModel.findById(doctorId).populate(
    "userId",
    "fullName email phone profileImg status role",
  );

  return updatedDoctor;
};

/*=========== create doctor (Admin creation) ============*/
const createDoctor = async (reqOrPayload: any) => {
  let payload: any;
  let uploadedImage: { img_url: string; public_id: string } | null = null;

  try {
    if (reqOrPayload && reqOrPayload.body) {
      payload = reqOrPayload.body;
      if (reqOrPayload.file) {
        uploadedImage = await uploadToCloudinary(
          reqOrPayload.file.path,
          "doctor",
        );
        payload.profileImg = uploadedImage.img_url;
      }
    } else {
      payload = reqOrPayload;
    }

    const {
      email,
      password,
      fullName,
      phone,
      profileImg,
      bmdcNumber,
      title = DOCTOR_TITLE.DR,
      status = DOCTOR_STATUS.PUBLISHED,
      approvalStatus = DOCTOR_APPROVAL_STATUS.APPROVED,
      ...doctorData
    } = payload;

    // Check user
    const user = await UserModel.findOne({ email });
    if (user) {
      throw new ConflictError("An account with this email already exists.");
    }

    // Check BMDC number
    if (bmdcNumber) {
      const existingDoctor = await DoctorModel.findOne({ bmdcNumber });
      if (existingDoctor) {
        throw new ConflictError(
          "A doctor with this BMDC Number already exists.",
        );
      }
    }

    const defaultPassword =
      password || (config.admin.doctor_default_password as string);

    // 1. Create user account
    const newUser = await UserModel.create({
      fullName,
      email,
      phone,
      profileImg: profileImg || "",
      password: defaultPassword,
      role: USER_ROLES.DOCTOR,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      status: ACCOUNT_STATUS.ACTIVE,
    });

    // 2. Create doctor profile
    const doctor = await DoctorModel.create({
      ...doctorData,
      title,
      bmdcNumber,
      userId: newUser._id,
      approvalStatus,
      approvedAt:
        approvalStatus === DOCTOR_APPROVAL_STATUS.APPROVED
          ? new Date()
          : undefined,
      status:
        approvalStatus === DOCTOR_APPROVAL_STATUS.APPROVED
          ? status
          : DOCTOR_STATUS.DRAFT,
      registrationSource: DOCTOR_REGISTRATION_SOURCE.ADMIN,
    });

    const doctorObj = doctor.toObject();

    return {
      ...doctorObj,
      userId: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      profileImg: newUser.profileImg,
      role: newUser.role,
    };
  } catch (error) {
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }
    throw error;
  }
};

/*============== get doctors (Admin listing with filters) ================== */
const getDoctors = async (query: TDoctorQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    status,
    approvalStatus,
    registrationSource,
    userStatus,
    ...filters
  } = query;

  // 1. set up pagination
  const skip = (Number(page) - 1) * Number(limit);

  // 2. setup sorting
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // 3. setup searching
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, DOCTOR_SEARCHABLE_FIELDS);
  }

  // 4. setup filters
  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (status) {
    filterQuery["status"] = status;
  }

  if (approvalStatus) {
    filterQuery["approvalStatus"] = approvalStatus;
  }

  if (registrationSource) {
    filterQuery["registrationSource"] = registrationSource;
  }

  if (userStatus) {
    filterQuery["user.status"] = userStatus;
  }

  // Aggregate pipeline joining Doctor with User
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

  // Fetch doctors list with projection
  const doctors = await DoctorModel.aggregate([
    ...pipeline,
    {
      $project: {
        _id: 1,
        userId: 1,
        fullName: 1,
        email: 1,
        phone: 1,
        profileImg: 1,
        userStatus: 1,
        title: 1,
        specialization: 1,
        hospital: 1,
        country: 1,
        city: 1,
        bmdcNumber: 1,
        experience: 1,
        fee: 1,
        languages: 1,
        about: 1,
        qualifications: 1,
        consultationTypes: 1,
        availabilityLabel: 1,
        availableDays: 1,
        rating: 1,
        totalReviews: 1,
        approvalStatus: 1,
        approvedAt: 1,
        approvedBy: 1,
        rejectedAt: 1,
        rejectedBy: 1,
        rejectionReason: 1,
        status: 1,
        registrationSource: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  // Total count
  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: "totalCount" },
  ];
  const totalCountResult = await DoctorModel.aggregate(countPipeline);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: doctors,
  };
};

/*============== get published doctors (Public / Patient view) ================== */
const getPublishedDoctors = async (query: TDoctorQuery) => {
  return await getDoctors({
    ...query,
    approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
    status: DOCTOR_STATUS.PUBLISHED,
    userStatus: ACCOUNT_STATUS.ACTIVE,
  });
};

/*============== get single doctor by id ================== */
const getDoctorById = async (doctorId: string) => {
  const query = Types.ObjectId.isValid(doctorId)
    ? {
      $or: [
        { _id: new Types.ObjectId(doctorId) },
        { userId: new Types.ObjectId(doctorId) },
      ],
    }
    : null;

  if (!query) {
    throw new NotFoundError("Invalid doctor ID");
  }

  const doctor = await DoctorModel.findOne(query)
    .populate("userId", "fullName email phone profileImg status role")
    .populate("approvedBy", "fullName email")
    .populate("rejectedBy", "fullName email");

  if (!doctor) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }

  return doctor;
};

/*============== update doctor ================== */
const updateDoctor = async (doctorId: string, payload: any) => {
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }

  const { fullName, phone, profileImg, ...doctorData } = payload;

  // Update user fields if provided
  if (fullName || phone || profileImg) {
    await UserModel.findByIdAndUpdate(doctor.userId, {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(profileImg && { profileImg }),
    });
  }

  // Update doctor fields
  const updatedDoctor = await DoctorModel.findByIdAndUpdate(
    doctorId,
    { $set: doctorData },
    { new: true, runValidators: true },
  ).populate("userId", "fullName email phone profileImg status role");

  return updatedDoctor;
};

/*============== delete doctor ================== */
const deleteDoctor = async (doctorId: string) => {
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }

  // Delete doctor profile and user account
  await UserModel.findByIdAndDelete(doctor.userId);
  const result = await DoctorModel.findByIdAndDelete(doctorId);

  return result;
};

const DoctorService = {
  approveOrRejectDoctor,
  changeDoctorStatus,
  createDoctor,
  getDoctors,
  getPublishedDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};

export default DoctorService;