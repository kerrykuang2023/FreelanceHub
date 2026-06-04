import mongoose from 'mongoose';
import SkillCategory from '../models/freelancer/skill_category.model';
import SkillSubCategory from '../models/freelancer/skill_sub_category.model';
import User from '../models/user.model';
import UserType from '../models/user_type.model';
import Company from '../models/company.model';
import Job from '../models/job.model';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelancehub';

const skillData = [
  {
    category_name: "ERP",
    category_code: "ERP",
    category_icon: "CpuChipIcon",
    description: "Enterprise Resource Planning systems",
    display_order: 1,
    sub_categories: [
      { sub_category_name: "SAP", sub_category_code: "SAP", description: "SAP ERP System", display_order: 1 },
      { sub_category_name: "Oracle EBS", sub_category_code: "ORACLE_EBS", description: "Oracle E-Business Suite", display_order: 2 },
      { sub_category_name: "Microsoft Dynamics", sub_category_code: "MS_DYNAMICS", description: "Microsoft Dynamics ERP", display_order: 3 },
    ]
  },
  {
    category_name: "SAP",
    category_code: "SAP",
    category_icon: "CubeIcon",
    description: "SAP Modules and Technologies",
    display_order: 2,
    sub_categories: [
      { sub_category_name: "SAP MM", sub_category_code: "SAP_MM", description: "Materials Management", display_order: 1 },
      { sub_category_name: "SAP FICO", sub_category_code: "SAP_FICO", description: "Finance & Controlling", display_order: 2 },
      { sub_category_name: "SAP SD", sub_category_code: "SAP_SD", description: "Sales & Distribution", display_order: 3 },
      { sub_category_name: "SAP ABAP", sub_category_code: "SAP_ABAP", description: "ABAP Programming", display_order: 4 },
    ]
  },
  {
    category_name: "CRM",
    category_code: "CRM",
    category_icon: "UsersIcon",
    description: "Customer Relationship Management",
    display_order: 3,
    sub_categories: [
      { sub_category_name: "Salesforce", sub_category_code: "SALESFORCE", description: "Salesforce CRM", display_order: 1 },
      { sub_category_name: "SAP CRM", sub_category_code: "SAP_CRM", description: "SAP CRM", display_order: 2 },
    ]
  },
  {
    category_name: "Frontend",
    category_code: "FRONTEND",
    category_icon: "DeviceMobileIcon",
    description: "Frontend Development",
    display_order: 4,
    sub_categories: [
      { sub_category_name: "React", sub_category_code: "REACT", description: "React.js", display_order: 1 },
      { sub_category_name: "Vue.js", sub_category_code: "VUE", description: "Vue.js", display_order: 2 },
      { sub_category_name: "Angular", sub_category_code: "ANGULAR", description: "Angular", display_order: 3 },
    ]
  },
  {
    category_name: "Backend",
    category_code: "BACKEND",
    category_icon: "ServerIcon",
    description: "Backend Development",
    display_order: 5,
    sub_categories: [
      { sub_category_name: "Java", sub_category_code: "JAVA", description: "Java Development", display_order: 1 },
      { sub_category_name: "Node.js", sub_category_code: "NODEJS", description: "Node.js", display_order: 2 },
      { sub_category_name: "Python", sub_category_code: "PYTHON", description: "Python", display_order: 3 },
    ]
  },
  {
    category_name: "Database",
    category_code: "DB",
    category_icon: "DatabaseIcon",
    description: "Database Management",
    display_order: 6,
    sub_categories: [
      { sub_category_name: "Oracle", sub_category_code: "ORACLE", description: "Oracle Database", display_order: 1 },
      { sub_category_name: "MySQL", sub_category_code: "MYSQL", description: "MySQL", display_order: 2 },
      { sub_category_name: "MongoDB", sub_category_code: "MONGODB", description: "MongoDB", display_order: 3 },
    ]
  },
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('‚ú?Connected to MongoDB');
  } catch (error) {
    console.error('‚ù?MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedSkillCategories() {
  console.log('\nüå± Seeding skill categories...');
  
  let createdCount = 0;
  let existingCount = 0;
  
  for (const categoryData of skillData) {
    const { sub_categories, ...categoryFields } = categoryData;

    const existingCategory = await SkillCategory.findOne({
      category_code: categoryFields.category_code
    });

    if (!existingCategory) {
      const category = new SkillCategory(categoryFields);
      await category.save();
      console.log(`  ‚ú?Created skill category: ${categoryFields.category_name}`);
      createdCount++;

      for (const subCategoryData of sub_categories) {
        const existingSubCategory = await SkillSubCategory.findOne({
          category_id: category._id,
          sub_category_code: subCategoryData.sub_category_code
        });

        if (!existingSubCategory) {
          const subCategory = new SkillSubCategory({
            ...subCategoryData,
            category_id: category._id
          });
          await subCategory.save();
          console.log(`    ‚ú?Created sub-category: ${subCategoryData.sub_category_name}`);
        }
      }
    } else {
      console.log(`  ‚ö†Ô∏è Skill category already exists: ${categoryFields.category_name}`);
      existingCount++;
    }
  }

  console.log(`\nüìä Skill Categories Summary:`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Existing: ${existingCount}`);
  console.log(`   - Total categories in DB: ${await SkillCategory.countDocuments()}`);
}

async function verifyTestUsers() {
  console.log('\nüîç Verifying test users...');
  
  const testUsers = [
    { email: 'admin@test.com', role: 'Administrator' },
    { email: 'hr@test.com', role: 'HR Recruiter' },
    { email: 'freelancer@test.com', role: 'Job Seeker' },
  ];

  for (const testUser of testUsers) {
    const user = await User.findOne({ email: testUser.email });
    if (user) {
      console.log(`  ‚ú?${testUser.role}: ${testUser.email} exists`);
    } else {
      console.log(`  ‚ù?${testUser.role}: ${testUser.email} NOT FOUND`);
    }
  }
}

async function verifyUserTypes() {
  console.log('\nüîç Verifying user types...');
  
  const userTypes = ['Administrator', 'HR Recruiter', 'Job Seeker'];
  
  for (const typeName of userTypes) {
    const type = await UserType.findOne({ user_type_name: typeName });
    if (type) {
      console.log(`  ‚ú?User type: ${typeName} exists`);
    } else {
      console.log(`  ‚ù?User type: ${typeName} NOT FOUND`);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('  E2E Test Data Initialization Script');
  console.log('========================================');

  await connectDB();
  
  await seedSkillCategories();
  await verifyUserTypes();
  await verifyTestUsers();

  console.log('\n========================================');
  console.log('  Initialization Complete');
  console.log('========================================');
  
  await mongoose.disconnect();
  console.log('\nüëã Disconnected from MongoDB');
}

main().catch((error) => {
  console.error('‚ù?Script failed:', error);
  process.exit(1);
});
