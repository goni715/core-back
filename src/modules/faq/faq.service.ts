import { PipelineStage } from "mongoose";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import convertToSlug from "../../utils/convertToSlug";
import { FAQ_SEARCHABLE_FIELDS } from "./faq.constant";
import { IFaq, TFaqQuery, TUserFaqQuery } from "./faq.interface";
import FaqModel from "./faq.model";

/*========== Create FAQ ==========*/
const createFaq = async (payload: IFaq) => {
  const { question } = payload;
  const slug = convertToSlug(question);
  payload.slug = slug;

  // Check if FAQ already exists
  const faq = await FaqModel.findOne({ slug });
  if (faq) {
    throw new ConflictError("This question already exists.");
  }

  // Create FAQ
  const result = await FaqModel.create(payload);
  return result;
};

/*========== Get All FAQs (Admin) ==========*/
const getAllFaqs = async (query: TFaqQuery) => {
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
    searchQuery = makeSearchQuery(searchTerm, FAQ_SEARCHABLE_FIELDS);
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

  const result = await FaqModel.aggregate([
    ...commonPipeline,
    {
      $project: {
        slug: 0,
        updatedAt: 0,
      },
    },
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await FaqModel.aggregate([
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
    data: result,
  };
};

/*========== Get FAQs for Users (Patients / Doctors / Agents / Public) ==========*/
const getUserFaqs = async (query?: TUserFaqQuery) => {
  let matchQuery: Record<string, unknown> = {
    isActive: true,
  };

  if (query?.category) {
    matchQuery.category = query.category;
  }

  if (query?.searchTerm) {
    const searchQuery = makeSearchQuery(query.searchTerm, FAQ_SEARCHABLE_FIELDS);
    matchQuery = {
      ...matchQuery,
      ...searchQuery,
    };
  }

  const result = await FaqModel.aggregate([
    {
      $match: matchQuery,
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        slug: 0,
        isActive: 0,
        updatedAt: 0,
      },
    },
  ]);
  return result;
};


/*========== Update FAQ ==========*/
const updateFaq = async (faqId: string, payload: Partial<IFaq>) => {
  const faq = await FaqModel.findById(faqId);
  if (!faq) {
    throw new NotFoundError("FAQ not found with the provided ID.");
  }

  // Check if question is being updated and slug already exists
  if (payload?.question) {
    const slug = convertToSlug(payload.question);
    payload.slug = slug;
    const faqExist = await FaqModel.findOne({
      _id: { $ne: faqId },
      slug,
    });
    if (faqExist) {
      throw new ConflictError("This question already exists.");
    }
  }

  const result = await FaqModel.findByIdAndUpdate(faqId, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

/*========== Delete FAQ ==========*/
const deleteFaq = async (faqId: string) => {
  const faq = await FaqModel.findById(faqId);
  if (!faq) {
    throw new NotFoundError("FAQ not found with the provided ID.");
  }

  const result = await FaqModel.deleteOne({ _id: faqId });
  return result;
};

const FaqService = {
  createFaq,
  getAllFaqs,
  getUserFaqs,
  updateFaq,
  deleteFaq,
};

export default FaqService;
