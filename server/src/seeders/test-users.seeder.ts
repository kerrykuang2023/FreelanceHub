import mongoose from "mongoose";
import UserAccount from "../models/user/user-account.model";
import UserType from "../models/user/user-type.model";
import UserRole from "../models/user/user-role.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import Company from "../models/company-profile/company.model";

const testUsers = [
  {
    email: "admin@test.com",
    password: "Test123456!",
    user_name: "测试管理员",
    user_type_name: "admin",
  },
  {
    email: "freelancer@test.com",
    password: "Test123456!",
    user_name: "测试顾问",
    user_type_name: "job_seeker",
  },
  {
    email: "hr@test.com",
    password: "Test123456!",
    user_name: "测试HR",
    user_type_name: "hr_recruiter",
  },
];

const seedTestUsers = async () => {
  try {
    console.log("🌱 [Seeder]: Starting test users seeding...");

    let testCompany: any = null;
    // 优先查找审批测试公司，其次查找任何可用的公司
    let company = await Company.findOne({ company_name: "审批测试公司" });
    if (!company) {
      company = await Company.findOne({ company_name: "Test Terminal Company" });
    }
    if (!company) {
      company = await Company.findOne({});
    }
    
    if (company) {
      testCompany = company;
      console.log(`✅ [Seeder]: Found test company: ${company.company_name}`);
    } else {
      console.log(`⚠️ [Seeder]: No company found, HR user will not have company_id`);
    }

    for (const userData of testUsers) {
      const existingUser = await UserAccount.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⏭️ [Seeder]: User ${userData.email} already exists, updating...`);
        existingUser.password = userData.password;
        existingUser.user_name = userData.user_name;
        
        // 只在 HR 用户没有 company_id 或 company_id 无效时才更新
        if (userData.user_type_name === "hr_recruiter" && testCompany) {
          if (!existingUser.company_id) {
            existingUser.company_id = testCompany._id;
            console.log(`  ✅ [Seeder]: Set company_id for HR user: ${testCompany.company_name}`);
          }
        }
        
        await existingUser.save();
        console.log(`✅ [Seeder]: Updated password for: ${userData.email}`);
        
        if (userData.user_type_name === "job_seeker") {
          await ensureFreelancerProfile(existingUser);
        }
        continue;
      }

      const userType = await UserType.findOne({ user_type_name: userData.user_type_name });
      
      if (!userType) {
        console.log(`❌ [Seeder]: User type ${userData.user_type_name} not found, skipping user ${userData.email}`);
        continue;
      }

      const user = new UserAccount({
        email: userData.email,
        password: userData.password,
        user_name: userData.user_name,
        user_type_id: userType._id,
        is_active: true,
        registration_date: new Date(),
        company_id: userData.user_type_name === "hr_recruiter" && testCompany ? testCompany._id : undefined,
      });

      await user.save();

      const roleType = userData.user_type_name === "admin" ? "admin" : 
                       userData.user_type_name === "hr_recruiter" ? "hr_recruiter" : "job_seeker";

      const userRole = new UserRole({
        user_id: user._id,
        role_type: roleType,
        status: "approved",
        is_active: true,
      });

      await userRole.save();

      if (userData.user_type_name === "job_seeker") {
        await ensureFreelancerProfile(user);
      }

      console.log(`✅ [Seeder]: Created test user: ${userData.email} with role: ${roleType}`);
    }

    console.log("✅ [Seeder]: Test users seeding completed!");
  } catch (error) {
    console.error("❌ [Seeder]: Error seeding test users:", error);
    throw error;
  }
};

async function ensureFreelancerProfile(user: any) {
  try {
    const existingProfile = await FreelancerProfile.findOne({ user_id: user._id });
    if (existingProfile) {
      console.log(`  ⚠️ [Seeder]: FreelancerProfile already exists for ${user.email}`);
      return;
    }

    const profile = new FreelancerProfile({
      user_id: user._id,
      display_name: user.user_name || "测试顾问",
      headline: "测试顾问简介",
      summary: "这是一个测试顾问账号",
      freelancer_type: "独立顾问",
      years_of_experience: 3,
      availability_status: "open_to_opportunities",
      is_active: true,
      profile_completion: 50,
    });

    await profile.save();
    console.log(`  ✅ [Seeder]: Created FreelancerProfile for ${user.email}`);
  } catch (error) {
    console.error(`  ❌ [Seeder]: Error creating FreelancerProfile: ${error}`);
  }
}

export { seedTestUsers };
