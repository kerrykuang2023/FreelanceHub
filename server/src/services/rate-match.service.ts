import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";

export interface RateMatchInput {
  userRate: {
    daily?: number;
    monthly?: number;
    hourly?: number;
    currency: string;
  };
  projectBudget: {
    min?: number;
    max?: number;
    currency: string;
    rateType: '待面试' | '日薪' | '月薪' | '年薪' | '项目总价';
  };
}

export interface RateMatchResult {
  score: number;
  matchType: 'within_budget' | 'slightly_over' | 'over_budget' | 'unknown';
  details: {
    userRate: number;
    userRateType: string;
    projectBudgetMin: number;
    projectBudgetMax: number;
    currencyMatch: boolean;
  };
}

const CURRENCY_RATES: Record<string, number> = {
  CNY: 1,
  USD: 7.2,
  EUR: 7.8,
  RUB: 0.08,
  GBP: 9.1,
};

class RateMatchService {
  private static INSTANCE: RateMatchService;

  public static getInstance(): RateMatchService {
    if (!RateMatchService.INSTANCE) {
      RateMatchService.INSTANCE = new RateMatchService();
    }
    return RateMatchService.INSTANCE;
  }

  private convertToCNY(amount: number, fromCurrency: string): number {
    const rate = CURRENCY_RATES[fromCurrency] || 1;
    return amount * rate;
  }

  private getComparableRate(
    userRate: { daily?: number; monthly?: number; hourly?: number },
    projectRateType: string
  ): { rate: number; rateType: string } {
    if (projectRateType === '日薪' && userRate.daily) {
      return { rate: userRate.daily, rateType: 'daily' };
    }
    if (projectRateType === '月薪' && userRate.monthly) {
      return { rate: userRate.monthly, rateType: 'monthly' };
    }
    if (projectRateType === '时薪' && userRate.hourly) {
      return { rate: userRate.hourly, rateType: 'hourly' };
    }
    if (userRate.daily) {
      return { rate: userRate.daily, rateType: 'daily' };
    }
    if (userRate.monthly) {
      return { rate: userRate.monthly / 22, rateType: 'daily' };
    }
    if (userRate.hourly) {
      return { rate: userRate.hourly * 8, rateType: 'daily' };
    }
    return { rate: 0, rateType: 'unknown' };
  }

  public calculateRateMatch(input: RateMatchInput): RateMatchResult {
    const { userRate, projectBudget } = input;

    if (projectBudget.rateType === '待面试') {
      return {
        score: 50,
        matchType: 'unknown',
        details: {
          userRate: 0,
          userRateType: 'unknown',
          projectBudgetMin: projectBudget.min || 0,
          projectBudgetMax: projectBudget.max || 0,
          currencyMatch: false,
        },
      };
    }

    const comparableUserRate = this.getComparableRate(userRate, projectBudget.rateType);
    const userRateInCNY = this.convertToCNY(comparableUserRate.rate, userRate.currency);
    const budgetMinInCNY = projectBudget.min ? this.convertToCNY(projectBudget.min, projectBudget.currency) : 0;
    const budgetMaxInCNY = projectBudget.max ? this.convertToCNY(projectBudget.max, projectBudget.currency) : 0;

    if (userRateInCNY === 0 || (budgetMinInCNY === 0 && budgetMaxInCNY === 0)) {
      return {
        score: 50,
        matchType: 'unknown',
        details: {
          userRate: comparableUserRate.rate,
          userRateType: comparableUserRate.rateType,
          projectBudgetMin: projectBudget.min || 0,
          projectBudgetMax: projectBudget.max || 0,
          currencyMatch: userRate.currency === projectBudget.currency,
        },
      };
    }

    if (budgetMaxInCNY > 0 && userRateInCNY <= budgetMaxInCNY) {
      return {
        score: 100,
        matchType: 'within_budget',
        details: {
          userRate: comparableUserRate.rate,
          userRateType: comparableUserRate.rateType,
          projectBudgetMin: projectBudget.min || 0,
          projectBudgetMax: projectBudget.max || 0,
          currencyMatch: userRate.currency === projectBudget.currency,
        },
      };
    }

    const overBudgetPercent = budgetMaxInCNY > 0 
      ? ((userRateInCNY - budgetMaxInCNY) / budgetMaxInCNY) * 100 
      : 0;

    if (overBudgetPercent <= 10) {
      return {
        score: 80,
        matchType: 'slightly_over',
        details: {
          userRate: comparableUserRate.rate,
          userRateType: comparableUserRate.rateType,
          projectBudgetMin: projectBudget.min || 0,
          projectBudgetMax: projectBudget.max || 0,
          currencyMatch: userRate.currency === projectBudget.currency,
        },
      };
    }

    return {
      score: 50,
      matchType: 'over_budget',
      details: {
        userRate: comparableUserRate.rate,
        userRateType: comparableUserRate.rateType,
        projectBudgetMin: projectBudget.min || 0,
        projectBudgetMax: projectBudget.max || 0,
        currencyMatch: userRate.currency === projectBudget.currency,
      },
    };
  }

  public async calculateRateMatchForFreelancer(
    freelancerId: string,
    projectId: string
  ): Promise<RateMatchResult> {
    const freelancer = await FreelancerProfile.findById(freelancerId);
    if (!freelancer) {
      throw new Error(`Freelancer profile not found: ${freelancerId}`);
    }

    const project = await ProjectRequirement.findById(projectId);
    if (!project) {
      throw new Error(`Project requirement not found: ${projectId}`);
    }

    const userRate = {
      daily: freelancer.daily_rate ?? undefined,
      monthly: freelancer.monthly_rate ?? undefined,
      hourly: freelancer.hourly_rate ?? undefined,
      currency: freelancer.preferred_currency || 'CNY',
    };

    const projectBudget = {
      min: project.budget_range?.min ?? undefined,
      max: project.budget_range?.max ?? undefined,
      currency: project.budget_range?.currency || project.rate_currency || 'CNY',
      rateType: project.rate_type as any,
    };

    return this.calculateRateMatch({ userRate, projectBudget });
  }
}

export default RateMatchService.getInstance();
