import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import SkillMatchService, { SkillMatchResult } from "./skill-match.service";
import LocationMatchService, { LocationMatchResult } from "./location-match.service";
import RateMatchService, { RateMatchResult } from "./rate-match.service";
import AvailabilityMatchService, { AvailabilityMatchResult } from "./availability-match.service";

export interface MatchScoreInput {
  freelancerId: string;
  projectId: string;
}

export interface MatchScoreResult {
  freelancerId: string;
  projectId: string;
  skillScore: number;
  locationScore: number;
  rateScore: number;
  availabilityScore: number;
  totalScore: number;
  breakdown: {
    skill: number;
    location: number;
    rate: number;
    availability: number;
  };
  details: {
    skill: SkillMatchResult;
    location: LocationMatchResult;
    rate: RateMatchResult;
    availability: AvailabilityMatchResult;
  };
}

export interface ProjectRecommendation {
  project: any;
  matchScore: MatchScoreResult;
}

const WEIGHTS = {
  skill: 0.4,
  location: 0.2,
  rate: 0.2,
  availability: 0.2,
};

class MatchScoreService {
  private static INSTANCE: MatchScoreService;
  private scoreCache: Map<string, { score: MatchScoreResult; timestamp: number }>;
  private cacheTTL: number = 60 * 60 * 1000;

  public static getInstance(): MatchScoreService {
    if (!MatchScoreService.INSTANCE) {
      MatchScoreService.INSTANCE = new MatchScoreService();
    }
    return MatchScoreService.INSTANCE;
  }

  constructor() {
    this.scoreCache = new Map();
  }

  private getCacheKey(freelancerId: string, projectId: string): string {
    return `${freelancerId}:${projectId}`;
  }

  private getFromCache(freelancerId: string, projectId: string): MatchScoreResult | null {
    const key = this.getCacheKey(freelancerId, projectId);
    const cached = this.scoreCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.score;
    }
    this.scoreCache.delete(key);
    return null;
  }

  private setCache(freelancerId: string, projectId: string, score: MatchScoreResult): void {
    const key = this.getCacheKey(freelancerId, projectId);
    this.scoreCache.set(key, { score, timestamp: Date.now() });
  }

  public async calculateMatchScore(input: MatchScoreInput): Promise<MatchScoreResult> {
    const { freelancerId, projectId } = input;

    const cached = this.getFromCache(freelancerId, projectId);
    if (cached) {
      return cached;
    }

    const [skillResult, locationResult, rateResult, availabilityResult] = await Promise.all([
      SkillMatchService.calculateSkillMatchForFreelancer(freelancerId, projectId),
      LocationMatchService.calculateLocationMatchForFreelancer(freelancerId, projectId),
      RateMatchService.calculateRateMatchForFreelancer(freelancerId, projectId),
      AvailabilityMatchService.calculateAvailabilityMatchForFreelancer(freelancerId, projectId),
    ]);

    const skillWeighted = skillResult.score * WEIGHTS.skill;
    const locationWeighted = locationResult.score * WEIGHTS.location;
    const rateWeighted = rateResult.score * WEIGHTS.rate;
    const availabilityWeighted = availabilityResult.score * WEIGHTS.availability;

    const totalScore = Math.round(skillWeighted + locationWeighted + rateWeighted + availabilityWeighted);

    const result: MatchScoreResult = {
      freelancerId,
      projectId,
      skillScore: skillResult.score,
      locationScore: locationResult.score,
      rateScore: rateResult.score,
      availabilityScore: availabilityResult.score,
      totalScore,
      breakdown: {
        skill: Math.round(skillWeighted),
        location: Math.round(locationWeighted),
        rate: Math.round(rateWeighted),
        availability: Math.round(availabilityWeighted),
      },
      details: {
        skill: skillResult,
        location: locationResult,
        rate: rateResult,
        availability: availabilityResult,
      },
    };

    this.setCache(freelancerId, projectId, result);

    return result;
  }

  public async getProjectRecommendations(
    freelancerId: string,
    options: {
      limit?: number;
      minScore?: number;
      status?: string;
    } = {}
  ): Promise<ProjectRecommendation[]> {
    const { limit = 20, minScore = 0, status = 'published' } = options;

    const projects = await ProjectRequirement.find({
      status,
      is_active: true,
    }).limit(100);

    const recommendations: ProjectRecommendation[] = [];

    for (const project of projects) {
      try {
        const matchScore = await this.calculateMatchScore({
          freelancerId,
          projectId: project._id.toString(),
        });

        if (matchScore.totalScore >= minScore) {
          recommendations.push({
            project,
            matchScore,
          });
        }
      } catch (error) {
        console.error(`Error calculating match score for project ${project._id}:`, error);
      }
    }

    recommendations.sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore);

    return recommendations.slice(0, limit);
  }

  public async getFreelancerRecommendations(
    projectId: string,
    options: {
      limit?: number;
      minScore?: number;
    } = {}
  ): Promise<Array<{ freelancer: any; matchScore: MatchScoreResult }>> {
    const { limit = 20, minScore = 0 } = options;

    const freelancers = await FreelancerProfile.find({
      is_active: true,
    }).limit(100);

    const recommendations: Array<{ freelancer: any; matchScore: MatchScoreResult }> = [];

    for (const freelancer of freelancers) {
      try {
        const matchScore = await this.calculateMatchScore({
          freelancerId: freelancer._id.toString(),
          projectId,
        });

        if (matchScore.totalScore >= minScore) {
          recommendations.push({
            freelancer,
            matchScore,
          });
        }
      } catch (error) {
        console.error(`Error calculating match score for freelancer ${freelancer._id}:`, error);
      }
    }

    recommendations.sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore);

    return recommendations.slice(0, limit);
  }

  public clearCache(): void {
    this.scoreCache.clear();
  }
}

export default MatchScoreService.getInstance();
