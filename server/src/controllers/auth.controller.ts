import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import UserAccount from "../models/user/user-account.model";
import UserType from "../models/user/user-type.model";
import UserRole, { RoleType } from "../models/user/user-role.model";
import RoleApproval from "../models/user/role-approval.model";
import { BadRequestError } from "../errors/BadRequestError";
import { ApiError } from "../errors/ApiError";

interface IUserWithRoles extends Document {
  _id: any;
  email: string;
  password: string;
  user_name?: string;
  first_name?: string;
  last_name?: string;
  user_image?: string;
  user_type_id: any;
  comparePassword: (password: string) => boolean;
  generateJWT: () => string;
}

export default class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      console.log(`🔐 [Auth]: Login attempt for email: ${email}`);
      
      const user = await UserAccount.findOne({ email: email }).select("+password");

      if (!user) {
        console.log(`❌ [Auth]: User not found for email: ${email}`);
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          "User account not found",
          []
        );
      }

      if (!(user as any).comparePassword(password)) {
        console.log(`❌ [Auth]: Invalid password for email: ${email}`);
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          "Invalid email or password",
          []
        );
      }

      await UserAccount.findByIdAndUpdate(user._id, { last_login_date: new Date() });

      const userRoles = await UserRole.find({
        user_id: user._id,
        status: "approved",
      });

      let activeRole = userRoles.find((r) => r.is_active);
      if (!activeRole && userRoles.length > 0) {
        activeRole = userRoles[0];
        await UserRole.updateMany(
          { user_id: user._id },
          { is_active: false }
        );
        await UserRole.findByIdAndUpdate(activeRole._id, { is_active: true });
      }

      const userType = await UserType.findById(user.user_type_id);

      console.log(`✅ [Auth]: Login successful for email: ${email}`);

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            user_name: user.user_name,
            first_name: user.first_name,
            last_name: user.last_name,
            user_image: user.user_image,
            user_type: userType?.user_type_name,
          },
          roles: userRoles.map((r) => ({
            id: r._id,
            role_type: r.role_type,
            is_active: r.is_active,
            status: r.status,
          })),
          active_role: activeRole
            ? {
                id: activeRole._id,
                role_type: activeRole.role_type,
              }
            : null,
          token: (user as any).generateJWT(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      const { user_type_name, user_name, role_specific_data } = payload;

      console.log(`📝 [Auth]: Signup attempt for email: ${payload.email}, user_type: ${user_type_name}`);

      const userType = await UserType.findOne({
        user_type_name: user_type_name,
      });

      if (!userType) {
        throw new BadRequestError(
          `User type not found: ${user_type_name}`,
          []
        );
      }

      const existingUser = await UserAccount.findOne({
        email: payload.email,
      });

      if (existingUser) {
        throw new BadRequestError("User account already exists", []);
      }

      const userAccount = new UserAccount({
        email: payload.email,
        password: payload.password,
        user_name: user_name || payload.email.split("@")[0],
        user_type_id: userType._id,
        is_active: true,
        registration_date: new Date(),
      });

      await userAccount.save();

      const roleType = AuthController.mapUserTypeToRoleType(user_type_name);
      const userRole = new UserRole({
        user_id: userAccount._id,
        role_type: roleType,
        status: "approved",
        is_active: true,
        role_specific_data: role_specific_data || {},
      });

      await userRole.save();

      console.log(`✅ [Auth]: User created successfully: ${payload.email}`);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "User account created successfully",
        data: {
          user: {
            id: userAccount._id,
            email: userAccount.email,
            user_name: userAccount.user_name,
            first_name: userAccount.first_name,
            last_name: userAccount.last_name,
            user_type: userType.user_type_name,
          },
          roles: [
            {
              id: userRole._id,
              role_type: userRole.role_type,
              is_active: true,
              status: "approved",
            },
          ],
          active_role: {
            id: userRole._id,
            role_type: userRole.role_type,
          },
          token: (userAccount as any).generateJWT(),
        },
      });
    } catch (error) {
      console.error(`❌ [Auth]: Signup error:`, error);
      throw error;
    }
  }

  public static async getUserTypes(req: Request, res: Response) {
    const userTypes = await UserType.find({});
    res.status(StatusCodes.OK).json({
      success: true,
      data: userTypes,
    });
  }

  public static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user as any;

      if (!currentUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated", []);
      }

      const user = await UserAccount.findById(currentUser._id);
      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found", []);
      }

      const userType = await UserType.findById(user.user_type_id);
      const userRoles = await UserRole.find({
        user_id: user._id,
        status: "approved",
      });

      const activeRole = userRoles.find((r) => r.is_active);

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            user_name: user.user_name,
            first_name: user.first_name,
            last_name: user.last_name,
            user_image: user.user_image,
            user_type: userType?.user_type_name,
          },
          roles: userRoles.map((r) => ({
            id: r._id,
            role_type: r.role_type,
            is_active: r.is_active,
            status: r.status,
          })),
          active_role: activeRole
            ? {
                id: activeRole._id,
                role_type: activeRole.role_type,
              }
            : null,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public static async applyForRole(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user as any;
      const { role_type } = req.body;
      const submitted_data = req.body.submitted_data || req.body.role_specific_data || {};

      if (!currentUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated", []);
      }

      const validRoles: RoleType[] = ["job_seeker", "hr_recruiter", "admin"];
      if (!validRoles.includes(role_type)) {
        throw new BadRequestError(`Invalid role type: ${role_type}`, []);
      }

      AuthController.validateRoleApplicationData(role_type, submitted_data);

      const existingRole = await UserRole.findOne({
        user_id: currentUser._id,
        role_type: role_type,
      });

      if (existingRole && existingRole.status !== "rejected") {
        throw new BadRequestError(`You already have this role: ${role_type}`, []);
      }

      const pendingApproval = await RoleApproval.findOne({
        user_id: currentUser._id,
        role_type: role_type,
        status: "pending",
      });

      if (pendingApproval) {
        throw new BadRequestError(`You already have a pending approval for this role`, []);
      }

      const approval = new RoleApproval({
        user_id: currentUser._id,
        role_type: role_type,
        submitted_data: submitted_data || {},
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await approval.save();

      if (existingRole?.status === "rejected") {
        existingRole.status = "pending";
        existingRole.is_active = false;
        existingRole.role_specific_data = submitted_data || {};
        existingRole.rejection_reason = undefined;
        await existingRole.save();
      } else {
        const pendingRole = new UserRole({
          user_id: currentUser._id,
          role_type: role_type,
          status: "pending",
          is_active: false,
          role_specific_data: submitted_data || {},
        });

        await pendingRole.save();
      }

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Role application submitted successfully. Waiting for admin approval.",
        data: {
          approval_id: approval._id,
          role_type: role_type,
          status: "pending",
          created_at: approval.created_at || (approval as any).createdAt,
          expires_at: approval.expires_at,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public static async switchRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role_type } = req.body;
      const currentUser = req.user as any;

      if (!currentUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated", []);
      }

      const targetRole = await UserRole.findOne({
        user_id: currentUser._id,
        role_type: role_type,
        status: "approved",
      });

      if (!targetRole) {
        throw new BadRequestError(
          `You don't have an approved role: ${role_type}. Please apply for this role first.`,
          []
        );
      }

      await UserRole.updateMany(
        { user_id: currentUser._id },
        { is_active: false }
      );

      targetRole.is_active = true;
      await targetRole.save();

      const userType = await UserType.findOne({ user_type_name: role_type });
      if (userType) {
        await UserAccount.findByIdAndUpdate(currentUser._id, {
          user_type_id: userType._id,
        });
      }

      const userRoles = await UserRole.find({
        user_id: currentUser._id,
        status: "approved",
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Role switched successfully",
        data: {
          active_role: {
            id: targetRole._id,
            role_type: targetRole.role_type,
          },
          roles: userRoles.map((r) => ({
            id: r._id,
            role_type: r.role_type,
            is_active: r.is_active,
            status: r.status,
          })),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getMyRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user as any;

      if (!currentUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated", []);
      }

      const userRoles = await UserRole.find({
        user_id: currentUser._id,
      }).sort({ created_at: -1, createdAt: -1 });

      const pendingApprovals = await RoleApproval.find({
        user_id: currentUser._id,
        status: "pending",
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          roles: userRoles.map((r) => ({
            id: r._id,
            role_type: r.role_type,
            is_active: r.is_active,
            status: r.status,
            role_specific_data: r.role_specific_data,
            created_at: r.created_at,
          })),
          pending_approvals: pendingApprovals.map((a) => ({
            id: a._id,
            role_type: a.role_type,
            status: a.status,
            created_at: a.created_at,
            expires_at: a.expires_at,
          })),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getMyRoleApprovals(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user as any;

      if (!currentUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated", []);
      }

      const approvals = await RoleApproval.find({
        user_id: currentUser._id,
      })
        .sort({ created_at: -1, createdAt: -1 })
        .populate("reviewed_by", "email");

      res.status(StatusCodes.OK).json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      throw error;
    }
  }

  private static mapUserTypeToRoleType(userTypeName: string): RoleType {
    const mapping: Record<string, RoleType> = {
      job_seeker: "job_seeker",
      hr_recruiter: "hr_recruiter",
      admin: "admin",
      freelancer: "job_seeker",
      company_user: "hr_recruiter",
    };
    return mapping[userTypeName] || "job_seeker";
  }

  private static validateRoleApplicationData(roleType: RoleType, submittedData: any) {
    const reason = typeof submittedData?.application_reason === "string"
      ? submittedData.application_reason.trim()
      : "";

    if (reason.length < 10) {
      throw new BadRequestError("请填写至少 10 个字的角色申请原因", []);
    }

    if (roleType === "job_seeker") {
      const skills = Array.isArray(submittedData?.skills)
        ? submittedData.skills.filter((skill: unknown) => typeof skill === "string" && skill.trim().length > 0)
        : [];
      const summary = typeof submittedData?.professional_summary === "string"
        ? submittedData.professional_summary.trim()
        : "";

      if (skills.length === 0 && summary.length < 10) {
        throw new BadRequestError("申请顾问/求职者角色时，请填写至少 1 项技能或 10 个字以上的经验说明", []);
      }
    }

    if (roleType === "hr_recruiter") {
      const companyName = typeof submittedData?.company_name === "string"
        ? submittedData.company_name.trim()
        : "";
      const position = typeof submittedData?.position === "string"
        ? submittedData.position.trim()
        : "";

      if (companyName.length < 2 || position.length < 2) {
        throw new BadRequestError("申请企业/HR角色时，请填写公司名称和岗位/职能", []);
      }
    }
  }
}
