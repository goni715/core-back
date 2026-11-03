import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import AppointmentService from "./appointment.service";

/*========== Book Appointment (Public / Any User) ==========*/
const bookAppointment = asyncHandler(async (req: Request, res: Response) => {
  const result = await AppointmentService.bookAppointment(req.body);

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully",
    data: result,
  });
});

/*========== Get My Appointments (Doctor) ==========*/
const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const validatedQuery = (req as any).validatedQuery;

  const result = await AppointmentService.getMyAppointments(
    userId as string,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "My appointments are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*========== Get All Appointments (Admin / Super Admin) ==========*/
const getAllAppointments = asyncHandler(async (req: Request, res: Response) => {
  const validatedQuery = (req as any).validatedQuery;
  const result = await AppointmentService.getAllAppointments(validatedQuery);

  res.status(200).json({
    success: true,
    message: "All appointments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*========== Get Doctor Appointments (By Doctor ID) ==========*/
const getDoctorAppointments = asyncHandler(
  async (req: Request, res: Response) => {
    const { doctorUserId } = req.params;
    const validatedQuery = (req as any).validatedQuery || req.query;

    const result = await AppointmentService.getDoctorAppointments(
      doctorUserId as string,
      validatedQuery,
    );

    res.status(200).json({
      success: true,
      message: "Doctor appointments retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);


/*========== Get Single Appointment ==========*/
const getSingleAppointment = asyncHandler(
  async (req: Request, res: Response) => {
    const { appointmentId } = req.params;
    const result = await AppointmentService.getSingleAppointment(
      appointmentId as string,
    );

    res.status(200).json({
      success: true,
      message: "Appointment retrieved successfully",
      data: result,
    });
  },
);

/*========== Update Appointment Status (Doctor / Admin) ==========*/
const updateAppointmentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { appointmentId } = req.params;
    const user = {
      userId: ((req as any).user?.userId || req.headers.userId) as string,
      role: ((req as any).user?.role || req.headers.role) as string,
    };

    const result = await AppointmentService.updateAppointmentStatus(
      appointmentId as string,
      user,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: result,
    });
  },
);

/*========== Delete Appointment (Doctor / Admin) ==========*/
const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  const user = {
    userId: ((req as any).user?.userId || req.headers.userId) as string,
    role: ((req as any).user?.role || req.headers.role) as string,
  };

  const result = await AppointmentService.deleteAppointment(
    appointmentId as string,
    user,
  );

  res.status(200).json({
    success: true,
    message: "Appointment deleted successfully",
    data: result,
  });
});

const AppointmentController = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  getSingleAppointment,
  updateAppointmentStatus,
  deleteAppointment,
};

export default AppointmentController;

