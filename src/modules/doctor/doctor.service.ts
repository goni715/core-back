import { PipelineStage, Types } from "mongoose";
import config from "../../config";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { ACCOUNT_STATUS, USER_ROLES } from "../user/user.constant";
import UserModel from "../user/user.model";
import { DOCTOR_SEARCHABLE_FIELDS } from "./doctor.constant";
import { IDoctor, TDoctorQuery } from "./doctor.interface";
import DoctorModel from "./doctor.model";

/*=========== create doctor ============*/
const createDoctor = async (payload: any) => {
  const { email, password, fullName, phone, profileImg, ...doctorData } =
    payload;

  // check user
  const user = await UserModel.findOne({ email });
  if (user) {
    throw new ConflictError("An account with this email already exists.");
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
    userId: newUser._id,
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
};

/*============== get doctors ================== */
const getDoctors = async (query: TDoctorQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    status,
    ...filters // additional filters (e.g. specialization, city, country, hospital, etc.)
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
    filterQuery["user.status"] = status;
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
        status: "$user.status",
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
        status: 1,
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

  const doctor = await DoctorModel.findOne(query).populate(
    "userId",
    "fullName email phone profileImg status role",
  );

  if (!doctor) {
    throw new NotFoundError("Doctor not found with the provided ID");
  }

  return doctor;
};

/*============== update doctor ================== */
const updateDoctor = async (
  doctorId: string,
  payload: any,
) => {
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
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};

export default DoctorService;