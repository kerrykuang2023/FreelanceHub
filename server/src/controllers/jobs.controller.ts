import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import JobPost from "../models/job/job_post.model";
import JobType from "../models/job/job_type.model";
import JobLocation from "../models/job/job_location.model";
import Company from "../models/company-profile/company.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import UserAccount from "../models/user/user-account.model";
import UserRole from "../models/user/user-role.model";
import { ApiError } from "../errors/ApiError";
import { IAuthRequest } from "../types/user.interface";
import ProjectStatusService from "../services/project-status.service";

export default class JobsController {
  private static normalizeString(value: unknown, fallback: string): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  private static async getOrCreateCompany(userId: mongoose.Types.ObjectId, companyId?: string) {
    if (companyId) return companyId;

    let company = await Company.findOne({ created_by: userId });
    if (!company) {
      company = new Company({
        company_name: "My Company",
        created_by: userId,
        verification_status: "approved",
      });
      await company.save();
    }

    await UserAccount.findByIdAndUpdate(userId, { company_id: company._id });
    return company._id;
  }

  private static async findProjectRequirementByJob(jobId: mongoose.Types.ObjectId | string) {
    return ProjectRequirement.findOne({ job_post_id: jobId });
  }

  private static normalizeRole(value: unknown): string {
    return typeof value === "string" ? value.toLowerCase().replace(/[\s-]/g, "_") : "";
  }

  private static async getActiveRoleType(user: any): Promise<string> {
    const activeRole = await UserRole.findOne({
      user_id: user._id,
      status: "approved",
      is_active: true,
    }).select("role_type");

    if (activeRole?.role_type) return activeRole.role_type;

    if (user.user_type_id && typeof user.user_type_id === "object") {
      return JobsController.normalizeRole(user.user_type_id.user_type_name);
    }

    return JobsController.normalizeRole(user.user_type || user.role);
  }

  private static async assertCanManageJobs(user: any): Promise<string> {
    const roleType = await JobsController.getActiveRoleType(user);
    if (!["hr_recruiter", "admin"].includes(roleType)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Only HR recruiters or administrators can manage jobs.",
        []
      );
    }
    return roleType;
  }

  private static async canManageJob(user: any, job: any): Promise<boolean> {
    const roleType = await JobsController.assertCanManageJobs(user);
    if (roleType === "admin") return true;

    const userAccount = await UserAccount.findById(user._id).select("company_id");
    const isJobOwner = job.posted_by?.toString() === user._id.toString();
    const isCompanyOwner =
      userAccount?.company_id &&
      job.company_id?.toString() === userAccount.company_id.toString();

    return Boolean(isJobOwner || isCompanyOwner);
  }

  public static async getJobTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const jobTypes = await JobType.find().sort({ job_type: 1 });
      res.status(StatusCodes.OK).json({ job_types: jobTypes });
    } catch (error) {
      next(error);
    }
  }

  public static async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const {
        search,
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

      const query: any = { is_active: true };
      query.status = status || { $in: ["published", "in_progress"] };

      if (search) {
        query.$or = [
          { job_description: { $regex: search, $options: "i" } },
          { job_title: { $regex: search, $options: "i" } },
        ];
      }
      if (is_active !== undefined) query.is_active = is_active === "true";
      if (skills) query.project_major_categories = { $in: Array.isArray(skills) ? skills : [skills] };
      if (rate_min || rate_max) {
        query.rate_amount = {};
        if (rate_min) query.rate_amount.$gte = parseFloat(rate_min as string);
        if (rate_max) query.rate_amount.$lte = parseFloat(rate_max as string);
      }
      if (rate_currency) query.rate_currency = rate_currency;
      if (work_format) query.work_format = work_format;
      if (project_cycle) query.project_cycle = project_cycle;
      if (job_nature) query.job_nature = job_nature;

      const [jobs, total] = await Promise.all([
        JobPost.find(query)
          .populate("posted_by", "email user_name")
          .populate("job_type_id")
          .populate("job_location_id")
          .populate("company_id")
          .populate("project_major_categories")
          .populate("project_sub_categories")
          .sort({ created_date: -1 })
          .skip(skip)
          .limit(limit),
        JobPost.countDocuments(query),
      ]);

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

  public static async createJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      await JobsController.assertCanManageJobs(user);
      const {
        job_type_id,
        company_id,
        is_company_name_hidden,
        job_description,
        project_description,
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

      const description = job_description || project_description;
      if (!description) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "job_description is required", []);
      }

      let jobTypeId = job_type_id;
      if (!jobTypeId) {
        const defaultJobType = await JobType.findOne();
        jobTypeId = defaultJobType?._id;
      }

      const companyId = await JobsController.getOrCreateCompany(user._id, company_id);
      const normalizedJobNature = JobsController.normalizeString(job_nature, "freelance");
      const normalizedWorkFormat = JobsController.normalizeString(work_format, "remote");
      const normalizedRateType = JobsController.normalizeString(rate_type, "daily");
      const normalizedProjectCycle = JobsController.normalizeString(project_cycle, "1_month");

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
        job_type_id: jobTypeId,
        company_id: companyId,
        is_company_name_hidden: is_company_name_hidden || false,
        created_date: new Date(),
        job_description: description,
        job_location_id: jobLocation._id,
        is_active: true,
        job_title: project_title || description.substring(0, 80),
        job_nature: normalizedJobNature,
        work_format: normalizedWorkFormat,
        rate_type: normalizedRateType,
        rate_amount: rate_amount || 0,
        rate_currency: rate_currency || "CNY",
        project_major_categories: project_major_categories || [],
        project_sub_categories: project_sub_categories || [],
        project_cycle: normalizedProjectCycle,
        start_date: start_date ? new Date(start_date) : undefined,
        hiring_count: hiring_count || 1,
        status: "published",
      });
      await jobPost.save();

      const projectRequirement = new ProjectRequirement({
        project_title: project_title || description.substring(0, 80),
        project_description: description,
        company_id: companyId,
        posted_by: user._id,
        job_post_id: jobPost._id,
        status: "published",
        is_active: true,
        job_nature: normalizedJobNature,
        work_format: normalizedWorkFormat,
        rate_type: normalizedRateType,
        rate_amount: rate_amount || 0,
        rate_currency: rate_currency || "CNY",
        project_major_categories: project_major_categories || [],
        project_sub_categories: project_sub_categories || [],
        project_cycle: normalizedProjectCycle,
        start_date: start_date ? new Date(start_date) : undefined,
        hiring_count: hiring_count || 1,
        created_date: new Date(),
      });
      await projectRequirement.save();

      const populatedJob = await JobPost.findById(jobPost._id)
        .populate("posted_by", "email user_name")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id");

      res.status(StatusCodes.CREATED).json({
        message: "Job created successfully",
        job: populatedJob,
        project_requirement_id: projectRequirement._id,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }

      const job = await JobPost.findById(id)
        .populate("posted_by", "email user_name")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id");

      if (!job) throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      const projectRequirement = await JobsController.findProjectRequirementByJob(job._id);
      res.status(StatusCodes.OK).json({ job, project_requirement: projectRequirement });
    } catch (error) {
      next(error);
    }
  }

  public static async updateJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const updateData = { ...req.body };

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }

      const job = await JobPost.findById(id);
      if (!job) throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      const canManage = await JobsController.canManageJob(user, job);
      if (!canManage) {
        throw new ApiError(StatusCodes.FORBIDDEN, "You are not authorized to update this job", []);
      }

      if (updateData.job_location) {
        await JobLocation.findByIdAndUpdate(job.job_location_id, updateData.job_location);
        delete updateData.job_location;
      }

      Object.assign(job, updateData);
      await job.save();

      const projectRequirement = await JobsController.findProjectRequirementByJob(job._id);
      if (projectRequirement) {
        const mappedFields = [
          "company_id",
          "job_nature",
          "work_format",
          "rate_type",
          "rate_amount",
          "rate_currency",
          "project_major_categories",
          "project_sub_categories",
          "project_cycle",
          "start_date",
          "hiring_count",
          "status",
        ];
        mappedFields.forEach((field) => {
          if (updateData[field] !== undefined) (projectRequirement as any)[field] = updateData[field];
        });
        if (updateData.project_title || updateData.job_title) {
          projectRequirement.project_title = updateData.project_title || updateData.job_title;
        }
        if (updateData.job_description) projectRequirement.project_description = updateData.job_description;
        await projectRequirement.save();
      }

      const updatedJob = await JobPost.findById(id)
        .populate("posted_by", "email user_name")
        .populate("job_type_id")
        .populate("job_location_id")
        .populate("company_id");

      res.status(StatusCodes.OK).json({ message: "Job updated successfully", job: updatedJob });
    } catch (error) {
      next(error);
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
      if (!job) throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      const canManage = await JobsController.canManageJob(user, job);
      if (!canManage) {
        throw new ApiError(StatusCodes.FORBIDDEN, "You are not authorized to delete this job", []);
      }

      await JobPost.findByIdAndDelete(id);
      await ProjectRequirement.deleteOne({ job_post_id: id });
      if (job.job_location_id) await JobLocation.findByIdAndDelete(job.job_location_id);
      res.status(StatusCodes.OK).json({ message: "Job deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  public static async changeJobStatus(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user as any;
      const validStatuses = ["draft", "published", "in_progress", "closed", "expired"];

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid job ID", []);
      }
      if (!validStatuses.includes(status)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status value", []);
      }

      const job = await JobPost.findById(id);
      if (!job) throw new ApiError(StatusCodes.NOT_FOUND, "Job not found", []);
      const canManage = await JobsController.canManageJob(user, job);
      if (!canManage) {
        throw new ApiError(StatusCodes.FORBIDDEN, "You are not authorized to change this job status", []);
      }

      const result = await ProjectStatusService.changeStatus(id, status, user._id);
      if (!result.success) {
        throw new ApiError(StatusCodes.BAD_REQUEST, result.message, []);
      }

      await ProjectRequirement.updateOne({ job_post_id: id }, { $set: { status, is_active: status !== "closed" } });
      res.status(StatusCodes.OK).json({ message: result.message, job: result.project });
    } catch (error) {
      next(error);
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

      const [jobs, total] = await Promise.all([
        JobPost.find({ status })
          .populate("posted_by", "email user_name")
          .populate("company_id", "company_name")
          .populate("project_major_categories")
          .populate("project_sub_categories")
          .sort({ created_date: -1 })
          .skip(skip)
          .limit(limit),
        JobPost.countDocuments({ status }),
      ]);

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

  public static async getMyProjects(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const freelancerProfile = await FreelancerProfile.findOne({ user_id: user._id });

      if (!freelancerProfile) {
        return res.status(StatusCodes.OK).json({ data: [], pagination: { current_page: page, total_pages: 0, total_items: 0, items_per_page: limit } });
      }

      const JobPostActivity = mongoose.model("JobPostActivity");
      const acceptedApplications = await JobPostActivity.find({ user_account_id: user._id, status: "accepted" }).select("job_post_id");
      const projectIds = acceptedApplications.map((app: any) => app.job_post_id);
      const query = {
        $or: [{ _id: { $in: projectIds } }, { assigned_freelancers: freelancerProfile._id }],
        status: { $in: ["published", "in_progress"] },
      };

      const [projects, total] = await Promise.all([
        JobPost.find(query)
          .populate("company_id", "company_name")
          .populate("job_location_id")
          .populate("project_major_categories")
          .populate("project_sub_categories")
          .sort({ created_date: -1 })
          .skip(skip)
          .limit(limit),
        JobPost.countDocuments(query),
      ]);

      const normalizedProjects = projects.map((project: any) => {
        const data = project.toObject ? project.toObject() : project;
        return {
          ...data,
          project_title: data.project_title || data.job_title || data.job_description?.slice(0, 80) || "Untitled project",
          company_name: data.company_name || data.company_id?.company_name || "",
        };
      });

      res.status(StatusCodes.OK).json({
        data: normalizedProjects,
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
      const ownershipQuery = userAccount?.company_id ? { company_id: userAccount.company_id } : { posted_by: user._id };
      const query: any = { ...ownershipQuery, is_active: true };
      if (status) query.status = status;

      const [jobs, total] = await Promise.all([
        JobPost.find(query)
          .populate("company_id", "company_name")
          .populate("job_location_id")
          .populate("project_major_categories")
          .populate("project_sub_categories")
          .sort({ created_date: -1 })
          .skip(skip)
          .limit(limit),
        JobPost.countDocuments(query),
      ]);

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
