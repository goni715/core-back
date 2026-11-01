import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import config from "../config";
import { verifyToken } from "../helpers/JwtHelper";
import asyncHandler from "../utils/asyncHandler";
import UnauthorizedError from "../errors/UnauthorizedError";
import ReferralPartnerModel from "../modules/referralPartner/referralPartner.model";
import UserModel from "../modules/user/user.model";
import { USER_ROLES } from "../modules/user/user.constant";

const subAgentAuthMiddleware = () =>
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedError("You are not authorized.");
        }

        // Bearer prefix check & extract token
        let token: string;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1] as string;
        } else {
            token = authHeader;
        }

        if (!token) {
            throw new UnauthorizedError("You are not authorized.");
        }
        let decoded;

        // verify token
        try {
            decoded = verifyToken(token, config.jwt.jwt_access_secret as Secret);
        } catch {
            throw new UnauthorizedError(
                "You are not authorized. Invalid or expired authentication token.",
            );
        }


        // Find user
        const subAgent = await ReferralPartnerModel.findById(decoded.userId);

        if (!subAgent) {
            const adminUser = await UserModel.findById(decoded.userId);
            if (
                adminUser &&
                (adminUser.role === USER_ROLES.ADMIN ||
                    adminUser.role === USER_ROLES.SUPER_ADMIN)
            ) {
                req.user = {
                    userId: String(adminUser._id),
                    email: adminUser.email,
                    fullName: adminUser.fullName,
                    role: adminUser.role,
                };
                req.headers.userId = String(adminUser._id);
                req.headers.email = adminUser.email;
                req.headers.role = adminUser.role;
                return next();
            }

            throw new UnauthorizedError(
                "You are not authorized. This user does not exist.",
            );
        }


        // attach authenticated user
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            fullName: subAgent.fullName,
            role: "sub_agent",
        };

        // or set user to headers
        req.headers.userId = decoded.userId;
        req.headers.email = decoded.email;
        req.headers.role = "sub_agent";

        next();
    });

export default subAgentAuthMiddleware;
