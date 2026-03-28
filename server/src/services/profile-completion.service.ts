import FreelancerProfile from "../models/freelancer/freelancer_profile.model";

interface CompletionResult {
  score: number;
  missing_fields: string[];
  suggestions: string[];
}

class ProfileCompletionService {
  private static readonly FIELD_WEIGHTS = {
    basic_info: 20,
    skills: 25,
    project_experience: 20,
    certifications: 15,
    rates: 10,
    avatar: 10,
  };

  public static async calculateCompletion(profileId: string): Promise<CompletionResult> {
    const profile = await FreelancerProfile.findById(profileId);

    if (!profile) {
      return {
        score: 0,
        missing_fields: ["Profile not found"],
        suggestions: ["Please create your profile first"],
      };
    }

    const missing_fields: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    if (this.checkBasicInfo(profile)) {
      score += ProfileCompletionService.FIELD_WEIGHTS.basic_info;
    } else {
      missing_fields.push("Basic information (display name, headline, summary)");
      suggestions.push("Add a headline and summary to introduce yourself");
    }

    if (this.checkSkills(profile)) {
      score += ProfileCompletionService.FIELD_WEIGHTS.skills;
    } else {
      missing_fields.push("Skills");
      suggestions.push("Add at least 3 skills with your proficiency level");
    }

    if (this.checkProjectExperience(profile)) {
      score += ProfileCompletionService.FIELD_WEIGHTS.project_experience;
    } else {
      missing_fields.push("Project experience");
      suggestions.push("Add your project experience to showcase your work");
    }

    if (this.checkCertifications(profile)) {
      score += ProfileCompletionService.FIELD_WEIGHTS.certifications;
    } else {
      missing_fields.push("Certifications");
      suggestions.push("Add certifications to increase your credibility");
    }

    if (this.checkRates(profile)) {
      score += ProfileCompletionService.FIELD_WEIGHTS.rates;
    } else {
      missing_fields.push("Rate information");
      suggestions.push("Set your hourly/daily/monthly rate");
    }

    if (this.checkAvatar(profile)) {
      score += ProfileCompletionService.FIELD_WEIGHTS.avatar;
    } else {
      missing_fields.push("Profile photo");
      suggestions.push("Upload a professional profile photo");
    }

    await FreelancerProfile.findByIdAndUpdate(profileId, {
      profile_completion: score,
    });

    return { score, missing_fields, suggestions };
  }

  private static checkBasicInfo(profile: any): boolean {
    return !!(
      profile.display_name &&
      profile.display_name.length > 0 &&
      profile.headline &&
      profile.headline.length > 0 &&
      profile.summary &&
      profile.summary.length > 0
    );
  }

  private static checkSkills(profile: any): boolean {
    return profile.skills && profile.skills.length >= 3;
  }

  private static checkProjectExperience(profile: any): boolean {
    return profile.project_experiences && profile.project_experiences.length >= 1;
  }

  private static checkCertifications(profile: any): boolean {
    return profile.certifications && profile.certifications.length >= 1;
  }

  private static checkRates(profile: any): boolean {
    return !!(
      profile.hourly_rate ||
      profile.daily_rate ||
      profile.monthly_rate
    );
  }

  private static checkAvatar(profile: any): boolean {
    const user = profile.user_id;
    return user && user.user_image && user.user_image.length > 0;
  }

  public static async getCompletionStats(): Promise<{
    average_completion: number;
    completion_distribution: {
      low: number;
      medium: number;
      high: number;
    };
  }> {
    const profiles = await FreelancerProfile.find({}, "profile_completion");

    if (profiles.length === 0) {
      return {
        average_completion: 0,
        completion_distribution: { low: 0, medium: 0, high: 0 },
      };
    }

    const total = profiles.reduce((sum, p) => sum + (p.profile_completion || 0), 0);
    const average = total / profiles.length;

    const distribution = {
      low: profiles.filter((p) => (p.profile_completion || 0) < 40).length,
      medium: profiles.filter((p) => {
        const score = p.profile_completion || 0;
        return score >= 40 && score < 70;
      }).length,
      high: profiles.filter((p) => (p.profile_completion || 0) >= 70).length,
    };

    return {
      average_completion: Math.round(average * 10) / 10,
      completion_distribution: distribution,
    };
  }
}

export default ProfileCompletionService;
