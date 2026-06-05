import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import UserAccount from "../models/user/user-account.model";
import { ApiError } from "../errors/ApiError";
import mongoose from "mongoose";

async function sendProfileResponse(
  res: Response,
  statusCode: number,
  profile: any,
  message: string
) {
  await profile.populate("user_id", "user_name email user_image");
  const completion = calculateProfileCompletion(profile);

  res.status(statusCode).json({
    success: true,
    message,
    profile: {
      ...profile.toObject(),
      profile_completion: completion,
    },
  });
}

class FreelancerProfileController {
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      let profile = await FreelancerProfile.findOne({ user_id: userId })
        .populate("user_id", "user_name email user_image");

      if (!profile) {
        const user = await UserAccount.findById(userId);
        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, "User not found", []);
        }

        profile = await FreelancerProfile.create({
          user_id: userId,
          display_name: (user as any).user_name || "User",
          headline: "",
          summary: "",
          profile_completion: 0,
        });

        profile = await profile.populate("user_id", "user_name email user_image");
      }

      const completion = calculateProfileCompletion(profile);

      res.status(StatusCodes.OK).json({
        success: true,
        profile: {
          ...profile.toObject(),
          profile_completion: completion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfileById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid profile ID", []);
      }

      const profile = await FreelancerProfile.findOne({
        $or: [{ _id: id }, { user_id: id }],
      })
        .populate("user_id", "user_name email user_image");

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found", []);
      }

      res.status(StatusCodes.OK).json({
        success: true,
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const updateData = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const allowedFields = [
        "display_name",
        "headline",
        "summary",
        "location",
        "years_of_experience",
        "hourly_rate",
        "daily_rate",
        "monthly_rate",
        "preferred_currency",
        "availability_status",
        "available_hours_per_week",
        "preferred_work_formats",
        "preferred_job_natures",
        "preferred_project_cycles",
        "preferred_locations",
        "languages",
        "portfolio_urls",
        "linkedin_url",
      ];

      const filteredData: any = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $set: filteredData },
        { new: true, upsert: true }
      ).populate("user_id", "user_name email user_image");

      const completion = calculateProfileCompletion(profile);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Profile updated successfully",
        profile: {
          ...profile.toObject(),
          profile_completion: completion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const skillData = { ...req.body };

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }
      if (!skillData.skill_category_id) delete skillData.skill_category_id;
      if (!skillData.skill_sub_category_id) delete skillData.skill_sub_category_id;

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $push: { skills: skillData } },
        { new: true, upsert: true }
      );

      await sendProfileResponse(res, StatusCodes.CREATED, profile, "Skill added successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { skillId } = req.params;
      const skillData = { ...req.body };

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }
      if (!skillData.skill_category_id) delete skillData.skill_category_id;
      if (!skillData.skill_sub_category_id) delete skillData.skill_sub_category_id;

      const updateFields: any = {};
      for (const [key, value] of Object.entries(skillData)) {
        updateFields[`skills.$.${key}`] = value;
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId, "skills._id": skillId },
        { $set: updateFields },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Skill not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Skill updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { skillId } = req.params;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $pull: { skills: { _id: skillId } } },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Skill deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async addProjectExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const experienceData = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $push: { project_experiences: experienceData } },
        { new: true, upsert: true }
      );

      await sendProfileResponse(res, StatusCodes.CREATED, profile, "Project experience added successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateProjectExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { experienceId } = req.params;
      const experienceData = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const updateFields: any = {};
      for (const [key, value] of Object.entries(experienceData)) {
        updateFields[`project_experiences.$.${key}`] = value;
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId, "project_experiences._id": experienceId },
        { $set: updateFields },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Project experience not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Project experience updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteProjectExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { experienceId } = req.params;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $pull: { project_experiences: { _id: experienceId } } },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Project experience deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async addCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const certData = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $push: { certifications: certData } },
        { new: true, upsert: true }
      );

      await sendProfileResponse(res, StatusCodes.CREATED, profile, "Certification added successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { certId } = req.params;
      const certData = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const updateFields: any = {};
      for (const [key, value] of Object.entries(certData)) {
        updateFields[`certifications.$.${key}`] = value;
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId, "certifications._id": certId },
        { $set: updateFields },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Certification not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Certification updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { certId } = req.params;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $pull: { certifications: { _id: certId } } },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Certification deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async addEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const educationData = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $push: { education: educationData } },
        { new: true, upsert: true }
      );

      await sendProfileResponse(res, StatusCodes.CREATED, profile, "Education added successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { educationId } = req.params;
      const educationData = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const updateFields: any = {};
      for (const [key, value] of Object.entries(educationData)) {
        updateFields[`education.$.${key}`] = value;
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId, "education._id": educationId },
        { $set: updateFields },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Education not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Education updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { educationId } = req.params;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $pull: { education: { _id: educationId } } },
        { new: true }
      );

      if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found", []);
      }

      await sendProfileResponse(res, StatusCodes.OK, profile, "Education deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateRates(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { hourly_rate, daily_rate, monthly_rate, preferred_currency } = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const updateData: any = {};
      if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;
      if (daily_rate !== undefined) updateData.daily_rate = daily_rate;
      if (monthly_rate !== undefined) updateData.monthly_rate = monthly_rate;
      if (preferred_currency !== undefined) updateData.preferred_currency = preferred_currency;

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $set: updateData },
        { new: true, upsert: true }
      ).populate("user_id", "user_name email user_image");

      const completion = calculateProfileCompletion(profile);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Rates updated successfully",
        profile: {
          ...profile.toObject(),
          profile_completion: completion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { availability_status, available_hours_per_week } = req.body;

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized", []);
      }

      const updateData: any = {};
      if (availability_status !== undefined) updateData.availability_status = availability_status;
      if (available_hours_per_week !== undefined) updateData.available_hours_per_week = available_hours_per_week;

      const profile = await FreelancerProfile.findOneAndUpdate(
        { user_id: userId },
        { $set: updateData },
        { new: true, upsert: true }
      );

      await sendProfileResponse(res, StatusCodes.OK, profile, "Availability updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

function calculateProfileCompletion(profile: any): number {
  let completion = 0;

  if (profile.headline) completion += 10;
  if (profile.summary) completion += 15;
  if (profile.skills && profile.skills.length > 0) completion += 20;
  if (profile.project_experiences && profile.project_experiences.length > 0) completion += 20;
  if (profile.education && profile.education.length > 0) completion += 10;
  if (profile.certifications && profile.certifications.length > 0) completion += 10;
  if (profile.hourly_rate || profile.daily_rate || profile.monthly_rate) completion += 15;
  if (profile.availability_status) completion += 5;
  if (profile.user_id?.user_image) completion += 10;

  return Math.min(completion, 100);
}

export default new FreelancerProfileController();
