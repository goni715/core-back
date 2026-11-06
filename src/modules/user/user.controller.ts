import asyncHandler from "../../utils/asyncHandler";
import { TUserRole } from "./user.interface";
import UserService from "./user.service";


const getPatients = asyncHandler(async (req, res) => {
    const validatedQuery = (req as any).validatedQuery;
    const result = await UserService.getPatients(validatedQuery);
    res.status(200).json({
        success: true,
        message: "Patients are retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getMyProfile = asyncHandler(async (req, res) => {
    const { userId, role } = req.headers;
    const result = await UserService.getMyProfile(userId as string, role as TUserRole);
    res.status(200).json({
        success: true,
        message: "My profile is retrieved successfully",
        data: result,
    });
});

const getSubAgentProfile = asyncHandler(async (req, res) => {
    const { userId } = req.headers;
    const result = await UserService.getSubAgentProfile(userId as string);
    res.status(200).json({
        success: true,
        message: "My profile is retrieved successfully",
        data: result,
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { userId } = req.headers;
    const result = await UserService.updateProfile(userId as string, req);
    res.status(200).json({
        success: true,
        message: "Profile is updated successfully",
        data: result,
    });
})


const UserController = {
    getPatients,
    getMyProfile,
    getSubAgentProfile,
    updateProfile,
}

export default UserController