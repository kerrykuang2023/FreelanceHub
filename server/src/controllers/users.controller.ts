import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import UserAccount from "../models/user/user-account.model";
import SeekerProfile from "../models/job-seeker-profile/seeker_profile.model";
import { ApiError } from "../errors/ApiError";
import mongoose from "mongoose";
import { IAuthRequest } from "../types/user.interface";

export default class UserController {
  public static async getUserPersonal(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;

      const userAccount = await UserAccount.findById(user._id)
        .populate("user_type_id")
        .select("-password");

      if (!userAccount) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found", []);
      }

      const seekerProfile = await SeekerProfile.findOne({
        user_account_id: user._id,
      });

      res.status(StatusCodes.OK).json({
        user: userAccount,
        profile: seekerProfile || null,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID", []);
      }

      const user = await UserAccount.findById(id)
        .populate("user_type_id")
        .select("-password");

      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found", []);
      }

      const seekerProfile = await SeekerProfile.findOne({
        user_account_id: id,
      });

      res.status(StatusCodes.OK).json({
        user,
        profile: seekerProfile || null,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async updateUser(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID", []);
      }

      if (user._id.toString() !== id) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to update this user",
          []
        );
      }

      const allowedFields = ["contact_number", "sms_notification", "email_notification", "user_image"];
      const filteredData: any = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      const updatedUser = await UserAccount.findByIdAndUpdate(id, filteredData, {
        new: true,
      })
        .populate("user_type_id")
        .select("-password");

      if (!updatedUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found", []);
      }

      if (updateData.profile) {
        const profileData = updateData.profile;
        const allowedProfileFields = [
          "first_name",
          "last_name",
          "current_salary",
          "is_annually_monthly",
          "currency",
        ];

        const filteredProfileData: any = {};
        for (const field of allowedProfileFields) {
          if (profileData[field] !== undefined) {
            filteredProfileData[field] = profileData[field];
          }
        }

        if (Object.keys(filteredProfileData).length > 0) {
          await SeekerProfile.findOneAndUpdate(
            { user_account_id: id },
            filteredProfileData,
            { new: true, upsert: true }
          );
        }
      }

      const seekerProfile = await SeekerProfile.findOne({
        user_account_id: id,
      });

      res.status(StatusCodes.OK).json({
        message: "User updated successfully",
        user: updatedUser,
        profile: seekerProfile || null,
      });
    } catch (error) {
      throw error;
    }
  }
}
