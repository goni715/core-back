import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { IUser, TUserQuery } from "./user.interface";
import { USER_ROLES, USER_SEARCHABLE_FIELDS } from "./user.constant";
import { PipelineStage } from "mongoose";
import UserModel from "./user.model";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import makePublicID from "../../utils/makePublicID";
import ConflictError from "../../errors/ConflictError";



/*============== get patients ================== */
const getPatients = async (query: TUserQuery) => {
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
const getMyProfile = async (userId: string) => {
    const user = await UserModel.findById(userId).select("fullName email phone profileImg status blockedAt lastLoginAt createdAt");
    return user;
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
    updateProfile,
}

export default UserService