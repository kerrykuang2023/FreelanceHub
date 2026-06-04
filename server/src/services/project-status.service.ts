import mongoose from "mongoose";
import JobPost from "../models/job/job_post.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import NotificationHelper from "./notification-helper.service";

type ProjectStatus = "draft" | "published" | "in_progress" | "closed" | "expired";

interface IStatusTransition {
  from: ProjectStatus;
  to: ProjectStatus[];
}

const VALID_TRANSITIONS: IStatusTransition[] = [
  { from: "draft", to: ["published", "closed"] },
  { from: "published", to: ["in_progress", "closed", "expired"] },
  { from: "in_progress", to: ["closed"] },
  { from: "expired", to: ["published", "closed"] },
];

class ProjectStatusService {
  public static async changeStatus(
    projectId: string,
    newStatus: ProjectStatus,
    changedBy: string
  ): Promise<{ success: boolean; message: string; project?: any }> {
    try {
      const project = await JobPost.findById(projectId);

      if (!project) {
        return { success: false, message: "Project not found" };
      }

      const currentStatus = (project as any).status as ProjectStatus;
      
      if (currentStatus === newStatus) {
        return { success: false, message: `Project is already in ${newStatus} status` };
      }

      const validTransition = this.validateTransition(currentStatus, newStatus);
      
      if (!validTransition) {
        return { 
          success: false, 
          message: `Invalid status transition from ${currentStatus} to ${newStatus}` 
        };
      }

      (project as any).status = newStatus;
      (project as any).updated_at = new Date();
      await project.save();
      await ProjectRequirement.updateOne(
        { job_post_id: projectId },
        { $set: { status: newStatus, updated_at: new Date() } }
      );

      await this.executeStatusActions(projectId, currentStatus, newStatus, changedBy);

      const updatedProject = await JobPost.findById(projectId)
        .populate("posted_by", "email user_name")
        .populate("company_id")
        .populate("project_major_categories")
        .populate("project_sub_categories");

      return { 
        success: true, 
        message: `Project status changed from ${currentStatus} to ${newStatus}`,
        project: updatedProject
      };
    } catch (error) {
      console.error("Error changing project status:", error);
      return { success: false, message: "Failed to change project status" };
    }
  }

  private static validateTransition(fromStatus: ProjectStatus, toStatus: ProjectStatus): boolean {
    const transition = VALID_TRANSITIONS.find(t => t.from === fromStatus);
    return transition ? transition.to.includes(toStatus) : false;
  }

  private static async executeStatusActions(
    projectId: string,
    fromStatus: ProjectStatus,
    toStatus: ProjectStatus,
    changedBy: string
  ): Promise<void> {
    switch (toStatus) {
      case "published":
        await this.handlePublishedStatus(projectId, changedBy);
        break;
      case "in_progress":
        await this.handleInProgressStatus(projectId, changedBy);
        break;
      case "closed":
        await this.handleClosedStatus(projectId, changedBy);
        break;
      case "expired":
        await this.handleExpiredStatus(projectId, changedBy);
        break;
    }
  }

  private static async handlePublishedStatus(projectId: string, changedBy: string): Promise<void> {
    try {
      const project = await JobPost.findById(projectId)
        .populate("project_major_categories")
        .populate("project_sub_categories");

      if (!project) return;

      const matchingFreelancers = await this.findMatchingFreelancers(project);

      for (const freelancer of matchingFreelancers.slice(0, 10)) {
        const freelancerUserId = (freelancer as any).user_id;
        if (freelancerUserId) {
          await NotificationHelper.sendProjectPublishedNotification(
            freelancerUserId.toString(),
            projectId,
            (project as any).job_title || "New Project"
          ).catch(err => console.error('Failed to send notification:', err));
        }
      }

      console.log(`Project ${projectId} published, notified ${Math.min(matchingFreelancers.length, 10)} matching freelancers`);
    } catch (error) {
      console.error("Error handling published status:", error);
    }
  }

  private static async handleInProgressStatus(projectId: string, changedBy: string): Promise<void> {
    try {
      console.log(`Project ${projectId} is now in progress`);
    } catch (error) {
      console.error("Error handling in_progress status:", error);
    }
  }

  private static async handleClosedStatus(projectId: string, changedBy: string): Promise<void> {
    try {
      const project = await JobPost.findById(projectId)
        .populate("assigned_freelancers");

      if (!project) return;

      const assignedFreelancers = (project as any).assigned_freelancers || [];
      
      for (const freelancer of assignedFreelancers) {
        const freelancerUserId = (freelancer as any).user_id;
        if (freelancerUserId) {
          await NotificationHelper.sendProjectClosedNotification(
            freelancerUserId.toString(),
            projectId,
            (project as any).job_title || "Project"
          ).catch(err => console.error('Failed to send closed notification:', err));
        }
      }

      console.log(`Project ${projectId} closed, notified ${assignedFreelancers.length} assigned freelancers`);
    } catch (error) {
      console.error("Error handling closed status:", error);
    }
  }

  private static async handleExpiredStatus(projectId: string, changedBy: string): Promise<void> {
    try {
      console.log(`Project ${projectId} has expired`);
    } catch (error) {
      console.error("Error handling expired status:", error);
    }
  }

  private static async findMatchingFreelancers(project: any): Promise<any[]> {
    try {
      const query: any = { is_active: true };

      if (project.project_major_categories && project.project_major_categories.length > 0) {
        const categoryIds = project.project_major_categories.map((c: any) => 
          typeof c === 'object' ? c._id : c
        );
        query["skills.skill_category_id"] = { $in: categoryIds };
      }

      const freelancers = await FreelancerProfile.find(query)
        .populate("user_id", "email user_name")
        .limit(50);

      return freelancers;
    } catch (error) {
      console.error("Error finding matching freelancers:", error);
      return [];
    }
  }

  public static async getProjectStatusHistory(projectId: string): Promise<any[]> {
    return [];
  }

  public static async bulkUpdateExpiredProjects(): Promise<{ updated: number }> {
    try {
      const result = await JobPost.updateMany(
        {
          status: "published",
          application_deadline: { $lt: new Date() }
        },
        {
          $set: { status: "expired", updated_at: new Date() }
        }
      );

      return { updated: result.modifiedCount };
    } catch (error) {
      console.error("Error bulk updating expired projects:", error);
      return { updated: 0 };
    }
  }
}

export default ProjectStatusService;
