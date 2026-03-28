import Rating, { IRating } from '../models/rating/rating.model';
import FreelancerProfile from '../models/freelancer/freelancer_profile.model';
import Company from '../models/company-profile/company.model';

export interface CreateRatingDTO {
  project_id: string;
  reviewee_id: string;
  dimensions: {
    professional_skill: number;
    work_attitude: number;
    communication: number;
    delivery_quality: number;
  };
  comment?: string;
  is_anonymous?: boolean;
}

class RatingService {
  private static INSTANCE: RatingService;

  public static getInstance(): RatingService {
    if (!RatingService.INSTANCE) {
      RatingService.INSTANCE = new RatingService();
    }
    return RatingService.INSTANCE;
  }

  private calculateOverallScore(dimensions: {
    professional_skill: number;
    work_attitude: number;
    communication: number;
    delivery_quality: number;
  }): number {
    const weights = {
      professional_skill: 0.3,
      work_attitude: 0.25,
      communication: 0.2,
      delivery_quality: 0.25,
    };

    const score =
      dimensions.professional_skill * weights.professional_skill +
      dimensions.work_attitude * weights.work_attitude +
      dimensions.communication * weights.communication +
      dimensions.delivery_quality * weights.delivery_quality;

    return Math.round(score * 10) / 10;
  }

  public async createRating(
    data: CreateRatingDTO,
    reviewerId: string,
    reviewerType: 'company' | 'freelancer'
  ): Promise<IRating> {
    const existingRating = await Rating.findOne({
      project_id: data.project_id,
      reviewer_id: reviewerId,
    });

    if (existingRating) {
      throw new Error('You have already rated this project');
    }

    const overall_score = this.calculateOverallScore(data.dimensions);

    const revieweeType = reviewerType === 'company' ? 'freelancer' : 'company';

    const rating = await Rating.create({
      ...data,
      reviewer_id: reviewerId,
      reviewer_type: reviewerType,
      reviewee_type: revieweeType,
      overall_score,
      status: 'active',
    });

    await this.updateAverageRating(data.reviewee_id, revieweeType);

    return rating;
  }

  private async updateAverageRating(
    userId: string,
    userType: 'freelancer' | 'company'
  ): Promise<void> {
    const ratings = await Rating.find({
      reviewee_id: userId,
      status: 'active',
    });

    if (ratings.length === 0) return;

    const avgOverall =
      ratings.reduce((sum, r) => sum + r.overall_score, 0) / ratings.length;

    const avgDimensions = {
      professional_skill:
        ratings.reduce((sum, r) => sum + r.dimensions.professional_skill, 0) /
        ratings.length,
      work_attitude:
        ratings.reduce((sum, r) => sum + r.dimensions.work_attitude, 0) /
        ratings.length,
      communication:
        ratings.reduce((sum, r) => sum + r.dimensions.communication, 0) /
        ratings.length,
      delivery_quality:
        ratings.reduce((sum, r) => sum + r.dimensions.delivery_quality, 0) /
        ratings.length,
    };

    if (userType === 'freelancer') {
      await FreelancerProfile.findByIdAndUpdate(userId, {
        rating: {
          overall: Math.round(avgOverall * 10) / 10,
          dimensions: {
            professional_skill: Math.round(avgDimensions.professional_skill * 10) / 10,
            work_attitude: Math.round(avgDimensions.work_attitude * 10) / 10,
            communication: Math.round(avgDimensions.communication * 10) / 10,
            delivery_quality: Math.round(avgDimensions.delivery_quality * 10) / 10,
          },
          count: ratings.length,
        },
      });
    } else {
      await Company.findByIdAndUpdate(userId, {
        rating: {
          overall: Math.round(avgOverall * 10) / 10,
          count: ratings.length,
        },
      });
    }
  }

  public async getRatings(options: {
    reviewee_id?: string;
    reviewer_id?: string;
    project_id?: string;
    page?: number;
    pageSize?: number;
    status?: string;
  } = {}): Promise<{ items: IRating[]; total: number }> {
    const { page = 1, pageSize = 20, reviewee_id, reviewer_id, project_id, status } = options;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (reviewee_id) filter.reviewee_id = reviewee_id;
    if (reviewer_id) filter.reviewer_id = reviewer_id;
    if (project_id) filter.project_id = project_id;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Rating.find(filter)
        .populate('reviewer_id', 'user_name user_image')
        .populate('reviewee_id', 'user_name user_image')
        .populate('project_id', 'project_title')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize),
      Rating.countDocuments(filter),
    ]);

    return { items, total };
  }

  public async getRatingById(id: string): Promise<IRating | null> {
    return Rating.findById(id)
      .populate('reviewer_id', 'user_name user_image')
      .populate('reviewee_id', 'user_name user_image')
      .populate('project_id', 'project_title');
  }

  public async replyToRating(ratingId: string, revieweeId: string, content: string): Promise<IRating> {
    const rating = await Rating.findOne({ _id: ratingId, reviewee_id: revieweeId });
    if (!rating) {
      throw new Error('Rating not found');
    }

    rating.reply = {
      content,
      created_at: new Date(),
    };

    await rating.save();
    return rating;
  }

  public async hideRating(id: string): Promise<IRating | null> {
    return Rating.findByIdAndUpdate(id, { status: 'hidden' }, { new: true });
  }

  public async disputeRating(id: string): Promise<IRating | null> {
    return Rating.findByIdAndUpdate(id, { status: 'disputed' }, { new: true });
  }
}

export default RatingService.getInstance();
