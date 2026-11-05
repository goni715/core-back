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

/*========== Book Appointment by login patient ==========*/
const bookAppointmentByLoginPatient = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.headers;
  const result = await AppointmentService.bookAppointmentByLoginPatient(userId as string, req.body);

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

/*========== Get Patient Own Appointments (Patient) ==========*/
const getPatientOwnAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.headers;
  const validatedQuery = (req as any).validatedQuery;

  const result = await AppointmentService.getPatientOwnAppointments(
    email as string,
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


/*========== get appointmentStats (Admin) ==========*/
const getAppointmentStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await AppointmentService.getAppointmentStats();

  res.status(200).json({
    success: true,
    message: "Appointment stats retrieved successfully",
    data: result,
  });
});

const AppointmentController = {
  bookAppointment,
  bookAppointmentByLoginPatient,
  getMyAppointments,
  getPatientOwnAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentStats
};

export default AppointmentController;

