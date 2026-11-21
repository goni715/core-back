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
        totalCases,
        ongoingCases,
        totalEarnings: referralEarnings,
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

const DashboardService = {
    getStats,
    getDoctorStats,
    getSubAgentStats,
};

export default DashboardService;