import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import JobPostActivity from "../models/job/job_post_activity.model";
import JobPost from "../models/job/job_post.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import UserAccount from "../models/user/user-account.model";
import UserRole from "../models/user/user-role.model";
import { ApiError } from "../errors/ApiError";
import { BadRequestError, NotFoundError } from "../errors";
import mongoose from "mongoose";
import { IAuthRequest } from "../types/user.interface";
import NotificationHelper from "../services/notification-helper.service";

const ALLOWED_APPLICATION_STATUSES = ["pending", "reviewed", "accepted", "rejected", "invalidated"];
const ALLOWED_PROJECT_STATUSES_FOR_APPLICATION = ["published"];
const PROJECT_STATUS_IN_PROGRESS = "in_progress";
const PROJECT_STATUS_CLOSED = "closed";

export default class JobApplicationsController {
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
      return JobApplicationsController.normalizeRole(user.user_type_id.user_type_name);
    }

    return JobApplicationsController.normalizeRole(user.user_type || user.role);
  }

  private static async assertCanApply(user: any) {
    const roleType = await JobApplicationsController.getActiveRoleType(user);
    if (!["job_seeker", "freelancer"].includes(roleType)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Only freelancer accounts can apply for projects.",
        []
      );
    }
  }

  public static async applyForJob(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      await JobApplicationsController.assertCanApply(user);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid job ID", []);
      }

      const job = await JobPost.findById(id);
      if (!job) {
        throw new NotFoundError("Job not found", []);
      }

      if (!job.is_active) {
        throw new BadRequestError("This job is no longer active", []);
      }

      const jobStatus = (job as any).status;
      if (jobStatus === PROJECT_STATUS_IN_PROGRESS) {
        throw new BadRequestError(
          "This project is already in progress and no longer accepting applications.",
          []
        );
      }

      if (jobStatus === PROJECT_STATUS_CLOSED) {
        throw new BadRequestError(
          "This project has been closed and is no longer accepting applications.",
          []
        );
      }

      if (jobStatus && !ALLOWED_PROJECT_STATUSES_FOR_APPLICATION.includes(jobStatus)) {
        throw new BadRequestError(
          `Cannot apply for job with status: ${jobStatus}. Only published jobs accept applications.`,
          []
        );
      }

      const acceptedApplicationCount = await JobPostActivity.countDocuments({
        job_post_id: id,
        status: "accepted"
      });
      
      if (acceptedApplicationCount > 0) {
        throw new BadRequestError(
          "This project already has an accepted applicant and is no longer accepting applications.",
          []
        );
      }

      const applicationDeadline = (job as any).application_deadline;
      if (applicationDeadline && new Date(applicationDeadline) < new Date()) {
        throw new BadRequestError("Application deadline has passed", []);
      }

      const existingApplication = await JobPostActivity.findOne({
        user_account_id: user._id,
        job_post_id: id,
      });

      if (existingApplication) {
        throw new BadRequestError("You have already applied for this job", []);
      }

      const profile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!profile) {
        throw new BadRequestError("Please complete your freelancer profile before applying", []);
      }

      const application = new JobPostActivity({
        user_account_id: user._id,
        freelancer_id: profile._id,
        job_post_id: id,
        company_id: job.company_id,
        apply_date: new Date(),
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      });

      await application.save();

      const populatedApplication = await JobPostActivity.findById(application._id)
        .populate("user_account_id", "email user_name")
        .populate("freelancer_id", "freelancer_name")
        .populate("job_post_id")
        .populate("company_id", "company_name");

      if (job.posted_by) {
        NotificationHelper.sendJobApplicationNotification(
          job.posted_by.toString(),
          populatedApplication?._id.toString() || application._id.toString(),
          (job as any).job_title || (job as any).job_description?.substring(0, 50) || "Job Position"
        ).catch((err: any) => console.error('Failed to send notification:', err));
      }

      res.status(StatusCodes.CREATED).json({
        message: "Application submitted successfully",
        application: populatedApplication,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async applyForProject(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      await JobApplicationsController.assertCanApply(user);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid project ID", []);
      }

      const project = await ProjectRequirement.findById(id);
      if (!project) {
        throw new NotFoundError("Project not found", []);
      }

      if (!ALLOWED_PROJECT_STATUSES_FOR_APPLICATION.includes(project.status)) {
        throw new BadRequestError(
          `Cannot apply for project with status: ${project.status}. Only published or open projects accept applications.`,
          []
        );
      }

      const projectDeadline = (project as any).application_deadline;
      if (projectDeadline && new Date(projectDeadline) < new Date()) {
        throw new BadRequestError("Application deadline has passed", []);
      }

      const existingApplication = await JobPostActivity.findOne({
        user_account_id: user._id,
        job_post_id: id,
        application_type: "project"
      });

      if (existingApplication) {
        throw new BadRequestError("You have already applied for this project", []);
      }

      const profile = await FreelancerProfile.findOne({ user_id: user._id });
      if (!profile) {
        throw new BadRequestError("Please complete your freelancer profile before applying", []);
      }

      const application = new JobPostActivity({
        user_account_id: user._id,
        freelancer_id: profile._id,
        job_post_id: id,
        company_id: project.company_id,
        application_type: "project",
        apply_date: new Date(),
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      });

      await application.save();

      const populatedApplication = await JobPostActivity.findById(application._id)
        .populate("user_account_id", "email user_name")
        .populate("freelancer_id", "freelancer_name")
        .populate("job_post_id")
        .populate("company_id", "company_name");

      res.status(StatusCodes.CREATED).json({
        message: "Project application submitted successfully",
        application: populatedApplication,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getJobApplications(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid job ID", []);
      }

      const job = await JobPost.findById(id);
      if (!job) {
        throw new NotFoundError("Job not found", []);
      }

      const userAccount = await UserAccount.findById(user._id);
      const isJobOwner = job.posted_by.toString() === user._id.toString();
      const isCompanyOwner = userAccount?.company_id && job.company_id?.toString() === userAccount.company_id.toString();
      
      if (!isJobOwner && !isCompanyOwner) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to view applications for this job",
          []
        );
      }

      const applications = await JobPostActivity.find({ job_post_id: id })
        .populate("user_account_id", "email user_name")
        .populate({
          path: "freelancer_id",
          populate: { path: "user_id", select: "user_name email" }
        })
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
      next(error);
    }
  }

  public static async getUserApplications(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      const query: any = { user_account_id: user._id };
      if (status && ALLOWED_APPLICATION_STATUSES.includes(status)) {
        query.status = status;
      }

      const applications = await JobPostActivity.find(query)
        .populate({
          path: "job_post_id",
          populate: [
            { path: "job_type_id" },
            { path: "job_location_id" },
            { path: "company_id", select: "company_name logo" },
          ],
        })
        .populate("company_id", "company_name")
        .sort({ apply_date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await JobPostActivity.countDocuments(query);

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
      next(error);
    }
  }

  public static async updateJobApplication(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid application ID", []);
      }

      if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
        throw new BadRequestError("无效的申请状态，请刷新列表后重新操作", []);
      }

      const application = await JobPostActivity.findById(id).populate("job_post_id");

      if (!application) {
        throw new NotFoundError("Application not found", []);
      }

      const job = application.job_post_id as any;
      const userAccount = await UserAccount.findById(user._id);
      
      const isJobOwner = job.posted_by?.toString() === user._id.toString();
      const isCompanyOwner = userAccount?.company_id && job.company_id?.toString() === userAccount.company_id.toString();
      
      if (!isJobOwner && !isCompanyOwner) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "该申请所属项目不属于当前企业或当前账号，不能处理此申请",
          []
        );
      }

      if (application.status === "accepted") {
        throw new BadRequestError("该申请已经录用，不能重复更新状态", []);
      }

      if (application.status === "rejected" && status !== "rejected") {
        throw new BadRequestError("该申请已被拒绝，不能再改为其他状态", []);
      }

      const jobId = job._id || application.job_post_id;
      const acceptedCount = await JobPostActivity.countDocuments({
        job_post_id: jobId,
        status: "accepted",
        _id: { $ne: application._id }
      });

      if (status === "accepted" && acceptedCount > 0) {
        throw new BadRequestError(
          "该项目已经录用了一位顾问，不能重复录用。其他待处理申请会在录用后自动失效。",
          []
        );
      }

      application.status = status;
      if (notes) {
        (application as any).notes = notes;
      }
      (application as any).reviewed_at = new Date();
      (application as any).reviewed_by = user._id;
      application.updatedAt = new Date();
      await application.save();

      if (status === "accepted") {
        const freelancerId = application.freelancer_id;
        
        await JobPost.findByIdAndUpdate(jobId, {
          $addToSet: { assigned_freelancers: freelancerId },
          status: "in_progress"
        });
        await ProjectRequirement.updateOne(
          { job_post_id: jobId },
          { $set: { status: "in_progress", is_active: true } }
        );
        await JobPostActivity.updateMany(
          {
            _id: { $ne: application._id },
            job_post_id: jobId,
            status: { $in: ["pending", "reviewed"] },
          },
          {
            $set: {
              status: "invalidated",
              notes: "Automatically invalidated because another applicant was accepted.",
              reviewed_at: new Date(),
              reviewed_by: user._id,
            },
          }
        );
        
        console.log(`Freelancer ${freelancerId} assigned to job ${jobId}, status updated to in_progress`);
      }

      const updatedApplication = await JobPostActivity.findById(id)
        .populate("user_account_id", "email user_name")
        .populate("freelancer_id", "freelancer_name")
        .populate("job_post_id");

      if (status === "accepted" || status === "rejected") {
        const applicantUserId = (application.user_account_id as any)?._id || application.user_account_id;
        NotificationHelper.sendApplicationStatusNotification(
          applicantUserId.toString(),
          application._id.toString(),
          status,
          job.job_title || job.project_title || "Position"
        ).catch((err: any) => console.error('Failed to send notification:', err));
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Application status updated successfully",
        application: updatedApplication,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async withdrawApplication(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid application ID", []);
      }

      const application = await JobPostActivity.findById(id);

      if (!application) {
        throw new NotFoundError("Application not found", []);
      }

      if (application.user_account_id.toString() !== user._id.toString()) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You can only withdraw your own applications",
          []
        );
      }

      if (application.status === "accepted") {
        throw new BadRequestError("Cannot withdraw an accepted application", []);
      }

      (application as any).status = "withdrawn";
      (application as any).withdrawn_at = new Date();
      application.updatedAt = new Date();
      await application.save();

      res.status(StatusCodes.OK).json({
        message: "Application withdrawn successfully",
        application,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getApplicationById(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid application ID", []);
      }

      const application = await JobPostActivity.findById(id)
        .populate("user_account_id", "email user_name")
        .populate({
          path: "freelancer_id",
          populate: { path: "user_id", select: "user_name email" }
        })
        .populate({
          path: "job_post_id",
          populate: [
            { path: "company_id", select: "company_name logo" }
          ]
        });

      if (!application) {
        throw new NotFoundError("Application not found", []);
      }

      const job = application.job_post_id as any;
      const isApplicant = application.user_account_id.toString() === user._id.toString();
      const isJobOwner = job?.posted_by?.toString() === user._id.toString();

      if (!isApplicant && !isJobOwner) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to view this application",
          []
        );
      }

      res.status(StatusCodes.OK).json({ application });
    } catch (error) {
      next(error);
    }
  }

  public static async getApplicationsForMyJobs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      const userAccount = await UserAccount.findById(user._id);
      let jobQuery: any = {};
      
      if (userAccount?.company_id) {
        jobQuery.company_id = userAccount.company_id;
      } else {
        jobQuery.posted_by = user._id;
      }

      const myJobs = await JobPost.find(jobQuery).select('_id');
      const jobIds = myJobs.map(job => job._id);

      if (jobIds.length === 0) {
        return res.status(StatusCodes.OK).json({
          applications: [],
          pagination: {
            current_page: page,
            total_pages: 0,
            total_items: 0,
            items_per_page: limit,
          },
        });
      }

      const query: any = { job_post_id: { $in: jobIds } };
      if (status && ALLOWED_APPLICATION_STATUSES.includes(status)) {
        query.status = status;
      }

      const applications = await JobPostActivity.find(query)
        .populate("user_account_id", "email user_name")
        .populate({
          path: "freelancer_id",
          populate: { path: "user_id", select: "user_name email" }
        })
        .populate({
          path: "job_post_id",
          populate: [
            { path: "job_type_id" },
            { path: "company_id", select: "company_name logo" },
          ],
        })
        .populate("company_id", "company_name")
        .sort({ apply_date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await JobPostActivity.countDocuments(query);

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
      next(error);
    }
  }
}
