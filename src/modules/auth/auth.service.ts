import { Secret } from "jsonwebtoken";
import ConflictError from "../../errors/ConflictError";
import ForbiddenError from "../../errors/ForbiddenError";
import NotFoundError from "../../errors/NotFoundError";
import UnprocessableError from "../../errors/UnprocessableError";
import sendVerificationEmail from "../../utils/email/sendVerificationEmail";
import generateOTP from "../../utils/generateOTP";
import UserModel from "../user/user.model";
import {
  IChangePassword,
  ILogin,
  INewPassword,
  IVerifyOTp,
} from "./auth.interface";
import config from "../../config";
import GoneError from "../../errors/GoneError";
import makeHash from "../../utils/makeHash";
import UnauthorizedError from "../../errors/UnauthorizedError";
import { isJWTIssuedBeforePassChanged } from "../../utils/isJWTIssuedBeforePassChanged";
import sendForgotEmail from "../../utils/email/sendForgotEmail";
import isObjectId from "../../utils/isObjectId";
import BadRequestError from "../../errors/BadRequestError";
import SessionModel from "../session/session.model";
import OtpModel from "../otp/otp.model";
import mongoose from "mongoose";
import { Types } from "mongoose";
import { OTP_TYPE } from "../otp/otp.constant";
import { ACCOUNT_STATUS, USER_ROLES } from "../user/user.constant";
import {
  createToken,
  TJwtExpiresIn,
  verifyToken,
} from "../../helpers/JwtHelper";
import { checkPassword, hashedPassword } from "../../helpers/PasswordHelper";
import { IUser, TAccountStatus } from "../user/user.interface";
import { generateResetToken } from "../../utils/generateResetToken";
import decrypt from "../../utils/decrypt";
import DoctorModel from "../doctor/doctor.model";
import { DOCTOR_APPROVAL_STATUS, DOCTOR_REGISTRATION_SOURCE, DOCTOR_STATUS, DOCTOR_TITLE } from "../doctor/doctor.constant";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";

/*============ register patient  ============*/
const registerPatientDraft = async (payload: IUser) => {
  const { email } = payload;

  //check email
  const user = await UserModel.findOne({ email });

  if (user) {
    //User already exists and but blocked
    if (user.status === ACCOUNT_STATUS.BLOCKED) {
      throw new ForbiddenError("Your account is blocked.");
    }

    //user already active
    if (user.status === ACCOUNT_STATUS.ACTIVE) {
      throw new ConflictError("An account with this email already exists.");
    }

    //User not verified → resend verification
    const otp = generateOTP();

    //update otp
    await OtpModel.updateOne(
      { email, userId: user._id },
      { otp, expiresAt: new Date(+new Date() + 600000) },
      { upsert: true, runValidators: true },
    );

    //send verification email
    await sendVerificationEmail(email, otp.toString());

    return {
      message: "Verification email resent. Please check your inbox.",
    };
  }

  //generate otp
  const otp = generateOTP();

  //transaction & rollback
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    //create new user
    const newUser = await UserModel.create([{ ...payload, role: USER_ROLES.PATIENT }], { session });

    //create otp
    await OtpModel.create(
      [
        {
          userId: newUser[0]?._id as mongoose.Types.ObjectId,
          email,
          otp,
        },
      ],
      { session },
    );

    //transaction success
    await session.commitTransaction();

    //send verification email
    await sendVerificationEmail(email, otp.toString());

    return {
      message: "Please check your email to verify",
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};

/*============ register patient (Without OTP) ============*/
const registerPatient = async (payload: IUser) => {
  const { email, password, fullName, phone } = payload;

  // 1. Check if user with this email already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    if (existingUser.status === ACCOUNT_STATUS.BLOCKED) {
      throw new ForbiddenError("Your account is blocked.");
    }
    throw new ConflictError("An account with this email already exists.");
  }

  // 2. Create new patient directly active & email verified
  const newUser = await UserModel.create({
    fullName,
    email,
    phone,
    password,
    role: USER_ROLES.PATIENT,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    status: ACCOUNT_STATUS.ACTIVE,
  });

  return {
    message: "Patient registered successfully.",
    data: {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      isEmailVerified: newUser.isEmailVerified,
      createdAt: newUser.createdAt,
    },
  };
};

/*=========== register doctor (Self-registration) ============*/
const registerDoctor = async (req: any) => {
  const payload = req.body || req;
  let uploadedImage: { img_url: string; public_id: string } | null = null;

  try {
    // 1. Handle profile image from file upload or payload if present
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.path, "doctor");
      payload.profileImg = uploadedImage.img_url;
    }

    const {
      title = DOCTOR_TITLE.DR,
      fullName,
      email,
      phone,
      specialization,
      city,
      bmdcNumber,
      password,
      profileImg = "",
      hospital = "",
      country = "Bangladesh",
    } = payload;

    // 2. Check if user with this email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      if (existingUser.status === ACCOUNT_STATUS.BLOCKED) {
        throw new ForbiddenError("Your account is blocked.");
      }
      if (existingUser.status === ACCOUNT_STATUS.ACTIVE) {
        throw new ConflictError("An account with this email already exists.");
      }
      
      throw new ConflictError(
        "A registration request with this email is already submitted and pending admin approval.",
      );
    }

    // 3. Check if doctor with this BMDC number already exists
    const existingDoctor = await DoctorModel.findOne({ bmdcNumber });
    if (existingDoctor) {
      throw new ConflictError(
        "A doctor with this BMDC Number already exists.",
      );
    }

    // 4. Transaction to create User and Doctor profile
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Create User account (status: pending, role: doctor)
      const newUser = await UserModel.create(
        [
          {
            fullName,
            email,
            phone,
            profileImg,
            password,
            role: USER_ROLES.DOCTOR,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            status: ACCOUNT_STATUS.PENDING,
          },
        ],
        { session },
      );

      const createdUser = newUser[0];
      if (!createdUser) {
        throw new BadRequestError("Failed to create user account");
      }

      // Create Doctor profile (approvalStatus: pending, status: draft)
      const newDoctor = await DoctorModel.create(
        [
          {
            userId: createdUser._id,
            title,
            specialization,
            city,
            bmdcNumber,
            ...(hospital && { hospital }),
            ...(country && { country }),
            approvalStatus: DOCTOR_APPROVAL_STATUS.PENDING,
            status: DOCTOR_STATUS.DRAFT,
            registrationSource: DOCTOR_REGISTRATION_SOURCE.SELF,
          },
        ],
        { session },
      );

      const createdDoctor = newDoctor[0];
      if (!createdDoctor) {
        throw new BadRequestError("Failed to create doctor profile");
      }

      await session.commitTransaction();

      return {
        _id: createdDoctor._id,
        userId: createdUser._id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        phone: createdUser.phone,
        profileImg: createdUser.profileImg,
        role: createdUser.role,
        title: createdDoctor.title,
        specialization: createdDoctor.specialization,
        city: createdDoctor.city,
        bmdcNumber: createdDoctor.bmdcNumber,
        approvalStatus: createdDoctor.approvalStatus,
        status: createdDoctor.status,
        registrationSource: createdDoctor.registrationSource,
        createdAt: createdDoctor.createdAt,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    // Rollback uploaded image in case of error
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }
    throw error;
  }
};

/*============ verify account  ============*/
const verifyAccount = async (payload: IVerifyOTp) => {
  const { email, otp } = payload;

  const user = await UserModel.findOne({ email: payload.email });

  if (!user) {
    throw new NotFoundError("No account found for this email address.");
  }

  //user is alreay verified
  if (user.isEmailVerified) {
    throw new ConflictError("An account with this email address is already verified.");
  }

  //check otp
  const otpRecord = await OtpModel.findOne({
    userId: user._id,
    email,
    otp,
    type: OTP_TYPE.REGISTER,
  });

  if (!otpRecord) {
    throw new UnprocessableError("Invalid verification code.");
  }

  //check otp expired
  if (otpRecord.expiresAt < new Date()) {
    throw new GoneError("Expired verification code.");
  }

  //transaction & rollback
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    //update the user
    await UserModel.updateOne(
      { _id: user._id, email: user.email },
      { isEmailVerified: true, emailVerifiedAt: new Date(), status: ACCOUNT_STATUS.ACTIVE },
      { session },
    );

    //delete otp
    await OtpModel.deleteOne(
      { userId: user._id, email: user.email },
      { session },
    );

    //transaction success
    await session.commitTransaction();
    return null;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};

/*============ resend verification email  ============*/
const resendVerificationEmail = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new NotFoundError(`No account found for this email address.`);
  }

  //check if user is already verified
  if (user.isEmailVerified) {
    throw new ConflictError(
      "An account with this email address is already verified.",
    );
  }

  const otpRecord = await OtpModel.findOne({
    userId: user._id,
    email,
    type: OTP_TYPE.REGISTER,
  });

  // enforce a 1-minute cooldown between OTP resends
  if (otpRecord) {
    const now = Date.now();
    const updated = new Date(otpRecord.updatedAt).getTime();
    const oneMinutes = 1 * 60 * 1000;
    if (now - updated < oneMinutes) {
      throw new ConflictError("OTP can only be resent after 1 minute");
    }
  }

  const otp = generateOTP();

  //update otp
  await OtpModel.updateOne(
    { userId: user._id, email, type: OTP_TYPE.REGISTER },
    {
      otp,
      expiresAt: new Date(+new Date() + 600000),
    },
    { upsert: true, runValidators: true },
  );

  //send verification email
  await sendVerificationEmail(email, otp.toString());

  return {
    resendAvailableAt: new Date(Date.now() + 2 * 60 * 1000), //resend after two minutes
  };
};

/*============ login user  ============*/
const loginUser = async (payload: ILogin, ip: string) => {
  const { email, password, isRememberMe } = payload;
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    throw new NotFoundError(`No account found for this email address.`);
  }

  //check password
  const isPasswordMatch = await checkPassword(password, user.password);
  if (!isPasswordMatch) {
    throw new UnprocessableError("The password you've entered is incorrect.");
  }

  //check email is not verified
  if (!user.isEmailVerified) {
    throw new ForbiddenError("Please verify your account.");
  }

  //check user is blocked
  if (user.status === ACCOUNT_STATUS.BLOCKED) {
    throw new ForbiddenError("Your account is blocked.");
  }

  //check you are not patient or doctor
  if (!["patient", "doctor"].includes(user.role)) {
    throw new ForbiddenError(`Sorry! You have no access to login.`);
  }

  // If user is a doctor, verify approval status
  if (user.role === USER_ROLES.DOCTOR) {
    const doctorProfile = await DoctorModel.findOne({ userId: user._id });
    if (doctorProfile) {
      if (doctorProfile.approvalStatus === DOCTOR_APPROVAL_STATUS.PENDING) {
        throw new ForbiddenError(
          "Your registration is pending admin approval. You will be able to log in once approved.",
        );
      }
      if (doctorProfile.approvalStatus === DOCTOR_APPROVAL_STATUS.REJECTED) {
        const reason = doctorProfile.rejectionReason
          ? ` Reason: ${doctorProfile.rejectionReason}`
          : "";
        throw new ForbiddenError(
          `Your registration was rejected by administrator.${reason}`,
        );
      }
    }
  }

  //transaction & rollback
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    //create refreshToken
    const refreshToken = createToken(
      {
        userId: String(user._id),
        email: user.email,
        tokenVersion: user.tokenVersion,
      },
      config.jwt.jwt_refresh_secret as Secret,
      isRememberMe
        ? (config.jwt.jwt_refresh_expires_in_remember as TJwtExpiresIn)
        : (config.jwt.jwt_refresh_expires_in as TJwtExpiresIn),
    );

    // check active sessions
    const activeSessions = await SessionModel.countDocuments({
      userId: user._id,
      revoked: false,
    }).session(session);

    // delete all sessions if sessions exceed 5 devices
    if (activeSessions >= Number(config.max_sessions)) {
      await SessionModel.deleteMany(
        {
          userId: user._id,
        },
        { session },
      );
    }

    //refreshToken exipresAt
    const expiresInMs = isRememberMe
      ? Number(config.refreshToken.refresh_token_cookie_max_age_remember)
      : Number(config.refreshToken.refresh_token_cookie_max_age);

    const expireDate = new Date(Date.now() + expiresInMs);

    //set refreshTokenHash or create new session
    const refreshTokenHash = makeHash(refreshToken);
    const newSession = await SessionModel.create(
      [
        {
          userId: user._id,
          refreshTokenHash,
          ip,
          expiresAt: expireDate
        },
      ],
      { session },
    );


    //update the lastLoginAt
    await UserModel.updateOne(
      { _id: user._id },
      { lastLoginAt: new Date() },
      { session },
    );

    // transaction success
    await session.commitTransaction();
    await session.endSession();

    //create accessToken
    const accessToken = createToken(
      {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        sessionId: newSession[0]?._id!?.toString(),
      },
      config.jwt.jwt_access_secret as Secret,
      config.jwt.jwt_access_expires_in as TJwtExpiresIn,
    );

    return {
      accessToken,
      refreshToken,
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      profileImg: user.profileImg,
      role: user.role
    };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

/*============ login admin  ============*/
const loginAdmin = async (payload: ILogin, ip: string) => {
  const { email, password, isRememberMe } = payload;
  const user = await UserModel.findOne({
    email,
  }).select("+password");
  if (!user) {
    throw new NotFoundError(`No account found for this email address.`);
  }

  //check password
  const isPasswordMatch = await checkPassword(password, user.password);
  if (!isPasswordMatch) {
    throw new UnprocessableError("The password you've entered is incorrect.");
  }

  //check email is not verified
  if (!user.isEmailVerified) {
    throw new ForbiddenError("Please verify your account.");
  }

  //check user is blocked
  if (user.status === ACCOUNT_STATUS.BLOCKED) {
    throw new ForbiddenError("Your account is blocked.");
  }

  //check you are not super_admin or admin
  if (!["admin", "super_admin"].includes(user.role)) {
    throw new ForbiddenError(`Sorry! You have no access to login.`);
  }

  //transaction & rollback
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    //create refreshToken
    const refreshToken = createToken(
      {
        userId: String(user._id),
        email: user.email,
        tokenVersion: user.tokenVersion,
      },
      config.jwt.jwt_refresh_secret as Secret,
      isRememberMe
        ? (config.jwt.jwt_refresh_expires_in_remember as TJwtExpiresIn)
        : (config.jwt.jwt_refresh_expires_in as TJwtExpiresIn),
    );

    // check active sessions
    const activeSessions = await SessionModel.countDocuments({
      userId: user._id,
      revoked: false,
    }).session(session);

    // delete all sessions if sessions exceed 5 devices
    if (activeSessions >= Number(config.max_sessions)) {
      await SessionModel.deleteMany(
        {
          userId: user._id,
        },
        { session },
      );
    }


    //refreshToken exipresAt
    const expiresInMs = isRememberMe
      ? Number(config.refreshToken.refresh_token_cookie_max_age_remember)
      : Number(config.refreshToken.refresh_token_cookie_max_age);

    const expireDate = new Date(Date.now() + expiresInMs);

    //set refreshTokenHash or create new session
    const refreshTokenHash = makeHash(refreshToken);
    const newSession = await SessionModel.create(
      [
        {
          userId: user._id,
          refreshTokenHash,
          ip,
          expiresAt: expireDate,
        },
      ],
      { session },
    );


    //update the lastLoginAt
    await UserModel.updateOne(
      { _id: user._id },
      { lastLoginAt: new Date() },
      { session },
    );

    // transaction success
    await session.commitTransaction();
    await session.endSession();

    //create accessToken
    const accessToken = createToken(
      {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        sessionId: newSession[0]?._id!?.toString(),
      },
      config.jwt.jwt_access_secret as Secret,
      config.jwt.jwt_access_expires_in as TJwtExpiresIn,
    );

    return {
      accessToken,
      refreshToken,
      message: `${user.role === "super_admin" ? "Super Admin" : "Admin"} login successfull`,
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      profileImg: user.profileImg,
      role: user.role,
    };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

/*=========== logout ========== */
const logout = async (sessionId: string) => {
  //update session
  await SessionModel.updateOne(
    { _id: sessionId },
    { revoked: true }
  );

  return null;
};

/*=========== logout from all devices ========== */
const logoutFromAll = async (userId: string, sessionId: string) => {

  //transaction & rollback
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    //delete all session
    await SessionModel.deleteMany(
      {
        userId,
      },
      { session },
    );

    //update tokenVersion
    await UserModel.updateOne(
      { _id: userId },
      { $inc: { tokenVersion: 1 } },
      { session },
    );

    //transaction success
    await session.commitTransaction();
    await session.endSession();
    return null;
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }

};

/*============ get all sessions  ============*/
const getAllSessions = async (loginUserId: string) => {
  const sessions = await SessionModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(loginUserId),
        revoked: false,
      },
    },
    {
      $project: {
        ip: 1,
        createdAt: 1,
      },
    },
  ]);
  return sessions;
};

/*============ refresh token  ============*/
const refreshToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new UnauthorizedError(`You are unauthorized !`);
  }

  let decoded;

  try {
    decoded = verifyToken(refreshToken, config.jwt.jwt_refresh_secret as Secret);
  } catch (error) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  //check if the user is exist
  const user = await UserModel.findById(decoded.userId);
  if (!user) {
    throw new UnauthorizedError(`You are unauthorized, user not found`);
  }

  //check logout from all devices
  if (user.tokenVersion !== decoded.tokenVersion) {
    throw new UnauthorizedError("Session expired. Please login again.");
  }

  //check session is revoked with this refreshToken
  const refreshTokenHash = makeHash(refreshToken);
  const session = await SessionModel.findOne({
    refreshTokenHash,
  });

  if (!session || session.revoked) {
    throw new UnauthorizedError("Session expired. Please login again");
  }

  //check if the user is already blocked
  const blockStatus = user.status;
  if (blockStatus === "blocked") {
    throw new UnauthorizedError(`You are unauthorized, This user is blocked`);
  }

  //check if passwordChangedAt is greater than token iat
  if (
    user?.passwordChangedAt &&
    isJWTIssuedBeforePassChanged(user?.passwordChangedAt, decoded.iat as number)
  ) {
    throw new UnauthorizedError(
      "You are unauthorized, Your password has been changed, please login again!",
    );
  }

  //create accessToken
  const accessToken = createToken(
    {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      sessionId: session._id.toString(),
    },
    config.jwt.jwt_access_secret as Secret,
    config.jwt.jwt_access_expires_in as TJwtExpiresIn,
  );

  return {
    accessToken,
  };
};

/*============ change password  ============*/
const changePassword = async (
  ip: string,
  loginUserId: string,
  payload: IChangePassword,
) => {
  const { currentPassword, newPassword } = payload;

  const user = await UserModel.findById(loginUserId).select("+password");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  //checking if the password is not correct
  const isPasswordMatched = await checkPassword(
    currentPassword,
    user?.password as string,
  );

  if (!isPasswordMatched) {
    throw new UnprocessableError("Wrong current password");
  }

  //hash the newPassword
  const hashPass = await hashedPassword(newPassword);

  //transaction & rollback
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    //update the password
    await UserModel.updateOne(
      { _id: loginUserId },
      { password: hashPass, passwordChangedAt: new Date(Date.now() - 20000) },
      { session },
    );

    //create refreshToken
    const refreshToken = createToken(
      {
        userId: String(user._id),
        email: user.email,
        tokenVersion: user.tokenVersion,
      },
      config.jwt.jwt_refresh_secret as Secret,
      config.jwt.jwt_refresh_expires_in as TJwtExpiresIn,
    );

    const refreshTokenHash = makeHash(refreshToken);
    const newSession = await SessionModel.create(
      [
        {
          userId: user._id,
          refreshTokenHash,
          ip,
        },
      ],
      { session },
    );

    //transaction success
    await session.commitTransaction();
    await session.endSession();

    //create accessToken
    const accessToken = createToken(
      {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        sessionId: newSession[0]?._id!?.toString(),
      },
      config.jwt.jwt_access_secret as Secret,
      config.jwt.jwt_access_expires_in as TJwtExpiresIn,
    );

    return {
      accessToken,
      refreshToken,
    };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

/*============ forgot password send otp (step-01)  ============*/
const forgotPasswordSendOtp = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new NotFoundError(`No account found for this email address.`);
  }

  //check email is not verified
  if (!user.isEmailVerified) {
    throw new ForbiddenError("Your account is not verified yet.");
  }

  //check user is blocked
  if (user.status === ACCOUNT_STATUS.BLOCKED) {
    throw new ForbiddenError("Your account is blocked.");
  }

  //check otp--// enforce a 1-minute cooldown between OTP resends
  const otpRecord = await OtpModel.findOne({
    userId: user._id,
    email,
    type: OTP_TYPE.RESET_PASSWORD,
  });

  if (otpRecord) {
    const now = Date.now();
    const updated = new Date(otpRecord.updatedAt).getTime();
    const oneMinutes = 1 * 60 * 1000;
    if (now - updated < oneMinutes) {
      throw new ConflictError("OTP can only be resent after 1 minute.");
    }
  }

  const otp = generateOTP();

  //set the forgot otp
  await OtpModel.updateOne(
    { userId: user._id, email },
    {
      otp,
      expires: new Date(+new Date() + 600000),
      type: OTP_TYPE.RESET_PASSWORD,
      isVerified: false,
    },
    { upsert: true },
  );

  //send otp to the email address
  sendForgotEmail(email, String(otp));

  return {
    resendAvailableAt: new Date(Date.now() + 60 * 1000), //resend after one minute
  };
};

/*============ forgot password verify otp (step-02)  ============*/
const forgotPasswordVerifyOtp = async (payload: IVerifyOTp) => {
  const { email, otp } = payload;

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new NotFoundError(`No account found for this email address.`);
  }

  //check email is not verified
  if (!user.isEmailVerified) {
    throw new ForbiddenError("Your account is not verified yet.");
  }

  //check user is blocked
  if (user.status === ACCOUNT_STATUS.BLOCKED) {
    throw new ForbiddenError("Your account is blocked.");
  }

  //check otp doesn't exist
  const otpRecord = await OtpModel.findOne({
    userId: user._id,
    email,
    otp,
    type: OTP_TYPE.RESET_PASSWORD,
    isVerified: false,
  });
  if (!otpRecord) {
    throw new UnprocessableError("Invalid verification code.");
  }
  //check otp expired
  if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
    throw new GoneError("Expired verification code");
  }

  //delete the otp
  await OtpModel.deleteOne(
    {
      userId: user._id,
      email,
      otp,
      type: OTP_TYPE.RESET_PASSWORD,
      isVerified: false,
    }
  );

  //create token
  const resetToken = generateResetToken(user.email, 5);

  return {
    token: resetToken
  };
};

/*============ forgot password set new password (step-03)  ============*/
const forgotPasswordSetNewPassword = async (payload: INewPassword) => {
  const { token, password } = payload;

  // decrypt and verify the reset token
  let email: string;
  let expiresAt: string;
  try {
    const decryptedData = decrypt(token); // "user@example.com:1710234567890"
    const parts = decryptedData?.split(":");
    const extractedEmail = parts?.[0];
    const extractedExpiresAt = parts?.[1];

    if (!extractedEmail || !extractedExpiresAt) {
      throw new UnprocessableError("Invalid reset token.");
    }

    email = extractedEmail;
    expiresAt = extractedExpiresAt;
  } catch (error) {
    throw new UnprocessableError("Invalid reset token.");
  }

  // check token expired
  if (!expiresAt || Number(expiresAt) < Date.now()) {
    throw new GoneError("Reset token has expired.");
  }

  //check user exist
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new NotFoundError(`No account found for this email address.`);
  }

  //check email is not verified
  if (!user.isEmailVerified) {
    throw new ForbiddenError("Your account is not verified yet.");
  }

  //check user is blocked
  if (user.status === ACCOUNT_STATUS.BLOCKED) {
    throw new ForbiddenError("Your account is blocked.");
  }

  //update the password
  const hashPass = await hashedPassword(password); //hashedPassword
  const result = await UserModel.updateOne(
    { email },
    { password: hashPass, passwordChangedAt: new Date() },
  );

  return result;
};

/*============ change status  ============*/
const changeStatus = async (
  userId: string,
  status: "active" | "blocked",
) => {
  if (!isObjectId(userId)) {
    throw new BadRequestError("userId must be a valid ObjectId");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundError("userId not found");
  }

  //check user is not verified
  if (!user.isEmailVerified) {
    throw new ConflictError("This user account is not verified");
  }

  // avoid unnecessary DB update
  if (user.status === status) {
    return {
      message: `User is already ${status}`,
    };
  }

  const result = await UserModel.updateOne(
    { _id: userId },
    { status },
    { runValidators: true },
  );

  return result;
};

/*============ change multiple status  ============*/
const changeMultipleStatus = async (payload: {
  userIds: string[];
  status: TAccountStatus;
}) => {
  const { userIds, status } = payload;

  //check valid userId
  const findUsersCount = await UserModel.countDocuments({
    _id: { $in: userIds },
  });

  if (findUsersCount !== userIds.length) {
    throw new BadRequestError("One or more user IDs are invalid");
  }

  //update status
  const result = await UserModel.updateMany(
    { _id: { $in: userIds } },
    { $set: { status } },
    { runValidators: true },
  );

  return result;
};

/*============ delete account  ============*/
const deleteAccount = async (loginUserId: string, password: string) => {
  const ObjectId = Types.ObjectId;
  const user = await UserModel.findById(loginUserId).select("+password");
  if (!user) {
    throw new NotFoundError("Profile not found");
  }

  //check password
  const isPasswordMatch = await checkPassword(password, user.password);
  if (!isPasswordMatch) {
    throw new UnprocessableError("Password is not correct");
  }

  //at this moment delete account functionality is disabled for all roles
  if (!["admin", "super_admin"].includes(user.role)) {
    throw new ForbiddenError(`Sorry! You are not allowed to delete this account.`);
  }

  //transaction & rollback
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    //delete otp user
    await OtpModel.deleteOne(
      { userId: new ObjectId(loginUserId) },
      { session },
    );


    //delete all sessions
    await SessionModel.deleteMany(
      { userId: new ObjectId(loginUserId) },
      { session },
    );

    //delete user
    const result = await UserModel.deleteOne(
      { _id: new ObjectId(loginUserId) },
      { session },
    );
    await session.commitTransaction();
    await session.endSession();
    return result;
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

const AuthService = {
  registerPatient,
  registerPatientDraft,
  registerDoctor,
  verifyAccount,
  resendVerificationEmail,
  loginUser,
  loginAdmin,
  logout,
  logoutFromAll,
  getAllSessions,
  refreshToken,
  changePassword,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordSetNewPassword,
  changeStatus,
  changeMultipleStatus,
  deleteAccount,
};

export default AuthService;