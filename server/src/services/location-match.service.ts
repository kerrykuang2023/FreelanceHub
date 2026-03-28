import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";

export interface LocationMatchInput {
  userLocation: {
    city?: string;
    province?: string;
    country?: string;
  };
  projectLocation: {
    city?: string;
    province?: string;
    country?: string;
  };
  isRemote: boolean;
}

export interface LocationMatchResult {
  score: number;
  matchType: 'remote' | 'same_city' | 'same_province' | 'same_country' | 'no_match';
  details: {
    userCity: string;
    userProvince: string;
    userCountry: string;
    projectCity: string;
    projectProvince: string;
    projectCountry: string;
  };
}

class LocationMatchService {
  private static INSTANCE: LocationMatchService;

  public static getInstance(): LocationMatchService {
    if (!LocationMatchService.INSTANCE) {
      LocationMatchService.INSTANCE = new LocationMatchService();
    }
    return LocationMatchService.INSTANCE;
  }

  public calculateLocationMatch(input: LocationMatchInput): LocationMatchResult {
    const { userLocation, projectLocation, isRemote } = input;

    if (isRemote) {
      return {
        score: 100,
        matchType: 'remote',
        details: {
          userCity: userLocation.city || '',
          userProvince: userLocation.province || '',
          userCountry: userLocation.country || '',
          projectCity: projectLocation.city || '',
          projectProvince: projectLocation.province || '',
          projectCountry: projectLocation.country || '',
        },
      };
    }

    const userCity = (userLocation.city || '').toLowerCase().trim();
    const userProvince = (userLocation.province || '').toLowerCase().trim();
    const userCountry = (userLocation.country || '').toLowerCase().trim();
    const projectCity = (projectLocation.city || '').toLowerCase().trim();
    const projectProvince = (projectLocation.province || '').toLowerCase().trim();
    const projectCountry = (projectLocation.country || '').toLowerCase().trim();

    if (userCity && projectCity && userCity === projectCity) {
      return {
        score: 100,
        matchType: 'same_city',
        details: {
          userCity: userLocation.city || '',
          userProvince: userLocation.province || '',
          userCountry: userLocation.country || '',
          projectCity: projectLocation.city || '',
          projectProvince: projectLocation.province || '',
          projectCountry: projectLocation.country || '',
        },
      };
    }

    if (userProvince && projectProvince && userProvince === projectProvince) {
      return {
        score: 80,
        matchType: 'same_province',
        details: {
          userCity: userLocation.city || '',
          userProvince: userLocation.province || '',
          userCountry: userLocation.country || '',
          projectCity: projectLocation.city || '',
          projectProvince: projectLocation.province || '',
          projectCountry: projectLocation.country || '',
        },
      };
    }

    if (userCountry && projectCountry && userCountry === projectCountry) {
      return {
        score: 60,
        matchType: 'same_country',
        details: {
          userCity: userLocation.city || '',
          userProvince: userLocation.province || '',
          userCountry: userLocation.country || '',
          projectCity: projectLocation.city || '',
          projectProvince: projectLocation.province || '',
          projectCountry: projectLocation.country || '',
        },
      };
    }

    return {
      score: 0,
      matchType: 'no_match',
      details: {
        userCity: userLocation.city || '',
        userProvince: userLocation.province || '',
        userCountry: userLocation.country || '',
        projectCity: projectLocation.city || '',
        projectProvince: projectLocation.province || '',
        projectCountry: projectLocation.country || '',
      },
    };
  }

  public async calculateLocationMatchForFreelancer(
    freelancerId: string,
    projectId: string
  ): Promise<LocationMatchResult> {
    const freelancer = await FreelancerProfile.findById(freelancerId);
    if (!freelancer) {
      throw new Error(`Freelancer profile not found: ${freelancerId}`);
    }

    const project = await ProjectRequirement.findById(projectId);
    if (!project) {
      throw new Error(`Project requirement not found: ${projectId}`);
    }

    const userLocation = {
      city: '',
      province: '',
      country: '',
    };

    if (freelancer.preferred_locations && freelancer.preferred_locations.length > 0) {
      const firstLocation = freelancer.preferred_locations[0];
      userLocation.city = firstLocation.city || '';
      userLocation.province = firstLocation.country || '';
      userLocation.country = firstLocation.country || '';
    }

    const projectLocation = {
      city: project.project_location?.city || '',
      province: project.project_location?.state || '',
      country: project.project_location?.country || '',
    };

    const isRemote = project.work_format === '远程';

    return this.calculateLocationMatch({
      userLocation,
      projectLocation,
      isRemote,
    });
  }
}

export default LocationMatchService.getInstance();
