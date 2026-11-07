import express from "express";
import UserRoutes from "../modules/user/user.route";
import AuthRoutes from "../modules/auth/auth.route";
import DoctorRoutes from "../modules/doctor/doctor.route";
import HospitalRoutes from "../modules/hospital/hospital.route";
import FaqRoutes from "../modules/faq/faq.route";
import ContentRoutes from "../modules/content/content.route";
import SupportRoutes from "../modules/support/support.route";
import DashboardRoutes from "../modules/dashboard/dashboard.route";
import ComparisonRoutes from "../modules/comparison/comparison.route";
import ScheduleRoutes from "../modules/schedule/schedule.route";
import AgentRoutes from "../modules/agent/agent.route";
import AgentPatientRoutes from "../modules/agentPatient/agentPatient.route";
import ReferralPartnerRoutes from "../modules/referralPartner/referralPartner.route";
import AppointmentRoutes from "../modules/appointment/appointment.route";
import TipCategoryRoutes from "../modules/tipCategory/tipCategory.route";
import HealthTipRoutes from "../modules/healthTip/healthTip.route";
import TestReportRoutes from "../modules/testReport/testReport.route";
import ConsultationRoutes from "../modules/consultation/consultation.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/doctor",
    route: DoctorRoutes,
  },
  {
    path: "/hospital",
    route: HospitalRoutes,
  },
  {
    path: "/faq",
    route: FaqRoutes,
  },
  {
    path: "/content",
    route: ContentRoutes,
  },
  {
    path: "/support",
    route: SupportRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/comparison",
    route: ComparisonRoutes,
  },
  {
    path: "/schedule",
    route: ScheduleRoutes,
  },
  {
    path: "/agent",
    route: AgentRoutes,
  },
  {
    path: "/agent-patient",
    route: AgentPatientRoutes,
  },
  {
    path: "/referral-partner",
    route: ReferralPartnerRoutes,
  },
  {
    path: "/my-network",
    route: ReferralPartnerRoutes,
  },
  {
    path: "/appointment",
    route: AppointmentRoutes,
  },
  {
    path: "/tip-category",
    route: TipCategoryRoutes,
  },
  {
    path: "/health-tip",
    route: HealthTipRoutes,
  },
  {
    path: "/test-report",
    route: TestReportRoutes,
  },
  {
    path: "/consultation",
    route: ConsultationRoutes,
  },
];

moduleRoutes.forEach((item, i) => router.use(item.path, item.route));

export default router;
