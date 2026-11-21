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

const getSubAgentStats = asyncHandler(async (req, res) => {
    const subAgentId =
        (req.query.subAgentId as string) ||
        ((req.user?.userId || req.headers.userId) as string);
    const result = await DashboardService.getSubAgentStats(subAgentId);

    res.status(200).json({
        success: true,
        message: 'Sub-agent stats retrieved successfully',
        data: result,
    });
});

const getAgentStats = asyncHandler(async (req, res) => {
    const agentUserId =
        (req.query.agentUserId as string) ||
        ((req.user?.userId || req.headers.userId) as string);
    const result = await DashboardService.getAgentStats(agentUserId);

    res.status(200).json({
        success: true,
        message: 'Agent stats retrieved successfully',
        data: result,
    });
});

const getAgentMonthlyReferrals = asyncHandler(async (req, res) => {
    const agentUserId =
        (req.query.agentUserId as string) ||
        ((req.user?.userId || req.headers.userId) as string);
    const year = req.query.year as string;
    const result = await DashboardService.getAgentMonthlyReferrals(
        agentUserId,
        year,
    );

    res.status(200).json({
        success: true,
        message: 'Agent monthly referrals retrieved successfully',
        data: result,
    });
});

const DashboardController = {
    getStats,
    getDoctorStats,
    getSubAgentStats,
    getAgentStats,
    getAgentMonthlyReferrals,
};

export default DashboardController