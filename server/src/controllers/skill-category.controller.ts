import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import SkillCategory from "../models/freelancer/skill_category.model";
import SkillSubCategory from "../models/freelancer/skill_sub_category.model";
import { BadRequestError, NotFoundError } from "../errors";

export default class SkillCategoryController {
  public static async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await SkillCategory.find({ is_active: true })
        .sort({ display_order: 1, created_at: -1 });
      res.status(StatusCodes.OK).json(categories);
    } catch (error) {
      next(error);
    }
  }

  public static async getCategoryTree(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await SkillCategory.find({ is_active: true })
        .sort({ display_order: 1 });

      const subCategories = await SkillSubCategory.find({ is_active: true })
        .sort({ display_order: 1 });

      const tree = categories.map(category => ({
        _id: category._id,
        category_name: category.category_name,
        category_code: category.category_code,
        category_icon: category.category_icon,
        description: category.description,
        display_order: category.display_order,
        sub_categories: subCategories
          .filter(sub => sub.category_id.toString() === category._id.toString())
          .map(sub => ({
            _id: sub._id,
            sub_category_name: sub.sub_category_name,
            sub_category_code: sub.sub_category_code,
            description: sub.description,
            display_order: sub.display_order,
            tags: sub.tags
          }))
      }));

      res.status(StatusCodes.OK).json(tree);
    } catch (error) {
      next(error);
    }
  }

  public static async getSubCategoriesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const subCategories = await SkillSubCategory.find({
        category_id: categoryId,
        is_active: true
      }).sort({ display_order: 1 });

      res.status(StatusCodes.OK).json(subCategories);
    } catch (error) {
      next(error);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category_name, category_code, category_icon, description, display_order } = req.body;

      const existingCategory = await SkillCategory.findOne({ category_code });
      if (existingCategory) {
        throw new BadRequestError("Category with this code already exists", []);
      }

      const category = new SkillCategory({
        category_name,
        category_code,
        category_icon,
        description,
        display_order: display_order || 0
      });

      await category.save();
      res.status(StatusCodes.CREATED).json(category);
    } catch (error) {
      next(error);
    }
  }

  public static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { category_name, category_code, category_icon, description, display_order, is_active } = req.body;

      const category = await SkillCategory.findById(id);
      if (!category) {
        throw new NotFoundError("Category not found", []);
      }

      if (category_code && category_code !== category.category_code) {
        const existingCategory = await SkillCategory.findOne({ category_code });
        if (existingCategory) {
          throw new BadRequestError("Category with this code already exists", []);
        }
      }

      category.category_name = category_name ?? category.category_name;
      category.category_code = category_code ?? category.category_code;
      category.category_icon = category_icon ?? category.category_icon;
      category.description = description ?? category.description;
      category.display_order = display_order ?? category.display_order;
      category.is_active = is_active ?? category.is_active;

      await category.save();
      res.status(StatusCodes.OK).json(category);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const subCategoriesCount = await SkillSubCategory.countDocuments({
        category_id: id,
        is_active: true
      });

      if (subCategoriesCount > 0) {
        throw new BadRequestError(
          `Cannot delete category with ${subCategoriesCount} active sub-categories. Please deactivate or delete them first.`,
          []
        );
      }

      await SkillCategory.findByIdAndDelete(id);
      res.status(StatusCodes.OK).json({ message: "Category deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const category = await SkillCategory.findById(id);
      if (!category) {
        throw new NotFoundError("Category not found", []);
      }

      category.is_active = !category.is_active;
      await category.save();

      res.status(StatusCodes.OK).json(category);
    } catch (error) {
      next(error);
    }
  }

  public static async createSubCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category_id, sub_category_name, sub_category_code, description, display_order, tags } = req.body;

      const category = await SkillCategory.findById(category_id);
      if (!category) {
        throw new NotFoundError("Parent category not found", []);
      }

      const existingSubCategory = await SkillSubCategory.findOne({
        category_id,
        sub_category_code
      });
      if (existingSubCategory) {
        throw new BadRequestError("Sub-category with this code already exists in this category", []);
      }

      const subCategory = new SkillSubCategory({
        category_id,
        sub_category_name,
        sub_category_code,
        description,
        display_order: display_order || 0,
        tags: tags || []
      });

      await subCategory.save();
      res.status(StatusCodes.CREATED).json(subCategory);
    } catch (error) {
      next(error);
    }
  }

  public static async updateSubCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { sub_category_name, sub_category_code, description, display_order, is_active, tags } = req.body;

      const subCategory = await SkillSubCategory.findById(id);
      if (!subCategory) {
        throw new NotFoundError("Sub-category not found", []);
      }

      if (sub_category_code && sub_category_code !== subCategory.sub_category_code) {
        const existingSubCategory = await SkillSubCategory.findOne({
          category_id: subCategory.category_id,
          sub_category_code
        });
        if (existingSubCategory) {
          throw new BadRequestError("Sub-category with this code already exists", []);
        }
      }

      subCategory.sub_category_name = sub_category_name ?? subCategory.sub_category_name;
      subCategory.sub_category_code = sub_category_code ?? subCategory.sub_category_code;
      subCategory.description = description ?? subCategory.description;
      subCategory.display_order = display_order ?? subCategory.display_order;
      subCategory.is_active = is_active ?? subCategory.is_active;
      subCategory.tags = tags ?? subCategory.tags;

      await subCategory.save();
      res.status(StatusCodes.OK).json(subCategory);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteSubCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await SkillSubCategory.findByIdAndDelete(id);
      res.status(StatusCodes.OK).json({ message: "Sub-category deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleSubCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const subCategory = await SkillSubCategory.findById(id);
      if (!subCategory) {
        throw new NotFoundError("Sub-category not found", []);
      }

      subCategory.is_active = !subCategory.is_active;
      await subCategory.save();

      res.status(StatusCodes.OK).json(subCategory);
    } catch (error) {
      next(error);
    }
  }
}