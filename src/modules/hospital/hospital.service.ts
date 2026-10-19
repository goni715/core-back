import { Request } from "express";
import { PipelineStage, Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import makePublicID from "../../utils/makePublicID";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import { HOSPITAL_SEARCHABLE_FIELDS } from "./hospital.constant";
import { THospitalQuery } from "./hospital.interface";
import HospitalModel from "./hospital.model";
import convertToSlug from "../../utils/convertToSlug";

/*=========== create hospital ============*/
const createHospital = async (req: Request) => {
  const payload = req.body;
  let image;

  const slug = convertToSlug(payload.name);
  payload.slug = slug;

  //check name
  const existingHospital = await HospitalModel.findOne({ slug });
  if (existingHospital) {
    throw new BadRequestError("Hospital name already exists");
  }

  try {
    // If image file uploaded via multer
    if (req.file) {
      image = await uploadToCloudinary(req.file.path, "hospital");
      payload.image = image.img_url;
    }

    if (!payload.image) {
      throw new BadRequestError("Hospital image is required");
    }

    const result = await HospitalModel.create(payload);
    return result;
  } catch (error) {
    // rollback cloudinary upload on error
    if (image?.public_id) {
      await deleteFromCloudinary(image.public_id);
    }
    throw error;
  }
};

/*============== get hospitals ================== */
const getHospitals = async (query: THospitalQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    status,
    ...filters
  } = query;

  // 1. set up pagination
  const skip = (Number(page) - 1) * Number(limit);

  // 2. setup sorting
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // 3. setup searching
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, HOSPITAL_SEARCHABLE_FIELDS);
  }

  // 4. setup filters
  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (status) {
    filterQuery.status = status;
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
  ];

  // Fetch hospitals list with projection
  const hospitals = await HospitalModel.aggregate([
    ...pipeline,
    {
      $project: {
        _id: 1,
        name: 1,
        image: 1,
        address: 1,
        contactNumber: 1,
        email: 1,
        website: 1,
        specialities: 1,
        languages: 1,
        status: 1,
        ratings: 1,
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
  const totalCountResult = await HospitalModel.aggregate(countPipeline);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: hospitals,
  };
};

/*============== get single hospital by id ================== */
const getHospitalById = async (hospitalId: string) => {
  if (!Types.ObjectId.isValid(hospitalId)) {
    throw new NotFoundError("Invalid hospital ID");
  }

  const hospital = await HospitalModel.findById(hospitalId);

  if (!hospital) {
    throw new NotFoundError("Hospital not found with the provided ID");
  }

  return hospital;
};

/*============== update hospital ================== */
const updateHospital = async (hospitalId: string, req: Request) => {
  if (!Types.ObjectId.isValid(hospitalId)) {
    throw new NotFoundError("Invalid hospital ID");
  }

  const hospital = await HospitalModel.findById(hospitalId);
  if (!hospital) {
    throw new NotFoundError("Hospital not found with the provided ID");
  }

  const payload = req.body;
  if (!req.file && Object.keys(payload).length === 0) {
    throw new BadRequestError(
      "At least one field or an image must be provided to update",
    );
  }

  let image;

  try {
    // If new image file uploaded
    if (req.file) {
      image = await uploadToCloudinary(req.file.path, "hospital");
      payload.image = image.img_url;
    }

    const updatedHospital = await HospitalModel.findByIdAndUpdate(
      hospitalId,
      { $set: payload },
      { new: true, runValidators: true },
    );

    // If new image uploaded and hospital had previous image, delete previous image from Cloudinary
    if (req.file && hospital?.image) {
      const public_id = makePublicID(hospital.image, "hospital");
      if (public_id) {
        await deleteFromCloudinary(public_id);
      }
    }

    return updatedHospital;
  } catch (error) {
    // rollback cloudinary upload on error
    if (image?.public_id) {
      await deleteFromCloudinary(image.public_id);
    }
    throw error;
  }
};

/*============== delete hospital ================== */
const deleteHospital = async (hospitalId: string) => {
  if (!Types.ObjectId.isValid(hospitalId)) {
    throw new NotFoundError("Invalid hospital ID");
  }

  const hospital = await HospitalModel.findById(hospitalId);
  if (!hospital) {
    throw new NotFoundError("Hospital not found with the provided ID");
  }

  const result = await HospitalModel.findByIdAndDelete(hospitalId);

  if (hospital?.image) {
    const public_id = makePublicID(hospital.image, "hospital");
    if (public_id) {
      await deleteFromCloudinary(public_id);
    }
  }

  return result;
};

const HospitalService = {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
};

export default HospitalService;
