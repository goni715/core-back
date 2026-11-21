import { Types } from "mongoose";
import AppointmentModel from "../appointment/appointment.model";
import HospitalModel from "../hospital/hospital.model";
import { USER_ROLES } from "../user/user.constant";
import UserModel from "../user/user.model";
import AgentPatientModel from "../agentPatient/agentPatient.model";
import {
    COMMISSION_PAYMENT_STATUS,
    PATIENT_CASE_STATUS,
} from "../agentPatient/agentPatient.constant";
import ReferralPartnerModel from "../referralPartner/referralPartner.model";
import isObjectId from "../../utils/isObjectId";

const getStats = async () => {
    //total patients
    const totalPatients = await UserModel.countDocuments({
        role: USER_ROLES.PATIENT,
    });

    //total doctors
    const totalDoctors = await UserModel.countDocuments({
        role: USER_ROLES.DOCTOR,
    });

    //total hospitals
    const totalHospitals = await HospitalModel.countDocuments();

    //total appointments
    const totalAppointments = await AppointmentModel.countDocuments();

    return {
        totalPatients,
        totalDoctors,
        totalHospitals,
        totalAppointments,
    };
};

const getDoctorStats = async (doctorId: string) => {
    return {};
};

/* ==================== Sub-Agent Dashboard Stats ==================== */
const getSubAgentStats = async (subAgentIdentifier: string) => {
    let partnerObjectId: Types.ObjectId | null = null;
    let partnerDoc: any = null;

    if (subAgentIdentifier && isObjectId(subAgentIdentifier)) {
        partnerObjectId = new Types.ObjectId(subAgentIdentifier);
        partnerDoc = await ReferralPartnerModel.findById(partnerObjectId).lean();
    }

    if (!partnerDoc && subAgentIdentifier) {
        partnerDoc = await ReferralPartnerModel.findOne({
            $or: [
                { refCode: String(subAgentIdentifier).trim().toUpperCase() },
                { email: String(subAgentIdentifier).trim().toLowerCase() },
            ],
        }).lean();

        if (partnerDoc) {
            partnerObjectId = partnerDoc._id as Types.ObjectId;
        }
    }

    // Default structure with 0 for all stats
    const defaultStats = {
        myTotalCases: 0,
        ongoingTreatment: 0,
        completedCases: 0,
        myReferralEarnings: 0,
        totalCases: 0,
        ongoingCases: 0,
        totalEarnings: 0,
        currency: "TK",
        subAgent: partnerDoc
            ? {
                  _id: partnerDoc._id,
                  fullName: partnerDoc.fullName,
                  agencyName: partnerDoc.agencyName,
                  refCode: partnerDoc.refCode,
                  email: partnerDoc.email,
                  phone: partnerDoc.phone,
                  status: partnerDoc.status,
              }
            : null,
        breakdown: {
            all: 0,
            submitted: 0,
            underReview: 0,
            confirmed: 0,
            ongoing: 0,
            completed: 0,
            cancelled: 0,
            paidEarnings: 0,
            pendingEarnings: 0,
        },
    };

    if (!partnerObjectId) {
        return defaultStats;
    }

    // Aggregate stats from AgentPatientModel for this sub-agent
    const statsAggregation = await AgentPatientModel.aggregate([
        {
            $match: {
                subAgentId: partnerObjectId,
            },
        },
        {
            $group: {
                _id: null,
                totalCases: { $sum: 1 },
                submitted: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", PATIENT_CASE_STATUS.SUBMITTED] },
                            1,
                            0,
                        ],
                    },
                },
                underReview: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", PATIENT_CASE_STATUS.UNDER_REVIEW] },
                            1,
                            0,
                        ],
                    },
                },
                confirmed: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", PATIENT_CASE_STATUS.CONFIRMED] },
                            1,
                            0,
                        ],
                    },
                },
                ongoing: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", PATIENT_CASE_STATUS.ONGOING] },
                            1,
                            0,
                        ],
                    },
                },
                completed: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", PATIENT_CASE_STATUS.COMPLETED] },
                            1,
                            0,
                        ],
                    },
                },
                cancelled: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", PATIENT_CASE_STATUS.CANCELLED] },
                            1,
                            0,
                        ],
                    },
                },
                totalCommission: {
                    $sum: { $ifNull: ["$subAgentCommission", 0] },
                },
                paidCommission: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$subAgentPaymentStatus",
                                    COMMISSION_PAYMENT_STATUS.PAID,
                                ],
                            },
                            { $ifNull: ["$subAgentCommission", 0] },
                            0,
                        ],
                    },
                },
                pendingCommission: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$subAgentPaymentStatus",
                                    COMMISSION_PAYMENT_STATUS.PENDING,
                                ],
                            },
                            { $ifNull: ["$subAgentCommission", 0] },
                            0,
                        ],
                    },
                },
            },
        },
    ]);

    const agg = statsAggregation[0] || {};

    const totalCases =
        agg.totalCases !== undefined
            ? agg.totalCases
            : partnerDoc?.cases || 0;
    const ongoingCases =
        agg.ongoing !== undefined
            ? agg.ongoing
            : partnerDoc?.ongoing || 0;
    const completedCases =
        agg.completed !== undefined
            ? agg.completed
            : partnerDoc?.done || 0;

    const referralEarnings =
        agg.totalCommission !== undefined && agg.totalCommission > 0
            ? agg.totalCommission
            : partnerDoc?.earnings || 0;

    return {
        myTotalCases: totalCases,
        ongoingTreatment: ongoingCases,
        completedCases: completedCases,
        myReferralEarnings: referralEarnings,
        currency: "TK",
        breakdown: {
            all: totalCases,
            submitted: agg.submitted || 0,
            underReview: agg.underReview || 0,
            confirmed: agg.confirmed || 0,
            ongoing: ongoingCases,
            completed: completedCases,
            cancelled: agg.cancelled || 0,
            paidEarnings: agg.paidCommission || 0,
            pendingEarnings: agg.pendingCommission || 0,
        },
    };
};

/* ==================== Agent Dashboard Overview Stats ==================== */
const getAgentStats = async (agentUserId: string) => {
    let agentObjectId: Types.ObjectId | null = null;

    if (agentUserId && isObjectId(agentUserId)) {
        agentObjectId = new Types.ObjectId(agentUserId);
    } else if (agentUserId) {
        const agentUser = await UserModel.findOne({
            email: String(agentUserId).trim().toLowerCase(),
        }).lean();
        if (agentUser) {
            agentObjectId = agentUser._id as Types.ObjectId;
        }
    }

    const defaultStats = {
        totalPatients: 0,
        referralPartners: 0,
        ongoingCases: 0,
        completed: 0,
        completedCases: 0,
        networkEarnings: 0,
        totalEarnings: 0,
        currency: "TK",
        breakdown: {
            agentCommission: 0,
            subAgentCommission: 0,
            paidAgentCommission: 0,
        },
    };

    if (!agentObjectId) {
        return defaultStats;
    }

    // 1. Total patients under this agent
    const totalPatientsPromise = AgentPatientModel.countDocuments({
        agentUserId: agentObjectId,
    });

    // 2. Total referral partners under this agent
    const referralPartnersPromise = ReferralPartnerModel.countDocuments({
        agentUserId: agentObjectId,
    });

    // 3. Ongoing cases
    const ongoingCasesPromise = AgentPatientModel.countDocuments({
        agentUserId: agentObjectId,
        status: PATIENT_CASE_STATUS.ONGOING,
    });

    // 4. Completed cases
    const completedCasesPromise = AgentPatientModel.countDocuments({
        agentUserId: agentObjectId,
        status: PATIENT_CASE_STATUS.COMPLETED,
    });

    // 5. Network earnings from AgentPatientModel & ReferralPartnerModel
    const earningsAggregationPromise = AgentPatientModel.aggregate([
        {
            $match: {
                agentUserId: agentObjectId,
            },
        },
        {
            $group: {
                _id: null,
                totalAgentCommission: {
                    $sum: { $ifNull: ["$agentCommissionFee", 0] },
                },
                totalSubAgentCommission: {
                    $sum: {
                        $ifNull: [
                            "$subAgentCommissionFee",
                            { $ifNull: ["$subAgentCommission", 0] },
                        ],
                    },
                },
                paidAgentCommission: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$agentPaymentStatus",
                                    COMMISSION_PAYMENT_STATUS.PAID,
                                ],
                            },
                            { $ifNull: ["$agentCommissionFee", 0] },
                            0,
                        ],
                    },
                },
            },
        },
    ]);

    const partnerTotalsPromise = ReferralPartnerModel.aggregate([
        { $match: { agentUserId: agentObjectId } },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: { $ifNull: ["$earnings", 0] } },
            },
        },
    ]);

    const [
        totalPatients,
        referralPartners,
        ongoingCases,
        completedCases,
        earningsAggregation,
        partnerTotals,
    ] = await Promise.all([
        totalPatientsPromise,
        referralPartnersPromise,
        ongoingCasesPromise,
        completedCasesPromise,
        earningsAggregationPromise,
        partnerTotalsPromise,
    ]);

    const agg = earningsAggregation[0] || {};
    const totalAgentComm = agg.totalAgentCommission || 0;
    const totalSubAgentComm = agg.totalSubAgentCommission || 0;
    const partnerEarnings = partnerTotals[0]?.totalEarnings || 0;

    // Network earnings is combined commission across the network
    const networkEarnings =
        totalAgentComm + totalSubAgentComm > 0
            ? totalAgentComm + totalSubAgentComm
            : partnerEarnings;

    return {
        totalPatients,
        referralPartners,
        ongoingCases,
        completed: completedCases,
        completedCases,
        networkEarnings,
        totalEarnings: networkEarnings,
        currency: "TK",
        breakdown: {
            agentCommission: totalAgentComm,
            subAgentCommission: totalSubAgentComm,
            paidAgentCommission: agg.paidAgentCommission || 0,
        },
    };
};

/* ==================== Agent Monthly Referrals (12 Months Chart) ==================== */
const getAgentMonthlyReferrals = async (
    agentUserId: string,
    yearQuery?: string | number,
) => {
    let agentObjectId: Types.ObjectId | null = null;

    if (agentUserId && isObjectId(agentUserId)) {
        agentObjectId = new Types.ObjectId(agentUserId);
    } else if (agentUserId) {
        const agentUser = await UserModel.findOne({
            email: String(agentUserId).trim().toLowerCase(),
        }).lean();
        if (agentUser) {
            agentObjectId = agentUser._id as Types.ObjectId;
        }
    }

    const targetYear = yearQuery ? Number(yearQuery) : new Date().getFullYear();
    const startOfYear = new Date(`${targetYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);

    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    if (!agentObjectId) {
        const emptyMonthlyData = monthNames.map((name, index) => ({
            month: name,
            monthNumber: index + 1,
            referrals: 0,
            cases: 0,
            count: 0,
        }));

        return {
            year: targetYear,
            totalReferrals: 0,
            totalCases: 0,
            averageCasesPerMonth: 0,
            averageCasesPerMonthFormatted: "Average: 0 cases / month",
            monthlyData: emptyMonthlyData,
        };
    }

    const monthlyAggregation = await AgentPatientModel.aggregate([
        {
            $addFields: {
                submissionDate: {
                    $ifNull: ["$timeline.submittedAt", "$createdAt"],
                },
            },
        },
        {
            $match: {
                agentUserId: agentObjectId,
                submissionDate: { $gte: startOfYear, $lte: endOfYear },
            },
        },
        {
            $group: {
                _id: { $month: "$submissionDate" },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    const monthlyMap: Record<number, number> = {};
    let totalReferrals = 0;

    monthlyAggregation.forEach((item) => {
        monthlyMap[item._id] = item.count;
        totalReferrals += item.count;
    });

    const monthlyData = monthNames.map((name, index) => {
        const monthNumber = index + 1;
        const count = monthlyMap[monthNumber] || 0;
        return {
            month: name,
            monthNumber,
            referrals: count,
            cases: count,
            count,
        };
    });

    const averageCasesPerMonth = Number((totalReferrals / 12).toFixed(1));
    const averageRounded = Math.round(totalReferrals / 12);

    return {
        year: targetYear,
        totalReferrals,
        totalCases: totalReferrals,
        averageCasesPerMonth,
        averageCasesPerMonthFormatted: `Average: ${averageRounded} cases / month`,
        monthlyData,
    };
};

const DashboardService = {
    getStats,
    getDoctorStats,
    getSubAgentStats,
    getAgentStats,
    getAgentMonthlyReferrals,
};

export default DashboardService;