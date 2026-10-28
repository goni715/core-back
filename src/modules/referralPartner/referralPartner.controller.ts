import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import ReferralPartnerService from "./referralPartner.service";

/* ==================== Get Network Overview Stats ==================== */
const getNetworkStats = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;

  const result = await ReferralPartnerService.getNetworkStats(userId as string);

  res.status(200).json({
    success: true,
    message: "Network overview statistics retrieved successfully",
    overviewStats: result.overviewStats,
    statusCounts: result.statusCounts,
    data: result,
  });
});

/* ==================== Get Referral Partners List ==================== */
const getReferralPartners = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.headers;
    const validatedQuery = (req as any).validatedQuery || req.query;

    const result = await ReferralPartnerService.getReferralPartners(
      userId as string,
      validatedQuery,
    );

    res.status(200).json({
      success: true,
      message: "Referral partners retrieved successfully",
      meta: result.meta,
      statusCounts: result.statusCounts,
      overviewStats: result.overviewStats,
      data: result.data,
    });
  },
);

/* ==================== Get Single Partner ==================== */
const getSinglePartner = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { partnerId } = req.params;

  const result = await ReferralPartnerService.getSinglePartner(
    userId as string,
    partnerId as string,
  );

  res.status(200).json({
    success: true,
    message: "Referral partner details retrieved successfully",
    data: result,
  });
});

/* ==================== Invite Referral Partner ==================== */
const invitePartner = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;

  const result = await ReferralPartnerService.invitePartner(
    userId as string,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Referral partner invited successfully",
    data: result,
  });
});

/* ==================== Get Channel Partner Invitation Link ==================== */
const getInvitationLink = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;

  const result = await ReferralPartnerService.getInvitationLink(
    userId as string,
  );

  res.status(200).json({
    success: true,
    message: "Channel Partner invitation link retrieved successfully",
    data: result,
  });
});

/* ==================== Update Referral Partner ==================== */
const updatePartner = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { partnerId } = req.params;

  const result = await ReferralPartnerService.updatePartner(
    userId as string,
    partnerId as string,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Referral partner updated successfully",
    data: result,
  });
});

/* ==================== Change Partner Status ==================== */
const changePartnerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.headers;
    const { partnerId } = req.params;

    const result = await ReferralPartnerService.changePartnerStatus(
      userId as string,
      partnerId as string,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: `Referral partner status updated to ${result.status} successfully`,
      data: result,
    });
  },
);

/* ==================== Delete Referral Partner ==================== */
const deletePartner = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const { partnerId } = req.params;

  const result = await ReferralPartnerService.deletePartner(
    userId as string,
    partnerId as string,
  );

  res.status(200).json({
    success: true,
    message: "Referral partner deleted successfully",
    data: result,
  });
});

/* ==================== Seed Initial Sample Network ==================== */
const seedSamplePartners = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.headers;

    const result = await ReferralPartnerService.seedSamplePartners(
      userId as string,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },
);

const ReferralPartnerController = {
  getNetworkStats,
  getReferralPartners,
  getSinglePartner,
  invitePartner,
  getInvitationLink,
  updatePartner,
  changePartnerStatus,
  deletePartner,
  seedSamplePartners,
};

export default ReferralPartnerController;
