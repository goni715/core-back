import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { IUser, TPatientQuery, TUserRole } from "./user.interface";
import { USER_ROLES, USER_SEARCHABLE_FIELDS } from "./user.constant";
import { PipelineStage, Types } from "mongoose";
import UserModel from "./user.model";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import makePublicID from "../../utils/makePublicID";
import ConflictError from "../../errors/ConflictError";
import DoctorModel from "../doctor/doctor.model";
import ReferralPartnerModel from "../referralPartner/referralPartner.model";



/*============== get patients ================== */
const getPatients = async (query: TPatientQuery) => {
    const {
        searchTerm,
        page = 1,
        limit = 10,
        sortOrder = "desc",
        sortBy = "createdAt",
        ...filters // additional filters
    } = query;

    // 1. set up pagination
    const skip = (Number(page) - 1) * Number(limit);

    //2. setup sorting
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    //3. setup searching
    let searchQuery = {};
    if (searchTerm) {
        searchQuery = makeSearchQuery(searchTerm, USER_SEARCHABLE_FIELDS);
    }

    //4 setup filters
    let filterQuery = {};
    if (filters) {
        filterQuery = makeFilterQuery(filters);
    }

    //common pipeline stage
    const commonPipeline: PipelineStage = {
        $match: {
            role: USER_ROLES.PATIENT,
            ...searchQuery,
            ...filterQuery,
        },
    }

    // get patients
    const patients = await UserModel.aggregate([
        commonPipeline,
        {
            $project: {
                _id: 1,
                fullName: 1,
                email: 1,
                phone: 1,
                profileImg: 1,
                status: 1,
                blockedAt: 1,
                lastLoginAt: 1,
                createdAt: 1,
            },
        },
        { $sort: { [sortBy]: sortDirection } },
        { $skip: skip },
        { $limit: Number(limit) },
    ]);

    // total count
    const totalCountResult = await UserModel.aggregate([
        commonPipeline,
        { $count: "totalCount" },
    ]);

    const totalCount = totalCountResult[0]?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / Number(limit));

    const result = {
        meta: {
            page: Number(page),
            limit: Number(limit),
            totalPages,
            total: totalCount,
        },
        data: patients,
    };

    return result;
};

/*============== get user profile ================== */
const getMyProfile = async (userId: string, role: TUserRole) => {
    //if role is patient
    if (role === USER_ROLES.PATIENT) {
        const patient = await UserModel.findById({
            _id: userId,
            role: USER_ROLES.PATIENT,
        }).select("fullName email phone profileImg lastLoginAt createdAt");

        return patient;
    }

    //if role is doctor
    if (role === USER_ROLES.DOCTOR) {
        const doctors = await DoctorModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    userId: "$userId",
                    title: "$title",
                    fullName: "$user.fullName",
                    email: "$user.email",
                    phone: "$user.phone",
                    profileImg: "$user.profileImg",
                    specialization: "$specialization",
                    hospital: "$hospital",
                    designation: "$designation",
                    education: "$education",
                    consultationFee: "$consultationFee",
                    address: "$address",
                    bmdcNumber: "$bmdcNumber",
                    experience: "$experience",
                    about: "$about",
                    qualifications: "$qualifications",
                    rating: "$rating",
                    totalReviews: "$totalReviews",
                    isOnline: "$isOnline",
                    approvalStatus: "$approvalStatus",
                    approvedAt: "$approvedAt",
                    approvedBy: "$approvedBy",
                    rejectedAt: "$rejectedAt",
                    rejectedBy: "$rejectedBy",
                    rejectionReason: "$rejectionReason",
                    status: "$status",
                    registrationSource: "$registrationSource",
                    lastLoginAt: "$user.lastLoginAt",
                    createdAt: "$user.createdAt",
                    updatedAt: "$user.updatedAt",
                }
            }
        ])

        return doctors[0];
    }

    //if role is admin or super_admin
    const result = await UserModel.findById({
        _id: userId,
        role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
    }).select("fullName email phone profileImg lastLoginAt createdAt");

    return result;
}

/*============== get sub-agent profile ================== */
const getSubAgentProfile = async (subAgentId: string) => {
    const subAgent = await ReferralPartnerModel.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(subAgentId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "agentUserId",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                fullName: "$fullName",
                email: "$email",
                phone: "$phone",
                agentUserId:"$agentUserId",
                agentName: "$user.fullName",
                agentEmail: "$user.email",
                agentPhone: "$user.phone",
                lastLoginAt: "$user.lastLoginAt",
                createdAt: "$createdAt",
            },
        },
    ])

    return subAgent[0];
}

/*============== update profile ================== */
const updateProfile = async (userId: string, req: any) => {
    const payload: Partial<IUser> = req.body;

    let image;
    try {
        //my-profile
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error("Profile not found");
        }

        // if image is available
        if (req.file) {
            //upload image
            image = await uploadToCloudinary(req?.file?.path as string, "user");
            payload.profileImg = image.img_url;
        }

        // check if phone is already taken by another user
        if (payload.phone) {
            const existingPhone = await UserModel.findOne({
                phone: payload.phone,
                _id: { $ne: userId },
            });
            if (existingPhone) {
                throw new ConflictError(
                    "An account with this phone number already exists.",
                );
            }
        }

        //update profile
        const result = await UserModel.updateOne(
            { _id: userId },
            payload,
        );

        //delete existing image
        if (req.file && user?.profileImg) {
            const public_id = makePublicID(user?.profileImg, "user");
            await deleteFromCloudinary(public_id);
        }

        return result;
    }
    catch (error) {
        // rollback cloudinary upload
        if (image?.public_id) {
            await deleteFromCloudinary(image.public_id);
        }
        throw error;
    }
}

const UserService = {
    getPatients,
    getMyProfile,
    getSubAgentProfile,
    updateProfile,
}

export default UserService