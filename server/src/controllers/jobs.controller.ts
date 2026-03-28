import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import JobPost from "../models/job/job_post.model";
import JobType from "../models/job/job_type.model";
import JobLocation from "../models/job/job_location.model";
import Company from "../models/company-profile/company.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import UserAccount from "../models/user/user-account.model";
import { ApiError } from "../errors/ApiError";
import mongoose from "mongoose";
import { IAuthRequest } from "../types/user.interface";
import ProjectStatusService from "../services/project-status.service";

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

      const {
        search,
        job_type,
        location,
        is_active,
        skills,
        rate_min,
        rate_max,
        rate_currency,
        work_format,
        project_cycle,
        job_nature,
        status,
      } = req.query;

      const query: any = {};
      
      query.is_active = true;
      if (!status) {
        query.status = { $in: ['published', 'in_progress'] };
      }

      if (search) {
        query.$or = [
          { job_description: { $regex: search, $options: "i" } },
          { job_title: { $regex: search, $options: "i" } },
        ];
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

      if (skills) {
        const skillIds = Array.isArray(skills) ? skills : [skills];
        query.project_major_categories = { $in: skillIds };
      }

      if (rate_min || rate_max) {
        query.rate_amount = {};
        if (rate_min) query.rate_amount.$gte = parseFloat(rate_min as string);
        if (rate_max) query.rate_amount.$lte = parseFloat(rate_max as string);
      }

      if (rate_currency) {
        query.rate_currency = rate_currency;
      }

      if (work_format) {
        query.work_format = work_format;
      }

      if (project_cycle) {
        query.project_cycle = project_cycle;
      }

      if (job_nature) {
        query.job_nature = job_nature;
      }

      if (status) {
        query.status = status;
      }

      const jobs = await JobPost.find(query)
        .populate("posted_by", "email user_name")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id")
        .populate("project_major_categories")
        .populate("project_sub_categories")
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
      const user = req.user as any;
      const {
        job_type_id,
        company_id,
        is_company_name_hidden,
        job_description,
        job_location,
        project_title,
        job_nature,
        work_format,
        rate_type,
        rate_amount,
        rate_currency,
        project_major_categories,
        project_sub_categories,
        project_cycle,
        start_date,
        hiring_count,
      } = req.body;

      let jobTypeId = job_type_id;
      if (!jobTypeId) {
        const defaultJobType = await JobType.findOne();
        if (defaultJobType) {
          jobTypeId = defaultJobType._id;
        }
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
        job_title: project_title || "",
        job_nature: job_nature || "全职",
        work_format: work_format || "远程",
        rate_type: rate_type || "待面试",
        rate_amount: rate_amount || 0,
        rate_currency: rate_currency || "CNY",
        project_major_categories: project_major_categories || [],
        project_sub_categories: project_sub_categories || [],
        project_cycle: project_cycle || "1个月",
        start_date: start_date ? new Date(start_date) : undefined,
        hiring_count: hiring_count || 1,
        status: "published",
      });

      await jobPost.save();

      const projectRequirement = new ProjectRequirement({
        project_title: project_title || job_description?.substring(0, 50) || "New Project",
        project_description: job_description || "",
        company_id: companyId,
        posted_by: user._id,
        job_post_id: jobPost._id,
        status: "发布",
        is_active: true,
        job_nature: job_nature || "自由顾问",
        work_format: work_format || "远程",
        rate_type: rate_type || "日薪",
        rate_amount: rate_amount || 0,
        rate_currency: rate_currency || "CNY",
        project_cycle: project_cycle || "1个月",
        start_date: start_date ? new Date(start_date) : undefined,
        created_date: new Date(),
      });
      await projectRequirement.save();

      const populatedJob = await JobPost.findById(jobPost._id)
        .populate("posted_by", "email")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id");

      res.status(StatusCodes.CREATED).json({
        message: "Job created successfully",
        job: populatedJob,
        project_requirement_id: projectRequirement._id,
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
      const user = req.user as any;
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
      const user = req.user as any;

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

  public static async changeJobStatus(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const user = req.user as any;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }

      const validStatuses = ["draft", "published", "in_progress", "closed", "expired"];
      if (!validStatuses.includes(status)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status value", []);
      }

      const result = await ProjectStatusService.changeStatus(id, status, user._id);

      if (!result.success) {
        throw new ApiError(StatusCodes.BAD_REQUEST, result.message, []);
      }

      res.status(StatusCodes.OK).json({
        message: result.message,
        job: result.project,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getJobsByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const validStatuses = ["draft", "published", "in_progress", "closed", "expired"];
      if (!validStatuses.includes(status)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status value", []);
      }

      const jobs = await JobPost.find({ status })
        .populate("posted_by", "email user_name")
        .populate("company_id", "company_name")
        .populate("project_major_categories")
        .populate("project_sub_categories")
        .sort({ created_date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await JobPost.countDocuments({ status });

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

  public static async getMyProjects(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!freelancerProfile) {
        return res.status(StatusCodes.OK).json({
          data: [],
          pagination: {
            current_page: page,
            total_pages: 0,
            total_items: 0,
            items_per_page: limit,
          },
        });
      }

      const JobPostActivity = mongoose.model('JobPostActivity');
      
      const acceptedApplications = await JobPostActivity.find({
        user_account_id: user._id,
        status: 'accepted'
      }).select('job_post_id');
      
      const projectIds = acceptedApplications.map((app: any) => app.job_post_id);

      const projects = await JobPost.find({
        $or: [
          { _id: { $in: projectIds } },
          { assigned_freelancers: freelancerProfile._id }
        ],
        status: { $in: ['published', 'in_progress'] }
      })
        .populate("company_id", "company_name")
        .populate("job_location_id")
        .populate("project_major_categories")
        .populate("project_sub_categories")
        .sort({ created_date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await JobPost.countDocuments({
        $or: [
          { _id: { $in: projectIds } },
          { assigned_freelancers: freelancerProfile._id }
        ],
        status: { $in: ['published', 'in_progress'] }
      });

      res.status(StatusCodes.OK).json({
        data: projects,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyPostedJobs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      const userAccount = await UserAccount.findById(user._id);
      let companyQuery: any = {};
      
      if (userAccount?.company_id) {
        companyQuery.company_id = userAccount.company_id;
      } else {
        companyQuery.posted_by = user._id;
      }

      const query: any = { ...companyQuery, is_active: true };
      if (status) {
        query.status = status;
      }

      const jobs = await JobPost.find(query)
        .populate("company_id", "company_name")
        .populate("job_location_id")
        .populate("project_major_categories")
        .populate("project_sub_categories")
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
      next(error);
    }
  }
}
