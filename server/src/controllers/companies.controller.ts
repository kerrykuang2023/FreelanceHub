import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import Company from "../models/company-profile/company.model";
import UserAccount from "../models/user/user-account.model";
import { ApiError } from "../errors/ApiError";
import mongoose from "mongoose";
import { IAuthRequest } from "../types/user.interface";
import NotificationHelper from "../services/notification-helper.service";

export default class CompaniesController {
  public static async searchCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(StatusCodes.OK).json({
          items: [],
        });
      }
      
      const companies = await Company.find({
        $and: [
          { verification_status: "approved" },
          {
            $or: [
              { company_name: { $regex: q, $options: "i" } },
              { industry: { $regex: q, $options: "i" } },
            ],
          },
        ],
      })
        .select("company_name logo_url industry company_size description")
        .limit(20);
      
      res.status(StatusCodes.OK).json({
        items: companies,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async createCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const {
        company_name,
        industry,
        company_size,
        description,
        website,
        address,
        contact_phone,
      } = req.body;
      
      const existingCompany = await Company.findOne({ 
        company_name: { $regex: `^${company_name}$`, $options: "i" } 
      });
      
      if (existingCompany) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Company with this name already exists", []);
      }
      
      const company = new Company({
        company_name,
        industry,
        company_size,
        description,
        company_website_url: website,
        company_address: address,
        contact_phone,
        created_by: user._id,
        verification_status: "approved",
      });
      
      await company.save();
      
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: company,
        message: "Company created successfully",
      });
    } catch (error) {
      throw error;
    }
  }

  public static async uploadLogo(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid company ID", []);
      }
      
      const company = await Company.findById(id);
      
      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found", []);
      }
      
      if (company.created_by?.toString() !== user._id.toString()) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Not authorized to update this company", []);
      }
      
      if (!(req as any).file) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "No file uploaded", []);
      }
      
      company.logo_url = `/uploads/logos/${(req as any).file.filename}`;
      await company.save();
      
      res.status(StatusCodes.OK).json({
        success: true,
        url: company.logo_url,
        message: "Logo uploaded successfully",
      });
    } catch (error) {
      throw error;
    }
  }

  public static async uploadCover(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid company ID", []);
      }
      
      const company = await Company.findById(id);
      
      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found", []);
      }
      
      if (company.created_by?.toString() !== user._id.toString()) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Not authorized to update this company", []);
      }
      
      if (!(req as any).file) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "No file uploaded", []);
      }
      
      company.cover_image_url = `/uploads/covers/${(req as any).file.filename}`;
      await company.save();
      
      res.status(StatusCodes.OK).json({
        success: true,
        url: company.cover_image_url,
        message: "Cover image uploaded successfully",
      });
    } catch (error) {
      throw error;
    }
  }

  public static async setupCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const {
        company_name,
        company_type,
        business_license_number,
        legal_representative,
        registered_capital,
        establishment_date,
        company_address,
        contact_phone,
        company_website,
        business_scope,
      } = req.body;

      let company = await Company.findOne({ created_by: user._id });

      if (company) {
        company.company_name = company_name;
        (company as any).company_type = company_type;
        (company as any).business_license_number = business_license_number;
        (company as any).legal_representative = legal_representative;
        (company as any).registered_capital = registered_capital;
        company.establishment_date = establishment_date ? new Date(establishment_date) : undefined;
        (company as any).company_address = company_address;
        (company as any).contact_phone = contact_phone;
        company.company_website_url = company_website;
        (company as any).business_scope = business_scope;
        company.verification_status = "pending";
      } else {
        company = new Company({
          company_name,
          company_type,
          business_license_number,
          legal_representative,
          registered_capital,
          establishment_date: establishment_date ? new Date(establishment_date) : undefined,
          company_address,
          contact_phone,
          company_website_url: company_website,
          business_scope,
          created_by: user._id,
          verification_status: "pending",
        });
      }

      if ((req as any).file) {
        (company as any).license_file_url = `/uploads/licenses/${(req as any).file.filename}`;
      }

      await company.save();

      res.status(StatusCodes.OK).json({
        message: "Company information submitted successfully",
        company,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getMyCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;
      const userAccount = await UserAccount.findById(user._id);
      let company = null;

      if (userAccount?.company_id) {
        company = await Company.findById(userAccount.company_id);
      }

      if (!company) {
        company = await Company.findOne({ created_by: user._id });
      }

      if (!company) {
        return res.status(StatusCodes.OK).json({
          success: true,
          data: null,
          company: null,
        });
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: company,
        company,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid company ID", []);
      }

      const company = await Company.findById(id);

      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found", []);
      }

      res.status(StatusCodes.OK).json({ company });
    } catch (error) {
      throw error;
    }
  }

  public static async getPendingCompanies(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const companies = await Company.find({ verification_status: "pending" })
        .populate("created_by", "email user_name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Company.countDocuments({ verification_status: "pending" });

      res.status(StatusCodes.OK).json({
        companies,
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

  public static async approveCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as any;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid company ID", []);
      }

      const company = await Company.findById(id).populate("created_by");

      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found", []);
      }

      company.verification_status = "approved";
      company.verified_at = new Date();
      company.verified_by = user._id;
      await company.save();

      const companyUserId = (company.created_by as any)?._id;
      if (companyUserId) {
        await NotificationHelper.sendNotification({
          user_id: companyUserId.toString(),
          type: "system",
          title: "Company Verified",
          content: `Your company "${company.company_name}" has been verified successfully.`,
          link: `/company/${company._id}`,
        });
      }

      res.status(StatusCodes.OK).json({
        message: "Company approved successfully",
        company,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async rejectCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = req.user as any;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid company ID", []);
      }

      const company = await Company.findById(id).populate("created_by");

      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found", []);
      }

      company.verification_status = "rejected";
      company.verified_at = new Date();
      company.verified_by = user._id;
      company.verification_reason = reason;
      await company.save();

      const companyUserId = (company.created_by as any)?._id;
      if (companyUserId) {
        await NotificationHelper.sendNotification({
          user_id: companyUserId.toString(),
          type: "system",
          title: "Company Verification Rejected",
          content: `Your company "${company.company_name}" verification was rejected. Reason: ${reason || "Not specified"}`,
          link: `/company/setup`,
        });
      }

      res.status(StatusCodes.OK).json({
        message: "Company rejected",
        company,
      });
    } catch (error) {
      throw error;
    }
  }

  public static async updateCompany(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid company ID", []);
      }

      const company = await Company.findById(id);

      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found", []);
      }

      const userAccount = await UserAccount.findById(user._id);
      const isCompanyCreator = company.created_by?.toString() === user._id.toString();
      const isCompanyMember = userAccount?.company_id?.toString() === company._id.toString();

      if (!isCompanyCreator && !isCompanyMember) {
        throw new ApiError(StatusCodes.FORBIDDEN, "您只能编辑自己创建或已绑定的公司信息", []);
      }

      const allowedFields = [
        "company_name",
        "industry",
        "company_size",
        "profile_description",
        "description",
        "company_website_url",
        "company_address",
        "contact_phone",
        "contact_email",
      ];

      Object.keys(updateData).filter((key) => allowedFields.includes(key)).forEach((key) => {
        (company as any)[key] = updateData[key];
      });

      await company.save();

      res.status(StatusCodes.OK).json({
        success: true,
        message: "公司信息已保存",
        company,
      });
    } catch (error) {
      throw error;
    }
  }
}
