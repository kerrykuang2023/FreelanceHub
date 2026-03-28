import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import HRProfile from '../models/hr-profile/hr-profile.model';
import Company from '../models/company-profile/company.model';
import UserAccount from '../models/user/user-account.model';
import CompanyJoinRequest from '../models/company-profile/company-join-request.model';

const router = Router();

router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    const hrProfile = await HRProfile.findOne({ user_id: userId });
    const user = await UserAccount.findById(userId);
    
    const hasCompany = !!hrProfile?.company_id;
    const hasProfile = !!hrProfile?.position;
    const isApproved = hrProfile?.verification_status === 'approved';
    
    let currentStep: 'company' | 'profile' | 'review' | 'completed' = 'company';
    
    if (isApproved) {
      currentStep = 'completed';
    } else if (hasProfile) {
      currentStep = 'review';
    } else if (hasCompany) {
      currentStep = 'profile';
    }
    
    let companyName: string | null = null;
    if (hrProfile?.company_id) {
      const company = await Company.findById(hrProfile.company_id);
      companyName = company?.company_name || null;
    }
    
    res.json({
      success: true,
      data: {
        has_company: hasCompany,
        has_profile: hasProfile,
        is_approved: isApproved,
        current_step: currentStep,
        company_id: hrProfile?.company_id,
        company_name: companyName,
      },
    });
  } catch (error) {
    console.error('Failed to get onboarding status:', error);
    res.status(500).json({ success: false, message: 'Failed to get onboarding status' });
  }
});

router.post('/company/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { company_id, position, department, message } = req.body;
    
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    const existingRequest = await CompanyJoinRequest.findOne({
      user_id: userId,
      company_id: company_id,
      status: 'pending',
    });
    
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'You already have a pending request for this company' });
    }
    
    await CompanyJoinRequest.create({
      user_id: userId,
      company_id: company_id,
      position,
      department,
      message,
      status: 'pending',
    });
    
    let hrProfile = await HRProfile.findOne({ user_id: userId });
    
    if (!hrProfile) {
      hrProfile = await HRProfile.create({
        user_id: userId,
        company_id: company_id,
        position: position || '',
        department: department || '',
        verification_status: 'pending',
      });
    } else {
      hrProfile.company_id = company_id;
      await hrProfile.save();
    }
    
    res.json({ success: true, message: 'Join request submitted successfully' });
  } catch (error) {
    console.error('Failed to join company:', error);
    res.status(500).json({ success: false, message: 'Failed to join company' });
  }
});

router.post('/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    const hrProfile = await HRProfile.findOne({ user_id: userId });
    
    if (!hrProfile || !hrProfile.company_id) {
      return res.status(400).json({ success: false, message: 'Please complete company onboarding first' });
    }
    
    if (!hrProfile.position) {
      return res.status(400).json({ success: false, message: 'Please complete your profile first' });
    }
    
    hrProfile.verification_status = 'pending';
    await hrProfile.save();
    
    res.json({ success: true, message: 'Submitted for review successfully' });
  } catch (error) {
    console.error('Failed to submit for review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit for review' });
  }
});

export default router;
