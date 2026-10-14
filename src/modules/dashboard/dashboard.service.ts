import { USER_ROLES } from "../user/user.constant"
import UserModel from "../user/user.model"


const getStats = async () => {
    //total patients
    const totalPatients = await UserModel.countDocuments({
        role: USER_ROLES.PATIENT,
    });

    return {
        totalPatients,
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