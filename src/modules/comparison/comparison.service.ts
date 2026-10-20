import { PipelineStage, Types } from "mongoose";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import BadRequestError from "../../errors/BadRequestError";
import {
  COMPARISON_SEARCHABLE_FIELDS,
  COMPARISON_STATUS,
} from "./comparison.constant";
import {
  IComparison,
  TCompareQuery,
  TComparisonQuery,
} from "./comparison.interface";
import ComparisonModel from "./comparison.model";
import { makeFilterQuery } from "../../helpers/QueryBuilder";

// Helper to generate clean, URL-friendly slug
const generateSlug = (
  treatmentName: string,
  country1: string,
  country2: string,
): string => {
  const raw = `${treatmentName}-${country1}-vs-${country2}`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

/*=========== Create Comparison ============*/
const createComparison = async (payload: Partial<IComparison>) => {
  const { treatmentName, firstCountry, secondCountry } = payload;

  if (!treatmentName || !firstCountry || !secondCountry) {
    throw new BadRequestError(
      "Treatment name, first country, and second country are required",
    );
  }

  const slug = generateSlug(
    treatmentName,
    firstCountry.country,
    secondCountry.country,
  );

  // Check if comparison already exists
  const existing = await ComparisonModel.findOne({ slug });
  if (existing) {
    throw new ConflictError(
      "A comparison for this treatment between these countries already exists",
    );
  }

  payload.slug = slug;

  // Compute savings percentage if not provided
  if (!payload.savingsPercentage && (firstCountry.costUSD || secondCountry.costUSD)) {
    const cost1 = firstCountry.costUSD || 0;
    const cost2 = secondCountry.costUSD || 0;
    const maxCost = Math.max(cost1, cost2);
    if (maxCost > 0) {
      payload.savingsPercentage = Math.round(
        (Math.abs(cost1 - cost2) / maxCost) * 100,
      );
    }
  }

  const result = await ComparisonModel.create(payload);
  return result;
};

/*=========== Get All Comparisons (with search, filter, pagination) ============*/
const getComparisons = async (query: TComparisonQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    ...filters
  } = query;

  // 1. Pagination setup
  const skip = (Number(page) - 1) * Number(limit);

  // 2. Sorting setup
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // 3. Search query
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm) {
    searchQuery = {
      $or: COMPARISON_SEARCHABLE_FIELDS.map((field) => ({
        [field]: { $regex: searchTerm, $options: "i" },
      })),
    };
  }

  // 4. setup filters
  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }


  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
  ];

  // Fetch comparisons list
  const comparisons = await ComparisonModel.aggregate([
    ...pipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  // Total count
  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: "totalCount" },
  ];
  const totalCountResult = await ComparisonModel.aggregate(countPipeline);
  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: comparisons,
  };
};

/*=========== Get Single Comparison by ID or Slug ============*/
const getComparisonById = async (comparisonId: string) => {
  const query = Types.ObjectId.isValid(comparisonId)
    ? { _id: new Types.ObjectId(comparisonId) }
    : { slug: comparisonId };

  const comparison = await ComparisonModel.findOne(query);
  if (!comparison) {
    throw new NotFoundError("Comparison not found with the provided ID or slug");
  }

  return comparison;
};

/*=========== Compare Side-by-Side (Search Bar Widget) ============*/
const compareSideBySide = async (query: TCompareQuery) => {
  const { treatmentName, treatment, firstCountry, secondCountry } = query;
  const targetTreatment = treatmentName || treatment;

  const matchConditions: Record<string, unknown>[] = [];

  // Filter by treatment if provided
  if (targetTreatment) {
    matchConditions.push({
      treatmentName: { $regex: targetTreatment.trim(), $options: "i" },
    });
  }

  // Order-independent country match
  if (firstCountry && secondCountry) {
    const c1Regex = new RegExp(`^${firstCountry.trim()}$`, "i");
    const c2Regex = new RegExp(`^${secondCountry.trim()}$`, "i");
    const c1Code = firstCountry.trim().toUpperCase();
    const c2Code = secondCountry.trim().toUpperCase();

    matchConditions.push({
      $or: [
        {
          $and: [
            {
              $or: [
                { "firstCountry.country": { $regex: c1Regex } },
                { "firstCountry.countryCode": c1Code },
              ],
            },
            {
              $or: [
                { "secondCountry.country": { $regex: c2Regex } },
                { "secondCountry.countryCode": c2Code },
              ],
            },
          ],
        },
        {
          $and: [
            {
              $or: [
                { "firstCountry.country": { $regex: c2Regex } },
                { "firstCountry.countryCode": c2Code },
              ],
            },
            {
              $or: [
                { "secondCountry.country": { $regex: c1Regex } },
                { "secondCountry.countryCode": c1Code },
              ],
            },
          ],
        },
      ],
    });
  } else if (firstCountry) {
    const c1Regex = new RegExp(firstCountry.trim(), "i");
    matchConditions.push({
      $or: [
        { "firstCountry.country": { $regex: c1Regex } },
        { "firstCountry.countryCode": firstCountry.trim().toUpperCase() },
        { "secondCountry.country": { $regex: c1Regex } },
        { "secondCountry.countryCode": firstCountry.trim().toUpperCase() },
      ],
    });
  }

  const matchQuery =
    matchConditions.length > 0 ? { $and: matchConditions } : {};

  const results = await ComparisonModel.find({
    ...matchQuery,
    status: COMPARISON_STATUS.PUBLISHED,
  }).sort({ createdAt: -1 });

  return results;
};

/*=========== Get Popular Comparisons (Screenshot 2) ============*/
const getPopularComparisons = async (limit = 8) => {
  const popularComparisons = await ComparisonModel.find({
    isPopular: true,
    status: COMPARISON_STATUS.PUBLISHED,
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  return popularComparisons;
};

/*=========== Get Dropdown Options (Screenshot 1: Choose treatment & Choose country) ============*/
const getComparisonOptions = async () => {
  const publishedComparisons = await ComparisonModel.find({
    status: COMPARISON_STATUS.PUBLISHED,
  }).select("treatmentName category firstCountry secondCountry");

  // Distinct treatments
  const treatmentSet = new Set<string>();
  const treatments: { name: string; category?: string | undefined }[] = [];

  // Distinct countries
  const countryMap = new Map<string, { country: string; countryCode: string }>();

  publishedComparisons.forEach((item) => {
    if (item.treatmentName && !treatmentSet.has(item.treatmentName)) {
      treatmentSet.add(item.treatmentName);
      treatments.push({
        name: item.treatmentName,
        category: item.category ?? undefined,
      });
    }

    if (item.firstCountry?.country) {
      countryMap.set(item.firstCountry.country.toLowerCase(), {
        country: item.firstCountry.country,
        countryCode: item.firstCountry.countryCode,
      });
    }

    if (item.secondCountry?.country) {
      countryMap.set(item.secondCountry.country.toLowerCase(), {
        country: item.secondCountry.country,
        countryCode: item.secondCountry.countryCode,
      });
    }
  });

  return {
    treatments,
    countries: Array.from(countryMap.values()),
  };
};

/*=========== Get Comparison Stats (Screenshot 1: 84+ Treatments, 11 Countries, 2,687 Comparisons, 90% Possible saving) ============*/
const getComparisonStats = async () => {
  const [totalComparisons, treatmentAggregation, countryAggregation, maxSavingResult] =
    await Promise.all([
      ComparisonModel.countDocuments({ status: COMPARISON_STATUS.PUBLISHED }),
      ComparisonModel.distinct("treatmentName", {
        status: COMPARISON_STATUS.PUBLISHED,
      }),
      ComparisonModel.aggregate([
        { $match: { status: COMPARISON_STATUS.PUBLISHED } },
        {
          $project: {
            countries: ["$firstCountry.country", "$secondCountry.country"],
          },
        },
        { $unwind: "$countries" },
        { $group: { _id: { $toLower: "$countries" } } },
        { $count: "total" },
      ]),
      ComparisonModel.findOne({ status: COMPARISON_STATUS.PUBLISHED })
        .sort({ savingsPercentage: -1 })
        .select("savingsPercentage"),
    ]);

  const totalCountries = countryAggregation[0]?.total || 0;
  const totalTreatments = treatmentAggregation.length;
  const maxPossibleSaving = maxSavingResult?.savingsPercentage || 90;

  return {
    totalTreatments,
    totalCountries,
    totalComparisons,
    maxPossibleSaving: `${maxPossibleSaving}%`,
  };
};

/*=========== Update Comparison ============*/
const updateComparison = async (
  comparisonId: string,
  payload: Partial<IComparison>,
) => {
  if (!Types.ObjectId.isValid(comparisonId)) {
    throw new NotFoundError("Invalid comparison ID");
  }

  const existingComparison = await ComparisonModel.findById(comparisonId);
  if (!existingComparison) {
    throw new NotFoundError("Comparison not found with the provided ID");
  }

  // If treatmentName or countries are updated, regenerate slug and check uniqueness
  const updatedTreatment =
    payload.treatmentName || existingComparison.treatmentName;
  const updatedCountry1 =
    payload.firstCountry?.country || existingComparison.firstCountry.country;
  const updatedCountry2 =
    payload.secondCountry?.country || existingComparison.secondCountry.country;

  const newSlug = generateSlug(
    updatedTreatment,
    updatedCountry1,
    updatedCountry2,
  );

  if (newSlug !== existingComparison.slug) {
    const slugExists = await ComparisonModel.findOne({
      _id: { $ne: comparisonId },
      slug: newSlug,
    });
    if (slugExists) {
      throw new ConflictError(
        "A comparison for this treatment between these countries already exists",
      );
    }
    payload.slug = newSlug;
  }

  // Recalculate savings percentage if cost is updated and savingsPercentage not explicitly given
  if (
    payload.firstCountry?.costUSD !== undefined ||
    payload.secondCountry?.costUSD !== undefined
  ) {
    if (payload.savingsPercentage === undefined) {
      const c1 =
        payload.firstCountry?.costUSD ?? existingComparison.firstCountry.costUSD;
      const c2 =
        payload.secondCountry?.costUSD ??
        existingComparison.secondCountry.costUSD;
      const maxCost = Math.max(c1, c2);
      if (maxCost > 0) {
        payload.savingsPercentage = Math.round(
          (Math.abs(c1 - c2) / maxCost) * 100,
        );
      }
    }
  }

  const updatedResult = await ComparisonModel.findByIdAndUpdate(
    comparisonId,
    { $set: payload },
    { new: true, runValidators: true },
  );

  return updatedResult;
};

/*=========== Delete Comparison ============*/
const deleteComparison = async (comparisonId: string) => {
  if (!Types.ObjectId.isValid(comparisonId)) {
    throw new NotFoundError("Invalid comparison ID");
  }

  const comparison = await ComparisonModel.findById(comparisonId);
  if (!comparison) {
    throw new NotFoundError("Comparison not found with the provided ID");
  }

  const result = await ComparisonModel.findByIdAndDelete(comparisonId);
  return result;
};

/*=========== Seed Screenshot Data ============*/
const seedScreenshotComparisons = async () => {
  const sampleComparisons = [
    {
      treatmentName: "Coronary Artery Bypass Grafting (CABG)",
      category: "Cardiology",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 5000,
        costBDT: 610000,
        successRate: "98%",
        hospitalStay: "7-10 days",
        recoveryTime: "6-8 weeks",
        popularHospitals: ["Apollo Hospitals", "Fortis Hospital"],
      },
      secondCountry: {
        country: "Thailand",
        countryCode: "TH",
        costUSD: 12000,
        costBDT: 1464000,
        successRate: "97%",
        hospitalStay: "8-12 days",
        recoveryTime: "6-8 weeks",
        popularHospitals: ["Bumrungrad International Hospital"],
      },
      savingsPercentage: 58,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
    {
      treatmentName: "Total Knee Replacement (One Side)",
      category: "Orthopedics",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 4500,
        costBDT: 549000,
        successRate: "95%",
        hospitalStay: "4-6 days",
        recoveryTime: "4-6 weeks",
      },
      secondCountry: {
        country: "Turkey",
        countryCode: "TR",
        costUSD: 5000,
        costBDT: 610000,
        successRate: "94%",
        hospitalStay: "5-7 days",
        recoveryTime: "4-6 weeks",
      },
      savingsPercentage: 10,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
    {
      treatmentName: "Kidney Transplant",
      category: "Nephrology",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 11000,
        costBDT: 1342000,
        successRate: "92%",
        hospitalStay: "10-14 days",
        recoveryTime: "8-12 weeks",
      },
      secondCountry: {
        country: "Turkey",
        countryCode: "TR",
        costUSD: 16000,
        costBDT: 1952000,
        successRate: "93%",
        hospitalStay: "10-15 days",
        recoveryTime: "8-12 weeks",
      },
      savingsPercentage: 31,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
    {
      treatmentName: "IVF (In Vitro Fertilization)",
      category: "Fertility",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 3500,
        costBDT: 427000,
        successRate: "65%",
        hospitalStay: "Outpatient",
        recoveryTime: "1-2 days",
      },
      secondCountry: {
        country: "Thailand",
        countryCode: "TH",
        costUSD: 8000,
        costBDT: 976000,
        successRate: "70%",
        hospitalStay: "Outpatient",
        recoveryTime: "1-2 days",
      },
      savingsPercentage: 56,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
    {
      treatmentName: "Angioplasty",
      category: "Cardiology",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 3000,
        costBDT: 366000,
        successRate: "99%",
        hospitalStay: "1-2 days",
        recoveryTime: "1-2 weeks",
      },
      secondCountry: {
        country: "Singapore",
        countryCode: "SG",
        costUSD: 25000,
        costBDT: 3050000,
        successRate: "99%",
        hospitalStay: "2-3 days",
        recoveryTime: "1-2 weeks",
      },
      savingsPercentage: 88,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
    {
      treatmentName: "Liver Transplant",
      category: "Hepatology",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 25000,
        costBDT: 3050000,
        successRate: "90%",
        hospitalStay: "14-21 days",
        recoveryTime: "12-16 weeks",
      },
      secondCountry: {
        country: "Turkey",
        countryCode: "TR",
        costUSD: 45000,
        costBDT: 5490000,
        successRate: "89%",
        hospitalStay: "15-25 days",
        recoveryTime: "12-16 weeks",
      },
      savingsPercentage: 44,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
    {
      treatmentName: "Bone Marrow Transplant",
      category: "Oncology",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 25000,
        costBDT: 3050000,
        successRate: "85%",
        hospitalStay: "20-30 days",
        recoveryTime: "3-6 months",
      },
      secondCountry: {
        country: "Malaysia",
        countryCode: "MY",
        costUSD: 50000,
        costBDT: 6100000,
        successRate: "86%",
        hospitalStay: "25-35 days",
        recoveryTime: "3-6 months",
      },
      savingsPercentage: 50,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
    {
      treatmentName: "Chemotherapy",
      category: "Oncology",
      firstCountry: {
        country: "India",
        countryCode: "IN",
        costUSD: 600,
        costBDT: 73200,
        successRate: "Cycle dependent",
        hospitalStay: "Day care / 1 day",
        recoveryTime: "1-2 weeks per cycle",
      },
      secondCountry: {
        country: "Thailand",
        countryCode: "TH",
        costUSD: 1000,
        costBDT: 122000,
        successRate: "Cycle dependent",
        hospitalStay: "Day care / 1 day",
        recoveryTime: "1-2 weeks per cycle",
      },
      savingsPercentage: 40,
      isPopular: true,
      status: COMPARISON_STATUS.PUBLISHED,
    },
  ];

  let createdCount = 0;
  for (const item of sampleComparisons) {
    const slug = generateSlug(
      item.treatmentName,
      item.firstCountry.country,
      item.secondCountry.country,
    );
    const exists = await ComparisonModel.findOne({ slug });
    if (!exists) {
      await ComparisonModel.create({ ...item, slug });
      createdCount++;
    }
  }

  return { message: `Seeded ${createdCount} comparisons successfully` };
};

const ComparisonService = {
  createComparison,
  getComparisons,
  getComparisonById,
  compareSideBySide,
  getPopularComparisons,
  getComparisonOptions,
  getComparisonStats,
  updateComparison,
  deleteComparison,
  seedScreenshotComparisons,
};

export default ComparisonService;
