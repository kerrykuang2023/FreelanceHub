import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";
import FreelancerAffiliation from "../models/freelancer/freelancer_affiliation.model";

export interface AvailabilityMatchInput {
  userAvailability: {
    availableFrom?: Date;
    availableTo?: Date;
    status: 'available' | 'busy' | 'not_available';
    bookedPeriods: Array<{
      start: Date;
      end: Date;
    }>;
  };
  projectPeriod: {
    startDate?: Date;
    endDate?: Date;
  };
}

export interface AvailabilityMatchResult {
  score: number;
  matchType: 'fully_available' | 'partially_available' | 'conflict' | 'unknown';
  details: {
    userAvailableFrom: string;
    userAvailableTo: string;
    projectStartDate: string;
    projectEndDate: string;
    conflictPeriods: Array<{ start: string; end: string }>;
  };
}

class AvailabilityMatchService {
  private static INSTANCE: AvailabilityMatchService;

  public static getInstance(): AvailabilityMatchService {
    if (!AvailabilityMatchService.INSTANCE) {
      AvailabilityMatchService.INSTANCE = new AvailabilityMatchService();
    }
    return AvailabilityMatchService.INSTANCE;
  }

  private checkPeriodOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  public calculateAvailabilityMatch(input: AvailabilityMatchInput): AvailabilityMatchResult {
    const { userAvailability, projectPeriod } = input;

    if (!projectPeriod.startDate || !projectPeriod.endDate) {
      return {
        score: 50,
        matchType: 'unknown',
        details: {
          userAvailableFrom: userAvailability.availableFrom?.toISOString() || '',
          userAvailableTo: userAvailability.availableTo?.toISOString() || '',
          projectStartDate: projectPeriod.startDate?.toISOString() || '',
          projectEndDate: projectPeriod.endDate?.toISOString() || '',
          conflictPeriods: [],
        },
      };
    }

    if (userAvailability.status === 'not_available') {
      return {
        score: 0,
        matchType: 'conflict',
        details: {
          userAvailableFrom: userAvailability.availableFrom?.toISOString() || '',
          userAvailableTo: userAvailability.availableTo?.toISOString() || '',
          projectStartDate: projectPeriod.startDate.toISOString(),
          projectEndDate: projectPeriod.endDate.toISOString(),
          conflictPeriods: [],
        },
      };
    }

    const projectStart = new Date(projectPeriod.startDate);
    const projectEnd = new Date(projectPeriod.endDate);

    const conflictPeriods: Array<{ start: string; end: string }> = [];
    let hasConflict = false;

    for (const booked of userAvailability.bookedPeriods) {
      if (this.checkPeriodOverlap(projectStart, projectEnd, new Date(booked.start), new Date(booked.end))) {
        hasConflict = true;
        conflictPeriods.push({
          start: booked.start.toISOString(),
          end: booked.end.toISOString(),
        });
      }
    }

    if (!hasConflict) {
      if (userAvailability.availableFrom && userAvailability.availableTo) {
        const availableStart = new Date(userAvailability.availableFrom);
        const availableEnd = new Date(userAvailability.availableTo);
        
        if (projectStart >= availableStart && projectEnd <= availableEnd) {
          return {
            score: 100,
            matchType: 'fully_available',
            details: {
              userAvailableFrom: userAvailability.availableFrom.toISOString(),
              userAvailableTo: userAvailability.availableTo.toISOString(),
              projectStartDate: projectStart.toISOString(),
              projectEndDate: projectEnd.toISOString(),
              conflictPeriods: [],
            },
          };
        }
      }

      return {
        score: 100,
        matchType: 'fully_available',
        details: {
          userAvailableFrom: userAvailability.availableFrom?.toISOString() || '',
          userAvailableTo: userAvailability.availableTo?.toISOString() || '',
          projectStartDate: projectStart.toISOString(),
          projectEndDate: projectEnd.toISOString(),
          conflictPeriods: [],
        },
      };
    }

    const totalProjectDays = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
    let conflictDays = 0;

    for (const conflict of conflictPeriods) {
      const conflictStart = new Date(conflict.start);
      const conflictEnd = new Date(conflict.end);
      const overlapStart = new Date(Math.max(projectStart.getTime(), conflictStart.getTime()));
      const overlapEnd = new Date(Math.min(projectEnd.getTime(), conflictEnd.getTime()));
      conflictDays += (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);
    }

    const availableRatio = 1 - (conflictDays / totalProjectDays);

    if (availableRatio >= 0.5) {
      return {
        score: 60,
        matchType: 'partially_available',
        details: {
          userAvailableFrom: userAvailability.availableFrom?.toISOString() || '',
          userAvailableTo: userAvailability.availableTo?.toISOString() || '',
          projectStartDate: projectStart.toISOString(),
          projectEndDate: projectEnd.toISOString(),
          conflictPeriods,
        },
      };
    }

    return {
      score: 0,
      matchType: 'conflict',
      details: {
        userAvailableFrom: userAvailability.availableFrom?.toISOString() || '',
        userAvailableTo: userAvailability.availableTo?.toISOString() || '',
        projectStartDate: projectStart.toISOString(),
        projectEndDate: projectEnd.toISOString(),
        conflictPeriods,
      },
    };
  }

  public async calculateAvailabilityMatchForFreelancer(
    freelancerId: string,
    projectId: string
  ): Promise<AvailabilityMatchResult> {
    const freelancer = await FreelancerProfile.findById(freelancerId);
    if (!freelancer) {
      throw new Error(`Freelancer profile not found: ${freelancerId}`);
    }

    const project = await ProjectRequirement.findById(projectId);
    if (!project) {
      throw new Error(`Project requirement not found: ${projectId}`);
    }

    const affiliations = await FreelancerAffiliation.find({
      freelancer_id: freelancerId,
      status: 'active',
    });

    const bookedPeriods: Array<{ start: Date; end: Date }> = [];
    
    for (const affiliation of affiliations) {
      if (affiliation.start_date && affiliation.end_date) {
        bookedPeriods.push({
          start: new Date(affiliation.start_date),
          end: new Date(affiliation.end_date),
        });
      }
    }

    const userAvailability = {
      availableFrom: undefined,
      availableTo: undefined,
      status: (freelancer.availability_status || 'available') as 'available' | 'busy' | 'not_available',
      bookedPeriods,
    };

    const projectPeriod = {
      startDate: project.start_date ?? undefined,
      endDate: undefined,
    };

    return this.calculateAvailabilityMatch({ userAvailability, projectPeriod });
  }
}

export default AvailabilityMatchService.getInstance();
