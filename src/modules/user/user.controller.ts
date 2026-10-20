import asyncHandler from "../../utils/asyncHandler";
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
    const { userId } = req.headers;
    const result = await UserService.getMyProfile(userId as string);
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
    updateProfile,
}

export default UserController