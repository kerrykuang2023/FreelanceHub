import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import SkillCategory from "../models/freelancer/skill_category.model";
import SkillSubCategory from "../models/freelancer/skill_sub_category.model";

export interface SkillMatchInput {
  userSkillCategoryIds: string[];
  userSkillSubCategoryIds: string[];
  primarySkillIds: string[];
  requiredSkillCategoryIds: string[];
  requiredSkillSubCategoryIds: string[];
}

export interface SkillMatchResult {
  score: number;
  matchedCategories: string[];
  matchedSubCategories: string[];
  unmatchedCategories: string[];
  unmatchedSubCategories: string[];
  primarySkillMatched: boolean;
  matchDetails: {
    categoryMatchRate: number;
    subCategoryMatchRate: number;
  };
}

class SkillMatchService {
  private static INSTANCE: SkillMatchService;

  public static getInstance(): SkillMatchService {
    if (!SkillMatchService.INSTANCE) {
      SkillMatchService.INSTANCE = new SkillMatchService();
    }
    return SkillMatchService.INSTANCE;
  }

  public async calculateSkillMatch(input: SkillMatchInput): Promise<SkillMatchResult> {
    const {
      userSkillCategoryIds,
      userSkillSubCategoryIds,
      primarySkillIds,
      requiredSkillCategoryIds,
      requiredSkillSubCategoryIds,
    } = input;

    const matchedCategories: string[] = [];
    const unmatchedCategories: string[] = [];
    const matchedSubCategories: string[] = [];
    const unmatchedSubCategories: string[] = [];

    for (const catId of requiredSkillCategoryIds) {
      if (userSkillCategoryIds.includes(catId)) {
        matchedCategories.push(catId);
      } else {
        unmatchedCategories.push(catId);
      }
    }

    for (const subId of requiredSkillSubCategoryIds) {
      if (userSkillSubCategoryIds.includes(subId)) {
        matchedSubCategories.push(subId);
      } else {
        unmatchedSubCategories.push(subId);
      }
    }

    const categoryMatchRate = requiredSkillCategoryIds.length > 0
      ? (matchedCategories.length / requiredSkillCategoryIds.length) * 100
      : 100;

    const subCategoryMatchRate = requiredSkillSubCategoryIds.length > 0
      ? (matchedSubCategories.length / requiredSkillSubCategoryIds.length) * 100
      : 100;

    let baseScore = 0;
    if (requiredSkillSubCategoryIds.length > 0) {
      baseScore = subCategoryMatchRate;
    } else if (requiredSkillCategoryIds.length > 0) {
      baseScore = categoryMatchRate;
    } else {
      baseScore = 100;
    }

    let primarySkillMatched = false;
    if (primarySkillIds && primarySkillIds.length > 0) {
      for (const primaryId of primarySkillIds) {
        if (requiredSkillSubCategoryIds.includes(primaryId) || requiredSkillCategoryIds.includes(primaryId)) {
          primarySkillMatched = true;
          break;
        }
      }
    }

    let finalScore = baseScore;
    if (primarySkillMatched) {
      finalScore = Math.min(100, finalScore + 20);
    }

    return {
      score: Math.round(finalScore),
      matchedCategories,
      matchedSubCategories,
      unmatchedCategories,
      unmatchedSubCategories,
      primarySkillMatched,
      matchDetails: {
        categoryMatchRate: Math.round(categoryMatchRate),
        subCategoryMatchRate: Math.round(subCategoryMatchRate),
      },
    };
  }

  public async calculateSkillMatchForFreelancer(
    freelancerId: string,
    projectId: string
  ): Promise<SkillMatchResult> {
    const freelancer = await FreelancerProfile.findById(freelancerId);
    if (!freelancer) {
      throw new Error(`Freelancer profile not found: ${freelancerId}`);
    }

    const project = await ProjectRequirement.findById(projectId);
    if (!project) {
      throw new Error(`Project requirement not found: ${projectId}`);
    }

    const userSkillCategoryIds = (freelancer.skill_category_ids || []).map((id: any) => id.toString());
    const userSkillSubCategoryIds = (freelancer.skill_sub_category_ids || []).map((id: any) => id.toString());
    const primarySkillIds = userSkillSubCategoryIds.slice(0, 3);
    const requiredSkillCategoryIds = (project.project_major_categories || []).map((id: any) => id.toString());
    const requiredSkillSubCategoryIds = (project.project_sub_categories || []).map((id: any) => id.toString());

    return this.calculateSkillMatch({
      userSkillCategoryIds,
      userSkillSubCategoryIds,
      primarySkillIds,
      requiredSkillCategoryIds,
      requiredSkillSubCategoryIds,
    });
  }

  public async getSkillNames(skillIds: string[]): Promise<{ categories: Map<string, string>; subCategories: Map<string, string> }> {
    const categories = new Map<string, string>();
    const subCategories = new Map<string, string>();

    const categoryDocs = await SkillCategory.find({ _id: { $in: skillIds } });
    for (const cat of categoryDocs) {
      categories.set(cat._id.toString(), cat.category_name || '');
    }

    const subCategoryDocs = await SkillSubCategory.find({ _id: { $in: skillIds } });
    for (const sub of subCategoryDocs) {
      subCategories.set(sub._id.toString(), sub.sub_category_name || '');
    }

    return { categories, subCategories };
  }
}

export default SkillMatchService.getInstance();
