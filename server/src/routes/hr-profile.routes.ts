import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import HRProfile from '../models/hr-profile/hr-profile.model';
import Company from '../models/company-profile/company.model';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    const hrProfile = await HRProfile.findOne({ user_id: userId })
      .populate('company_id')
      .populate('user_id', 'user_name email user_image');
    
    if (!hrProfile) {
      return res.json({
        success: true,
        data: null,
      });
    }
    
    res.json({
      success: true,
      data: hrProfile,
    });
  } catch (error) {
    console.error('Failed to get HR profile:', error);
    res.status(500).json({ success: false, message: 'Failed to get HR profile' });
  }
});

router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      position,
      department,
      recruitment_fields,
      years_of_experience,
      summary,
      phone,
      work_email,
      wechat,
      linkedin,
      skills,
    } = req.body;
    
    let hrProfile = await HRProfile.findOne({ user_id: userId });
    
    if (!hrProfile) {
      hrProfile = new HRProfile({
        user_id: userId,
      });
    }
    
    if (position !== undefined) hrProfile.position = position;
    if (department !== undefined) hrProfile.department = department;
    if (recruitment_fields !== undefined) hrProfile.recruitment_fields = recruitment_fields;
    if (years_of_experience !== undefined) hrProfile.years_of_experience = years_of_experience;
    if (summary !== undefined) hrProfile.summary = summary;
    if (phone !== undefined) hrProfile.phone = phone;
    if (work_email !== undefined) hrProfile.work_email = work_email;
    if (wechat !== undefined) hrProfile.wechat = wechat;
    if (linkedin !== undefined) hrProfile.linkedin = linkedin;
    if (skills !== undefined) hrProfile.skills = skills;
    
    await hrProfile.save();
    
    res.json({
      success: true,
      data: hrProfile,
      message: 'HR profile updated successfully',
    });
  } catch (error) {
    console.error('Failed to update HR profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update HR profile' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const hrProfile = await HRProfile.findById(id)
      .populate('company_id')
      .populate('user_id', 'user_name email user_image');
    
    if (!hrProfile) {
      return res.status(404).json({ success: false, message: 'HR profile not found' });
    }
    
    const publicProfile = {
      _id: hrProfile._id,
      position: hrProfile.position,
      department: hrProfile.department,
      recruitment_fields: hrProfile.recruitment_fields,
      years_of_experience: hrProfile.years_of_experience,
      summary: hrProfile.summary,
      stats: hrProfile.stats,
      company_id: hrProfile.company_id,
      user_id: hrProfile.user_id,
    };
    
    res.json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error('Failed to get HR public profile:', error);
    res.status(500).json({ success: false, message: 'Failed to get HR profile' });
  }
});

export default router;
