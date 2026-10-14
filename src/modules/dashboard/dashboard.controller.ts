import asyncHandler from "../../utils/asyncHandler";
import DashboardService from "./dashboard.service";

const getStats = asyncHandler(async (req, res) => {
    const result = await DashboardService.getStats();

    res.status(200).json({
        success: true,
        message: 'Stats are retrieved successfully',
        data: result,
    });
});

const getDoctorStats = asyncHandler(async (req, res) => {
    const { userId } = req.headers;
    const result = await DashboardService.getDoctorStats(userId as string);

    res.status(200).json({
        success: true,
        message: 'Doctor stats are retrieved successfully',
        data: result,
    });
});


const DashboardController = {
    getStats,
    getDoctorStats
}

export default DashboardController