import mongoose from "mongoose";
import UserAccount from "../models/user/user-account.model";
import UserType from "../models/user/user-type.model";
import UserRole from "../models/user/user-role.model";
import FreelancerProfile from "../models/freelancer/freelancer_profile.model";
import Company from "../models/company-profile/company.model";
import JobPost from "../models/job/job_post.model";
import ProjectRequirement from "../models/freelancer/project_requirement.model";

const TEST_USERS = [
  { email: "admin@test.com", password: "Test123456!", user_name: "测试管理员", user_type_name: "admin" },
  { email: "freelancer@test.com", password: "Test123456!", user_name: "测试顾问", user_type_name: "job_seeker" },
  { email: "hr@test.com", password: "Test123456!", user_name: "测试HR", user_type_name: "hr_recruiter" },
];

async function seedCompleteTestData() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/job_portal");
    console.log("✅ Connected to MongoDB");

    console.log("\n📝 Step 1: Ensuring user types exist...");
    const userTypes = ["admin", "job_seeker", "hr_recruiter"];
    const userTypeMap: Record<string, any> = {};
    
    for (const typeName of userTypes) {
      let userType = await UserType.findOne({ user_type_name: typeName });
      if (!userType) {
        userType = new UserType({
          user_type_name: typeName,
          user_type_display_name: typeName === "admin" ? "管理员" : typeName === "job_seeker" ? "求职者" : "HR招聘官",
        });
        await userType.save();
        console.log(`  ✅ Created user type: ${typeName}`);
      } else {
        console.log(`  ⚠️ User type already exists: ${typeName}`);
      }
      userTypeMap[typeName] = userType;
    }

    console.log("\n📝 Step 2: Creating/Updating test users...");
    const users: Record<string, any> = {};

    for (const userData of TEST_USERS) {
      const userType = userTypeMap[userData.user_type_name];
      if (!userType) {
        console.log(`  ❌ User type not found: ${userData.user_type_name}`);
        continue;
      }

      let user = await UserAccount.findOne({ email: userData.email });
      if (user) {
        user.password = userData.password;
        user.user_name = userData.user_name;
        await user.save();
        console.log(`  ✅ Updated user: ${userData.email}`);
      } else {
        user = new UserAccount({
          email: userData.email,
          password: userData.password,
          user_name: userData.user_name,
          user_type_id: userType._id,
          is_active: true,
          registration_date: new Date(),
        });
        await user.save();
        console.log(`  ✅ Created user: ${userData.email}`);
      }
      users[userData.user_type_name] = user;

      const roleType = userData.user_type_name === "admin" ? "admin" : 
                       userData.user_type_name === "hr_recruiter" ? "hr_recruiter" : "job_seeker";
      await UserRole.findOneAndUpdate(
        { user_id: user._id },
        { user_id: user._id, role_type: roleType, status: "approved", is_active: true },
        { upsert: true }
      );
    }

    console.log("\n📝 Step 3: Creating test company...");
    let company = await Company.findOne({ company_name: "Test Terminal Company" });
    if (!company) {
      company = new Company({
        company_name: "Test Terminal Company",
        company_type: "limited_company",
        status: "approved",
        created_by: users["hr_recruiter"]?._id,
        is_active: true,
      });
      await company.save();
      console.log(`  ✅ Created company: Test Terminal Company`);
    } else {
      console.log(`  ⚠️ Company already exists: Test Terminal Company`);
    }

    console.log("\n📝 Step 4: Linking HR user to company...");
    if (users["hr_recruiter"] && company) {
      users["hr_recruiter"].company_id = company._id;
      await users["hr_recruiter"].save();
      console.log(`  ✅ Linked HR user to company`);
    }

    console.log("\n📝 Step 5: Creating freelancer profile...");
    if (users["job_seeker"]) {
      let profile = await FreelancerProfile.findOne({ user_id: users["job_seeker"]._id });
      if (!profile) {
        profile = new FreelancerProfile({
          user_id: users["job_seeker"]._id,
          display_name: users["job_seeker"].user_name,
          headline: "测试顾问简介",
          summary: "这是一个测试顾问账号",
          freelancer_type: "独立顾问",
          years_of_experience: 3,
          availability_status: "open_to_opportunities",
          is_active: true,
          profile_completion: 50,
        });
        await profile.save();
        console.log(`  ✅ Created freelancer profile`);
      } else {
        console.log(`  ⚠️ Freelancer profile already exists`);
      }
    }

    console.log("\n📝 Step 6: Creating test project...");
    if (company && users["hr_recruiter"]) {
      let jobPost = await JobPost.findOne({ job_title: "测试项目 - SAP实施顾问" });
      if (!jobPost) {
        jobPost = new JobPost({
          job_title: "测试项目 - SAP实施顾问",
          job_description: "这是一个用于E2E测试的项目，需要SAP MM模块实施经验。",
          company_id: company._id,
          posted_by: users["hr_recruiter"]._id,
          status: "published",
          is_active: true,
          job_nature: "freelance",
          work_format: "remote",
          rate_type: "daily",
          rate_currency: "CNY",
          rate_min: 1500,
          rate_max: 2500,
          project_cycle: "3_months",
          created_date: new Date(),
        });
        await jobPost.save();
        console.log(`  ✅ Created test project: ${jobPost._id}`);
      } else {
        jobPost.status = "published";
        jobPost.is_active = true;
        await jobPost.save();
        console.log(`  ⚠️ Test project already exists: ${jobPost._id}, updated status`);
      }

      let projectReq = await ProjectRequirement.findOne({ project_title: "测试项目 - SAP实施顾问" });
      if (!projectReq) {
        projectReq = new ProjectRequirement({
          project_title: "测试项目 - SAP实施顾问",
          project_description: "这是一个用于E2E测试的项目需求",
          company_id: company._id,
          posted_by: users["hr_recruiter"]._id,
          status: "发布",
          is_active: true,
          job_nature: "自由顾问",
          work_format: "远程",
          rate_type: "日薪",
          rate_currency: "CNY",
          project_cycle: "3个月",
          created_date: new Date(),
        });
        await projectReq.save();
        console.log(`  ✅ Created test project requirement: ${projectReq._id}`);
      } else {
        console.log(`  ⚠️ Test project requirement already exists`);
      }
    }

    console.log("\n✅ Complete test data seeding finished!");
    console.log("\n📊 Summary:");
    console.log("  - 3 test users (admin, freelancer, hr)");
    console.log("  - 1 test company (Test Terminal Company)");
    console.log("  - HR user linked to company");
    console.log("  - Freelancer profile created");
    console.log("  - Test project published");
    console.log("\n🔑 Test Credentials:");
    console.log("  Freelancer: freelancer@test.com / Test123456!");
    console.log("  HR: hr@test.com / Test123456!");
    console.log("  Admin: admin@test.com / Test123456!");

    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedCompleteTestData();
