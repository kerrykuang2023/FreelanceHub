import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import JobPost from "../models/job/job_post.model";
import JobType from "../models/job/job_type.model";
import JobLocation from "../models/job/job_location.model";
import Company from "../models/company-profile/company.model";
import { ApiError } from "../errors/ApiError";
import mongoose from "mongoose";

interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
}

interface IAuthRequest extends Request {
  user?: IUser;
}

export default class JobsController {
  public static async getJobTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const jobTypes = await JobType.find().sort({ job_type: 1 });
      res.status(StatusCodes.OK).json({ job_types: jobTypes });
    } catch (error) {
      throw error;
    }
  }

  public static async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const { search, job_type, location, is_active } = req.query;

      const query: any = {};

      if (search) {
        query.job_description = { $regex: search, $options: "i" };
      }

      if (job_type) {
        const jobTypeDoc = await JobType.findOne({ job_type: job_type });
        if (jobTypeDoc) {
          query.job_type_id = jobTypeDoc._id;
        }
      }

      if (location) {
        const locationDoc = await JobLocation.findOne({
          $or: [
            { city: { $regex: location, $options: "i" } },
            { state: { $regex: location, $options: "i" } },
            { country: { $regex: location, $options: "i" } },
          ],
        });
        if (locationDoc) {
          query.job_location_id = locationDoc._id;
        }
      }

      if (is_active !== undefined) {
        query.is_active = is_active === "true";
      }

      const jobs = await JobPost.find(query)
        .populate("posted_by", "email")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id")
        .sort({ created_date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await JobPost.countDocuments(query);

      res.status(StatusCodes.OK).json({
        jobs,
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

  public static async createJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const {
        job_type_id,
        company_id,
        is_company_name_hidden,
        job_description,
        job_location,
      } = req.body;

      const jobType = await JobType.findById(job_type_id);
      if (!jobType) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job type", []);
      }

      let companyId = company_id;
      if (!companyId) {
        let company = await Company.findOne({ created_by: user._id });
        if (!company) {
          company = new Company({
            company_name: "My Company",
            created_by: user._id,
          });
          await company.save();
        }
        companyId = company._id;
      }

      const jobLocation = new JobLocation({
        street_address: job_location?.street_address || "",
        city: job_location?.city || "",
        state: job_location?.state || "",
        country: job_location?.country || "",
        zip_code: job_location?.zip_code || "",
      });
      await jobLocation.save();

      const jobPost = new JobPost({
        posted_by: user._id,
        job_type_id,
        company_id: companyId,
        is_company_name_hidden: is_company_name_hidden || false,
        created_date: new Date(),
        job_description,
        job_location_id: jobLocation._id,
        is_active: true,
      });

      await jobPost.save();

      const populatedJob = await JobPost.findById(jobPost._id)
        .populate("posted_by", "email")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id");

      res.status(StatusCodes.CREATED).json({
        message: "Job created successfully",
        job: populatedJob,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }

      const job = await JobPost.findById(id)
        .populate("posted_by", "email")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id");

      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      }

      res.status(StatusCodes.OK).json({ job });
    } catch (error) {
      throw error;
    }
  }

  public static async updateJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as IUser;
      const updateData = req.body;

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
          "You are not authorized to update this job",
          []
        );
      }

      if (updateData.job_location) {
        await JobLocation.findByIdAndUpdate(job.job_location_id, updateData.job_location);
        delete updateData.job_location;
      }

      Object.assign(job, updateData);
      await job.save();

      const updatedJob = await JobPost.findById(id)
        .populate("posted_by", "email")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id");

      res.status(StatusCodes.OK).json({
        message: "Job updated successfully",
        job: updatedJob,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async deleteJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

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
          "You are not authorized to delete this job",
          []
        );
      }

      await JobPost.findByIdAndDelete(id);
      await JobLocation.findByIdAndDelete(job.job_location_id);

      res.status(StatusCodes.OK).json({
        message: "Job deleted successfully",
      });
    } catch (error) {
      throw error;
    }
  }
}
