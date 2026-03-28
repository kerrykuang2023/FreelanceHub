import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import JobPost from "../models/job/job_post.model";
import Rating from "../models/rating/rating.model";
import { ApiError } from "../errors/ApiError";
import { IAuthRequest } from "../types/user.interface";

export default class ContentReviewController {
  public static async getPendingReviews(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const type = req.query.type as string;

      const result: any = {
        pagination: {
          current_page: page,
          items_per_page: limit,
        },
      };

      if (type === "jobs" || !type) {
        const jobs = await JobPost.find({ review_status: "pending" })
          .populate("posted_by", "email user_name")
          .populate("company_id", "company_name")
          .sort({ created_date: -1 })
          .skip(skip)
          .limit(limit);

        const totalJobs = await JobPost.countDocuments({ review_status: "pending" });
        result.jobs = jobs;
        result.pagination.jobs_total = totalJobs;
        result.pagination.total_pages = Math.ceil(totalJobs / limit);
      }

      if (type === "ratings" || !type) {
        const ratings = await Rating.find({ review_status: "pending" })
          .populate("freelancer_id", "display_name")
          .populate("company_id", "company_name")
          .populate("job_id", "job_title")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit);

        const totalRatings = await Rating.countDocuments({ review_status: "pending" });
        result.ratings = ratings;
        result.pagination.ratings_total = totalRatings;
      }

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      throw error;
    }
  }

  public static async reviewJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const user = req.user as any;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }

      const job = await JobPost.findById(id);

      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      }

      if (action === "approve") {
        (job as any).review_status = "approved";
        (job as any).reviewed_at = new Date();
        (job as any).reviewed_by = user._id;
        job.is_active = true;
      } else if (action === "reject") {
        (job as any).review_status = "rejected";
        (job as any).reviewed_at = new Date();
        (job as any).reviewed_by = user._id;
        (job as any).review_reason = reason;
        job.is_active = false;
      } else {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid action. Use 'approve' or 'reject'", []);
      }

      await job.save();

      res.status(StatusCodes.OK).json({
        message: `Job ${action}d successfully`,
        job,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async reviewRating(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const user = req.user as any;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid rating ID", []);
      }

      const rating = await Rating.findById(id);

      if (!rating) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Rating not found", []);
      }

      if (action === "approve") {
        (rating as any).review_status = "approved";
        (rating as any).reviewed_at = new Date();
        (rating as any).reviewed_by = user._id;
        (rating as any).is_visible = true;
      } else if (action === "reject") {
        (rating as any).review_status = "rejected";
        (rating as any).reviewed_at = new Date();
        (rating as any).reviewed_by = user._id;
        (rating as any).review_reason = reason;
        (rating as any).is_visible = false;
      } else if (action === "delete") {
        await Rating.findByIdAndDelete(id);
        res.status(StatusCodes.OK).json({
          message: "Rating deleted successfully",
        });
        return;
      } else {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid action. Use 'approve', 'reject', or 'delete'", []);
      }

      await rating.save();

      res.status(StatusCodes.OK).json({
        message: `Rating ${action}d successfully`,
        rating,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async bulkReviewJobs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { job_ids, action, reason } = req.body;
      const user = req.user as any;

      if (!job_ids || !Array.isArray(job_ids) || job_ids.length === 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Job IDs array is required", []);
      }

      const updateData: any = {
        review_status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date(),
        reviewed_by: user._id,
        is_active: action === "approve",
      };

      if (action === "reject" && reason) {
        updateData.review_reason = reason;
      }

      const result = await JobPost.updateMany(
        { _id: { $in: job_ids } },
        { $set: updateData }
      );

      res.status(StatusCodes.OK).json({
        message: `${result.modifiedCount} jobs ${action}d successfully`,
        modified_count: result.modifiedCount,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getReviewStats(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const jobsPending = await JobPost.countDocuments({ review_status: "pending" });
      const jobsApproved = await JobPost.countDocuments({ review_status: "approved" });
      const jobsRejected = await JobPost.countDocuments({ review_status: "rejected" });

      const ratingsPending = await Rating.countDocuments({ review_status: "pending" });
      const ratingsApproved = await Rating.countDocuments({ review_status: "approved" });
      const ratingsRejected = await Rating.countDocuments({ review_status: "rejected" });

      res.status(StatusCodes.OK).json({
        jobs: {
          pending: jobsPending,
          approved: jobsApproved,
          rejected: jobsRejected,
        },
        ratings: {
          pending: ratingsPending,
          approved: ratingsApproved,
          rejected: ratingsRejected,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
