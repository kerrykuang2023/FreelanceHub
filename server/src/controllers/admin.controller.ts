import { Request, Response } from "express";
import Company from "../models/company-profile/company.model";
import UserAccount from "../models/user/user-account.model";
import FreelancerInvoice from "../models/freelancer/freelancer_invoice.model";
import WorkLog from "../models/freelancer/work_log.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import SkillCategory from "../models/freelancer/skill_category.model";
import SkillSubCategory from "../models/freelancer/skill_sub_category.model";
import SystemConfig, { SYSTEM_CONFIG_TYPES } from "../models/system-config.model";
import RoleApproval from "../models/user/role-approval.model";
import UserRole from "../models/user/user-role.model";
import NotificationService from "../services/notification.service";
import { StatusCodes } from "http-status-codes";

export default class AdminController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, user_type, status, search } = req.query;
      const query: any = {};

      if (user_type && user_type !== "all") {
        query.user_type = user_type;
      }
      if (status && status !== "all") {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { user_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        UserAccount.find(query)
          .select("-password")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        UserAccount.countDocuments(query)
      ]);

      res.json({
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  static async updateUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await UserAccount.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ data: user });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
    }
  }

  static async getDashboardStats(req: Request, res: Response) {
    try {
      const [
        totalUsers,
        totalFreelancers,
        totalCompanies,
        totalProjects,
        totalWorkLogs,
        totalInvoices,
        pendingCompanies,
        pendingInvoices
      ] = await Promise.all([
        UserAccount.countDocuments(),
        FreelancerProfile.countDocuments(),
        Company.countDocuments(),
        ProjectRequirement.countDocuments(),
        WorkLog.countDocuments(),
        FreelancerInvoice.countDocuments(),
        Company.countDocuments({ verification_status: "pending" }),
        FreelancerInvoice.countDocuments({ status: "pending" })
      ]);

      const recentWorkLogs = await WorkLog.find()
        .sort({ created_at: -1 })
        .limit(5)
        .populate("freelancer_id", "freelancer_name")
        .populate("company_id", "company_name");

      const recentInvoices = await FreelancerInvoice.find()
        .sort({ created_at: -1 })
        .limit(5)
        .populate("freelancer_id")
        .populate("company_id", "company_name");

      res.json({
        data: {
          stats: {
            totalUsers,
            totalFreelancers,
            totalCompanies,
            totalProjects,
            totalWorkLogs,
            totalInvoices,
            pendingCompanies,
            pendingInvoices
          },
          recentWorkLogs,
          recentInvoices
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  }

  static async getAllCompanies(req: Request, res: Response) {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      const query: any = {};

      if (status) {
        query.verification_status = status;
      }

      if (search) {
        query.company_name = { $regex: search, $options: "i" };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [companies, total] = await Promise.all([
        Company.find(query)
          .populate("created_by", "email")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Company.countDocuments(query)
      ]);

      res.json({
        data: companies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  }

  static async getCompanyById(req: Request, res: Response) {
    try {
      const company = await Company.findById(req.params.id)
        .populate("created_by", "email contact_number")
        .populate("business_stream_id");

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const relatedUsers = await UserAccount.find({ company_id: company._id });
      const relatedFreelancers = await FreelancerProfile.find({ company_id: company._id });

      res.json({
        data: {
          company,
          relatedUsers,
          relatedFreelancers
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company" });
    }
  }

  static async verifyCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const company = await Company.findByIdAndUpdate(
        id,
        {
          verification_status: status,
          verified_at: new Date(),
          verified_by: (req as any).user?.id,
          verification_reason: reason
        },
        { new: true }
      );

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json({ data: company });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify company" });
    }
  }

  static async getAllWorkLogs(req: Request, res: Response) {
    try {
      const { status, company_id, freelancer_id, start_date, end_date, page = 1, limit = 10 } = req.query;
      const query: any = {};

      if (status) query.status = status;
      if (company_id) query.company_id = company_id;
      if (freelancer_id) query.freelancer_id = freelancer_id;
      if (start_date || end_date) {
        query.work_date = {};
        if (start_date) query.work_date.$gte = new Date(start_date as string);
        if (end_date) query.work_date.$lte = new Date(end_date as string);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [workLogs, total] = await Promise.all([
        WorkLog.find(query)
          .populate("freelancer_id", "freelancer_name languages")
          .populate("company_id", "company_name")
          .populate("project_requirement_id", "project_title")
          .sort({ work_date: -1 })
          .skip(skip)
          .limit(Number(limit)),
        WorkLog.countDocuments(query)
      ]);

      res.json({
        data: workLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work logs" });
    }
  }

  static async getAllInvoices(req: Request, res: Response) {
    try {
      const { status, company_id, freelancer_id, start_date, end_date, page = 1, limit = 10 } = req.query;
      const query: any = {};

      if (status) query.status = status;
      if (company_id) query.company_id = company_id;
      if (freelancer_id) query.freelancer_id = freelancer_id;
      if (start_date || end_date) {
        query.billing_period_start = {};
        if (start_date) query.billing_period_start.$gte = new Date(start_date as string);
        if (end_date) query.billing_period_start.$lte = new Date(end_date as string);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [invoices, total] = await Promise.all([
        FreelancerInvoice.find(query)
          .populate("freelancer_id", "freelancer_name")
          .populate("company_id", "company_name")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        FreelancerInvoice.countDocuments(query)
      ]);

      res.json({
        data: invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  }

  static async getAllProjects(req: Request, res: Response) {
    try {
      const { status, company_id, page = 1, limit = 10 } = req.query;
      const query: any = {};

      if (status) query.status = status;
      if (company_id) query.company_id = company_id;

      const skip = (Number(page) - 1) * Number(limit);

      const [projects, total] = await Promise.all([
        ProjectRequirement.find(query)
          .populate("company_id", "company_name")
          .populate("project_major_categories", "category_name")
          .populate("project_sub_categories", "sub_category_name")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        ProjectRequirement.countDocuments(query)
      ]);

      res.json({
        data: projects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  }

  static async getSkillCategories(req: Request, res: Response) {
    try {
      const categories = await SkillCategory.find()
        .sort({ display_order: 1 });

      const categoriesWithSub = await Promise.all(
        categories.map(async (cat) => {
          const subCategories = await SkillSubCategory.find({ category_id: cat._id });
          return {
            ...cat.toObject(),
            sub_categories: subCategories
          };
        })
      );

      res.json({ data: categoriesWithSub });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skill categories" });
    }
  }

  static async createSkillCategory(req: Request, res: Response) {
    try {
      const { category_name, category_code, display_order, description } = req.body;

      const category = new SkillCategory({
        category_name,
        category_code,
        display_order,
        description
      });

      await category.save();
      res.status(201).json({ data: category });
    } catch (error) {
      res.status(500).json({ error: "Failed to create skill category" });
    }
  }

  static async updateSkillCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { category_name, category_code, display_order, description } = req.body;

      const category = await SkillCategory.findByIdAndUpdate(
        id,
        { category_name, category_code, display_order, description },
        { new: true }
      );

      if (!category) {
        return res.status(404).json({ error: "Skill category not found" });
      }

      res.json({ data: category });
    } catch (error) {
      res.status(500).json({ error: "Failed to update skill category" });
    }
  }

  static async deleteSkillCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await SkillSubCategory.deleteMany({ category_id: id });
      await SkillCategory.findByIdAndDelete(id);

      res.json({ message: "Skill category deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete skill category" });
    }
  }

  static async createSubCategory(req: Request, res: Response) {
    try {
      const { category_id, sub_category_name, sub_category_code, display_order } = req.body;

      const subCategory = new SkillSubCategory({
        category_id,
        sub_category_name,
        sub_category_code,
        display_order
      });

      await subCategory.save();
      res.status(201).json({ data: subCategory });
    } catch (error) {
      res.status(500).json({ error: "Failed to create sub category" });
    }
  }

  static async getAllFreelancers(req: Request, res: Response) {
    try {
      const { skill_category, availability, page = 1, limit = 10 } = req.query;
      const query: any = {};

      if (skill_category) {
        query.skill_category_ids = skill_category;
      }
      if (availability) {
        query.availability_status = availability;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [freelancers, total] = await Promise.all([
        FreelancerProfile.find(query)
          .populate("user_id", "email contact_number")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        FreelancerProfile.countDocuments(query)
      ]);

      res.json({
        data: freelancers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch freelancers" });
    }
  }

  static async getFinancialSummary(req: Request, res: Response) {
    try {
      const { start_date, end_date } = req.query;
      const dateQuery: any = {};

      if (start_date || end_date) {
        dateQuery.created_at = {};
        if (start_date) dateQuery.created_at.$gte = new Date(start_date as string);
        if (end_date) dateQuery.created_at.$lte = new Date(end_date as string);
      }

      const invoices = await FreelancerInvoice.find(dateQuery);

      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalTaxAmount = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);

      const statusBreakdown = {
        draft: await FreelancerInvoice.countDocuments({ ...dateQuery, status: "draft" }),
        submitted: await FreelancerInvoice.countDocuments({ ...dateQuery, status: "submitted" }),
        approved: await FreelancerInvoice.countDocuments({ ...dateQuery, status: "approved" }),
        paid: await FreelancerInvoice.countDocuments({ ...dateQuery, status: "paid" }),
        cancelled: await FreelancerInvoice.countDocuments({ ...dateQuery, status: "cancelled" })
      };

      res.json({
        data: {
          totalAmount,
          totalTaxAmount,
          invoiceCount: invoices.length,
          statusBreakdown
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch financial summary" });
    }
  }

  static async getConfigTypes(req: Request, res: Response) {
    try {
      const types = Object.entries(SYSTEM_CONFIG_TYPES).map(([key, value]) => ({
        key,
        value,
        label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      }));
      res.json({ data: types });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch config types" });
    }
  }

  static async getSystemConfigs(req: Request, res: Response) {
    try {
      const { config_type, is_active } = req.query;
      const query: any = {};

      if (config_type) {
        query.config_type = config_type;
      }
      if (is_active !== undefined) {
        query.is_active = is_active === "true";
      }

      const configs = await SystemConfig.find(query)
        .sort({ config_type: 1, display_order: 1 });

      res.json({ data: configs });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system configs" });
    }
  }

  static async createSystemConfig(req: Request, res: Response) {
    try {
      const { config_type, config_key, config_value, display_name, description, display_order, is_active, metadata } = req.body;

      const existingConfig = await SystemConfig.findOne({ config_type, config_key });
      if (existingConfig) {
        return res.status(400).json({ error: "Config with this type and key already exists" });
      }

      const config = new SystemConfig({
        config_type,
        config_key,
        config_value,
        display_name,
        description,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        metadata
      });

      await config.save();
      res.status(201).json({ data: config });
    } catch (error) {
      res.status(500).json({ error: "Failed to create system config" });
    }
  }

  static async updateSystemConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const config = await SystemConfig.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!config) {
        return res.status(404).json({ error: "System config not found" });
      }

      res.json({ data: config });
    } catch (error) {
      res.status(500).json({ error: "Failed to update system config" });
    }
  }

  static async deleteSystemConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const config = await SystemConfig.findByIdAndDelete(id);

      if (!config) {
        return res.status(404).json({ error: "System config not found" });
      }

      res.json({ message: "System config deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete system config" });
    }
  }

  static async initializeDefaultConfigs(req: Request, res: Response) {
    try {
      const defaults = [
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "sap", config_value: "SAP", display_name: "SAP", description: "SAP技能体系", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "erp", config_value: "ERP", display_name: "ERP", description: "ERP技能体系", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "crm", config_value: "CRM", display_name: "CRM", description: "CRM技能体系", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "java", config_value: "JAVA", display_name: "JAVA", description: "JAVA开发技能", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "python", config_value: "Python", display_name: "Python", description: "Python开发技能", display_order: 5 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "javascript", config_value: "JavaScript", display_name: "JavaScript", description: "JavaScript开发技能", display_order: 6 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "cloud", config_value: "Cloud", display_name: "Cloud", description: "云计算技能", display_order: 7 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "devops", config_value: "DevOps", display_name: "DevOps", description: "DevOps技能", display_order: 8 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "database", config_value: "Database", display_name: "Database", description: "数据库技能", display_order: 9 },
        { config_type: SYSTEM_CONFIG_TYPES.SKILL_CATEGORY, config_key: "project_management", config_value: "项目管理", display_name: "项目管理", description: "项目管理技能", display_order: 10 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "remote", config_value: "remote", display_name: "远程工作", description: "通过远程方式完成的工作", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "onsite", config_value: "onsite", display_name: "现场开发", description: "在客户现场进行开发工作", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "meeting", config_value: "meeting", display_name: "会议", description: "参加各类会议", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "training", config_value: "training", display_name: "培训", description: "培训相关工作", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "travel", config_value: "travel", display_name: "出差", description: "出差相关工作", display_order: 5 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "code_review", config_value: "code_review", display_name: "代码评审", description: "代码评审工作", display_order: 6 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "bug_fix", config_value: "bug_fix", display_name: "问题修复", description: "修复问题的工作", display_order: 7 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "requirement", config_value: "requirement", display_name: "需求分析", description: "需求分析工作", display_order: 8 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "documentation", config_value: "documentation", display_name: "文档编写", description: "编写文档的工作", display_order: 9 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "testing", config_value: "testing", display_name: "测试", description: "测试相关工作", display_order: 10 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "deployment", config_value: "deployment", display_name: "部署", description: "部署相关工作", display_order: 11 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: "other", config_value: "other", display_name: "其他", description: "其他工作类型", display_order: 12 },
        { config_type: SYSTEM_CONFIG_TYPES.TAX_RATE, config_key: "vat_6", config_value: "6", display_name: "6%", description: "增值税 6% 税率", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.TAX_RATE, config_key: "vat_13", config_value: "13", display_name: "13%", description: "增值税 13% 税率", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: "CNY", config_value: "CNY", display_name: "人民币 (CNY)", description: "人民币货币", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: "USD", config_value: "USD", display_name: "美元 (USD)", description: "美元货币", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: "EUR", config_value: "EUR", display_name: "欧元 (EUR)", description: "欧元货币", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: "RUB", config_value: "RUB", display_name: "卢布 (RUB)", description: "俄罗斯卢布", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: "GBP", config_value: "GBP", display_name: "英镑 (GBP)", description: "英镑货币", display_order: 5 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "zh", config_value: "中文", display_name: "中文", description: "中文", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "en", config_value: "英语", display_name: "英语", description: "英语", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "ru", config_value: "俄语", display_name: "俄语", description: "俄语", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "ja", config_value: "日语", display_name: "日语", description: "日语", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "ko", config_value: "韩语", display_name: "韩语", description: "韩语", display_order: 5 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "fr", config_value: "法语", display_name: "法语", description: "法语", display_order: 6 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "de", config_value: "德语", display_name: "德语", description: "德语", display_order: 7 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "es", config_value: "西班牙语", display_name: "西班牙语", description: "西班牙语", display_order: 8 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "pt", config_value: "葡萄牙语", display_name: "葡萄牙语", description: "葡萄牙语", display_order: 9 },
        { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE, config_key: "ar", config_value: "阿拉伯语", display_name: "阿拉伯语", description: "阿拉伯语", display_order: 10 },
        { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: "fulltime", config_value: "全职", display_name: "全职", description: "全职工作", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: "parttime", config_value: "兼职", display_name: "兼职", description: "兼职工作", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: "freelancer", config_value: "自由顾问", display_name: "自由顾问", description: "自由顾问", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: "intern", config_value: "实习", display_name: "实习", description: "实习", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: "remote", config_value: "远程", display_name: "远程", description: "远程工作", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: "onsite", config_value: "现场", display_name: "现场", description: "需要到现场", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: "hybrid", config_value: "混合", display_name: "混合", description: "混合模式", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: "negotiable", config_value: "待面试", display_name: "待面试", description: "薪资待面试确定", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: "daily", config_value: "日薪", display_name: "日薪", description: "按日计薪", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: "monthly", config_value: "月薪", display_name: "月薪", description: "按月计薪", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: "yearly", config_value: "年薪", display_name: "年薪", description: "按年计薪", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: "project", config_value: "项目总价", display_name: "项目总价", description: "按项目总价", display_order: 5 },
        { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: "vat_special", config_value: "增值税专用发票", display_name: "增值税专用发票", description: "增值税专用发票", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: "vat_normal", config_value: "增值税普通发票", display_name: "增值税普通发票", description: "增值税普通发票", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: "personal", config_value: "个人发票", display_name: "个人发票", description: "个人发票", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: "service", config_value: "服务费发票", display_name: "服务费发票", description: "服务费发票", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: "bank_transfer", config_value: "银行转账", display_name: "银行转账", description: "通过银行转账付款", display_order: 1 },
        { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: "alipay", config_value: "支付宝", display_name: "支付宝", description: "通过支付宝付款", display_order: 2 },
        { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: "wechat", config_value: "微信支付", display_name: "微信支付", description: "通过微信付款", display_order: 3 },
        { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: "cheque", config_value: "支票", display_name: "支票", description: "通过支票付款", display_order: 4 },
        { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: "cash", config_value: "现金", display_name: "现金", description: "现金付款", display_order: 5 },
        { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: "other", config_value: "其他", display_name: "其他", description: "其他付款方式", display_order: 6 },
      ];

      const results: any[] = [];
      for (const defaultConfig of defaults) {
        const existing = await SystemConfig.findOne({
          config_type: defaultConfig.config_type,
          config_key: defaultConfig.config_key
        });
        if (!existing) {
          const config = new SystemConfig(defaultConfig);
          await config.save();
          results.push(config);
        }
      }

      res.json({
        data: {
          message: `Initialized ${results.length} default configs`,
          configs: results
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize default configs" });
    }
  }

  static async getRoleApprovals(req: Request, res: Response) {
    try {
      const { status, role_type, page = 1, limit = 10 } = req.query;
      const query: any = {};

      if (status) {
        query.status = status;
      }
      if (role_type) {
        query.role_type = role_type;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [approvals, total] = await Promise.all([
        RoleApproval.find(query)
          .populate("user_id", "email first_name last_name")
          .populate("reviewed_by", "email")
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit)),
        RoleApproval.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: approvals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role approvals" });
    }
  }

  static async getRoleApprovalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approval = await RoleApproval.findById(id)
        .populate("user_id", "email first_name last_name user_image")
        .populate("reviewed_by", "email");

      if (!approval) {
        return res.status(404).json({ error: "Role approval not found" });
      }

      res.json({ success: true, data: approval });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role approval" });
    }
  }

  static async approveRoleApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { review_notes } = req.body;
      const adminUser = (req as any).user;

      const approval = await RoleApproval.findById(id);
      if (!approval) {
        return res.status(404).json({ error: "Role approval not found" });
      }

      if (approval.status !== "pending") {
        return res.status(400).json({ error: "This application has already been processed" });
      }

      approval.status = "approved";
      approval.reviewed_by = adminUser._id;
      approval.reviewed_at = new Date();
      approval.review_notes = review_notes;
      await approval.save();

      const userRole = await UserRole.findOne({
        user_id: approval.user_id,
        role_type: approval.role_type,
        status: "pending"
      });

      if (userRole) {
        userRole.status = "approved";
        userRole.approved_by = adminUser._id;
        userRole.approved_at = new Date();
        await userRole.save();
      }

      await NotificationService.notifyRoleApprovalApproved(
        approval.user_id.toString(),
        approval.role_type
      );

      res.json({
        success: true,
        message: "Role application approved successfully",
        data: approval
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to approve role application" });
    }
  }

  static async rejectRoleApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rejection_reason, review_notes } = req.body;
      const adminUser = (req as any).user;

      if (!rejection_reason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      const approval = await RoleApproval.findById(id);
      if (!approval) {
        return res.status(404).json({ error: "Role approval not found" });
      }

      if (approval.status !== "pending") {
        return res.status(400).json({ error: "This application has already been processed" });
      }

      approval.status = "rejected";
      approval.reviewed_by = adminUser._id;
      approval.reviewed_at = new Date();
      approval.rejection_reason = rejection_reason;
      approval.review_notes = review_notes;
      await approval.save();

      const userRole = await UserRole.findOne({
        user_id: approval.user_id,
        role_type: approval.role_type,
        status: "pending"
      });

      if (userRole) {
        userRole.status = "rejected";
        userRole.rejection_reason = rejection_reason;
        await userRole.save();
      }

      await NotificationService.notifyRoleApprovalRejected(
        approval.user_id.toString(),
        approval.role_type,
        rejection_reason
      );

      res.json({
        success: true,
        message: "Role application rejected",
        data: approval
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to reject role application" });
    }
  }

  static async getApprovalStats(req: Request, res: Response) {
    try {
      const stats = await RoleApproval.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      const roleStats = await RoleApproval.aggregate([
        {
          $group: {
            _id: {
              status: "$status",
              role_type: "$role_type"
            },
            count: { $sum: 1 }
          }
        }
      ]);

      const totalPending = await RoleApproval.countDocuments({ status: "pending" });
      const totalApproved = await RoleApproval.countDocuments({ status: "approved" });
      const totalRejected = await RoleApproval.countDocuments({ status: "rejected" });

      res.json({
        success: true,
        data: {
          byStatus: stats,
          byRoleAndStatus: roleStats,
          summary: {
            totalPending,
            totalApproved,
            totalRejected,
            total: totalPending + totalApproved + totalRejected
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approval stats" });
    }
  }
}