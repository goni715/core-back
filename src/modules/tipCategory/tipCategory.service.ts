import { PipelineStage, Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import convertToSlug from "../../utils/convertToSlug";
import HealthTipModel from "../healthTip/healthTip.model";
import {
  TIP_CATEGORY_SEARCHABLE_FIELDS,
  TIP_CATEGORY_STATUS,
} from "./tipCategory.constant";
import { ITipCategory, TTipCategoryQuery } from "./tipCategory.interface";
import TipCategoryModel from "./tipCategory.model";

/*========== Create Tip Category (Admin) ==========*/
const createTipCategory = async (payload: Partial<ITipCategory>) => {
  const name = payload.name?.trim() as string;
  const slug = convertToSlug(name);
  payload.name = name;
  payload.slug = slug;

  // Check if category name or slug already exists
  const existingCategory = await TipCategoryModel.findOne({
    $or: [
      { name: { $regex: `^${name}$`, $options: "i" } },
      { slug },
    ],
  });

  if (existingCategory) {
    throw new ConflictError("Tip category with this name already exists.");
  }

  const result = await TipCategoryModel.create(payload);
  return result;
};

/*========== Get All Tip Categories (Admin) ==========*/
const getTipCategories = async (query: TTipCategoryQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, TIP_CATEGORY_SEARCHABLE_FIELDS);
  }

  let filterQuery = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
  ];

  const categories = await TipCategoryModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await TipCategoryModel.aggregate([
    ...commonPipeline,
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
    data: categories,
  };
};

/*========== Get Category Dropdown (Public & Admin) ==========*/
const getCategoryDropdown = async () => {
  const categories = await TipCategoryModel.find(
    { status: TIP_CATEGORY_STATUS.PUBLISHED },
    { _id: 1, name: 1, slug: 1 },
  )
    .sort({ name: 1 })
    .lean();

  return categories;
};

/*========== Get Single Tip Category By ID ==========*/
const getTipCategoryById = async (categoryId: string) => {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundError("Invalid category ID.");
  }

  const category = await TipCategoryModel.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Tip category not found with the provided ID.");
  }

  return category;
};

/*========== Update Tip Category (Admin) ==========*/
const updateTipCategory = async (
  categoryId: string,
  payload: Partial<ITipCategory>,
) => {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundError("Invalid category ID.");
  }

  const category = await TipCategoryModel.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Tip category not found with the provided ID.");
  }

  // If name is updated, check conflict and update slug
  if (payload.name) {
    const trimmedName = payload.name.trim();
    const slug = convertToSlug(trimmedName);
    payload.name = trimmedName;
    payload.slug = slug;

    const existingConflict = await TipCategoryModel.findOne({
      _id: { $ne: categoryId },
      $or: [
        { name: { $regex: `^${trimmedName}$`, $options: "i" } },
        { slug },
      ],
    });

    if (existingConflict) {
      throw new ConflictError("Another category already exists with this name.");
    }
  }

  const result = await TipCategoryModel.findByIdAndUpdate(
    categoryId,
    { $set: payload },
    { new: true, runValidators: true },
  );

  return result;
};

/*========== Delete Tip Category (Admin) ==========*/
const deleteTipCategory = async (categoryId: string) => {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new NotFoundError("Invalid category ID.");
  }

  const category = await TipCategoryModel.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Tip category not found with the provided ID.");
  }

  // Check if any health tips are associated with this category
  const associatedTipsCount = await HealthTipModel.countDocuments({
    categoryId: new Types.ObjectId(categoryId),
  });

  if (associatedTipsCount > 0) {
    throw new BadRequestError(
      `Cannot delete category because ${associatedTipsCount} health tip(s) are associated with it. Please reassign or delete them first.`,
    );
  }

  const result = await TipCategoryModel.findByIdAndDelete(categoryId);
  return result;
};

const TipCategoryService = {
  createTipCategory,
  getTipCategories,
  getCategoryDropdown,
  getTipCategoryById,
  updateTipCategory,
  deleteTipCategory,
};

export default TipCategoryService;

