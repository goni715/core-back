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
];

moduleRoutes.forEach((item, i) => router.use(item.path, item.route));

export default router;
