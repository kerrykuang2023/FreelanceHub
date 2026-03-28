import { Router } from "express";
import SkillCategoryController from "../controllers/skill-category.controller";
import { asyncWrapper } from "../helpers/async-wrapper";

export default class SkillCategoryRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Public routes (no authentication required)
    this.router.get("/categories", asyncWrapper(SkillCategoryController.getAllCategories));
    this.router.get("/categories/tree", asyncWrapper(SkillCategoryController.getCategoryTree));
    this.router.get("/categories/:categoryId/sub-categories", asyncWrapper(SkillCategoryController.getSubCategoriesByCategory));

    // Admin routes (authentication required - will be added later)
    this.router.post("/categories", asyncWrapper(SkillCategoryController.createCategory));
    this.router.put("/categories/:id", asyncWrapper(SkillCategoryController.updateCategory));
    this.router.delete("/categories/:id", asyncWrapper(SkillCategoryController.deleteCategory));
    this.router.patch("/categories/:id/toggle", asyncWrapper(SkillCategoryController.toggleCategory));

    this.router.post("/sub-categories", asyncWrapper(SkillCategoryController.createSubCategory));
    this.router.put("/sub-categories/:id", asyncWrapper(SkillCategoryController.updateSubCategory));
    this.router.delete("/sub-categories/:id", asyncWrapper(SkillCategoryController.deleteSubCategory));
    this.router.patch("/sub-categories/:id/toggle", asyncWrapper(SkillCategoryController.toggleSubCategory));
  }
}