import AppointmentModel from "../appointment/appointment.model";
import HospitalModel from "../hospital/hospital.model";
import { USER_ROLES } from "../user/user.constant"
import UserModel from "../user/user.model"


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
        totalAppointments
    }
}


const getDoctorStats = async (doctorId: string) => {
    return {}
}



const DashboardService = {
    getStats,
    getDoctorStats
}

export default DashboardService