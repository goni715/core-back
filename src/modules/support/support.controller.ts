import asyncHandler from "../../utils/asyncHandler";
import SupportService from "./support.service";

const submitSupportRequest = asyncHandler(async (req, res) => {
    const result = await SupportService.submitSupportRequest(req.body);
    res.status(200).json({
        success: true,
        message: "Your support message has been submitted successfully.",
        data: result
    })
})

const getSupports = asyncHandler(async (req, res) => {
    const validatedQuery = (req as any).validatedQuery;
    const result = await SupportService.getSupports(validatedQuery);
    res.status(200).json({
        success: true,
        message: "Supports are retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getMySupports = asyncHandler(async (req, res) => {
    const { email } = req.headers;
    const validatedQuery = (req as any).validatedQuery;
    const result = await SupportService.getMySupports(email as string, validatedQuery);
    res.status(200).json({
        success: true,
        message: "Supports are retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});


const updateStatus = asyncHandler(async (req, res) => {
    const { supportId } = req.params;
    const { status } = req.body;
    const result = await SupportService.updateStatus(supportId as string, status);
    res.status(200).json({
        success: true,
        message: "Support status is updated successfully.",
        data: result
    })
})


const SupportController = {
    submitSupportRequest,
    getSupports,
    getMySupports,
    updateStatus
}
export default SupportController;