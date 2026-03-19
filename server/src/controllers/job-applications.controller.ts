import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import JobPostActivity from "../models/job/job_post_activity.model";
import JobPost from "../models/job/job_post.model";
import { ApiError } from "../errors/ApiError";
import mongoose from "mongoose";

interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
}

interface IAuthRequest extends Request {
  user?: IUser;
}

export default class JobApplicationsController {
  public static async applyForJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }

      const job = await JobPost.findById(id);
      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      }

      if (!job.is_active) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "This job is no longer active", []);
      }

      const existingApplication = await JobPostActivity.findOne({
        user_account_id: user._id,
        job_post_id: id,
      });

      if (existingApplication) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You have already applied for this job", []);
      }

      const application = new JobPostActivity({
        user_account_id: user._id,
        job_post_id: id,
        apply_date: new Date(),
        status: "pending",
      });

      await application.save();

      const populatedApplication = await JobPostActivity.findById(application._id)
        .populate("user_account_id", "email")
        .populate("job_post_id");

      res.status(StatusCodes.CREATED).json({
        message: "Application submitted successfully",
        application: populatedApplication,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getJobApplications(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }

      const job = await JobPost.findById(id);
      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      }

      if (job.posted_by.toString() !== user._id.toString()) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to view applications for this job",
          []
        );
      }

      const applications = await JobPostActivity.find({ job_post_id: id })
        .populate("user_account_id", "email")
        .sort({ apply_date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await JobPostActivity.countDocuments({ job_post_id: id });

      res.status(StatusCodes.OK).json({
        applications,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getUserApplications(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const applications = await JobPostActivity.find({ user_account_id: user._id })
        .populate({
          path: "job_post_id",
          populate: [
            { path: "job_type_id" },
            { path: "job_location_id" },
            { path: "company_id" },
          ],
        })
        .sort({ apply_date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await JobPostActivity.countDocuments({ user_account_id: user._id });

      res.status(StatusCodes.OK).json({
        applications,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public static async updateJobApplication(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid application ID", []);
      }

      const application = await JobPostActivity.findById(id).populate("job_post_id");

      if (!application) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Application not found", []);
      }

      const job = application.job_post_id as any;
      if (job.posted_by.toString() !== user._id.toString()) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to update this application",
          []
        );
      }

      const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
      if (!validStatuses.includes(status)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status value", []);
      }

      application.status = status;
      await application.save();

      const updatedApplication = await JobPostActivity.findById(id)
        .populate("user_account_id", "email")
        .populate("job_post_id");

      res.status(StatusCodes.OK).json({
        message: "Application status updated successfully",
        application: updatedApplication,
      });
    } catch (error) {
      throw error;
    }
  }
}
