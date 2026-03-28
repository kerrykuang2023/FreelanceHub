import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job_portal';

interface TestUser {
  email: string;
  password: string;
  user_name: string;
  role: string;
  user_type_name: string;
}

interface TestCompany {
  company_name: string;
  company_type: string;
  status: string;
}

interface TestSkillCategory {
  category_name: string;
  category_description: string;
  sub_categories: { sub_category_name: string; sub_category_description: string }[];
}

const TEST_USERS: TestUser[] = [
  { email: 'freelancer@test.com', password: 'Test123456!', user_name: 'Test Freelancer', role: 'job_seeker', user_type_name: 'job_seeker' },
  { email: 'hr@test.com', password: 'Test123456!', user_name: 'Test HR', role: 'hr_recruiter', user_type_name: 'hr_recruiter' },
  { email: 'admin@test.com', password: 'Admin123456!', user_name: 'Test Admin', role: 'admin', user_type_name: 'admin' },
];

const TEST_COMPANIES: TestCompany[] = [
  { company_name: 'Test Terminal Company', company_type: 'end_client', status: 'active' },
  { company_name: 'Test Affiliation Company', company_type: 'affiliation', status: 'active' },
];

const TEST_SKILL_CATEGORIES: TestSkillCategory[] = [
  {
    category_name: 'SAP',
    category_description: 'SAP related skills',
    sub_categories: [
      { sub_category_name: 'SAP MM', sub_category_description: 'SAP Materials Management' },
      { sub_category_name: 'SAP FI', sub_category_description: 'SAP Financial Accounting' },
      { sub_category_name: 'SAP SD', sub_category_description: 'SAP Sales and Distribution' },
    ],
  },
  {
    category_name: 'Java',
    category_description: 'Java development skills',
    sub_categories: [
      { sub_category_name: 'Spring Boot', sub_category_description: 'Spring Boot framework' },
      { sub_category_name: 'Microservices', sub_category_description: 'Microservices architecture' },
    ],
  },
  {
    category_name: 'Frontend',
    category_description: 'Frontend development skills',
    sub_categories: [
      { sub_category_name: 'React', sub_category_description: 'React framework' },
      { sub_category_name: 'Vue', sub_category_description: 'Vue framework' },
      { sub_category_name: 'Angular', sub_category_description: 'Angular framework' },
    ],
  },
];

async function seedTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('user_account');
    const userTypesCollection = db.collection('user_types');
    const userRolesCollection = db.collection('user_roles');
    const companiesCollection = db.collection('companies');
    const skillCategoriesCollection = db.collection('skill_categories');
    const skillSubCategoriesCollection = db.collection('skill_sub_categories');

    console.log('\n📝 Seeding test users...');
    for (const user of TEST_USERS) {
      const userType = await userTypesCollection.findOne({ user_type_name: user.user_type_name });
      if (!userType) {
        console.log(`  ❌ User type not found: ${user.user_type_name}, creating...`);
        const result = await userTypesCollection.insertOne({
          user_type_name: user.user_type_name,
          created_at: new Date(),
          updated_at: new Date(),
        });
        const newUserType = await userTypesCollection.findOne({ _id: result.insertedId });
        if (newUserType) {
          await seedUser(usersCollection, userRolesCollection, user, newUserType._id);
        }
      } else {
        await seedUser(usersCollection, userRolesCollection, user, userType._id);
      }
    }

    console.log('\n📝 Seeding test companies...');
    for (const company of TEST_COMPANIES) {
      const existingCompany = await companiesCollection.findOne({ company_name: company.company_name });
      if (existingCompany) {
        console.log(`  ⚠️ Company ${company.company_name} already exists`);
      } else {
        const hrUser = await usersCollection.findOne({ email: 'hr@test.com' });
        await companiesCollection.insertOne({
          ...company,
          created_by: hrUser?._id,
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log(`  ✅ Created company: ${company.company_name}`);
      }
    }

    console.log('\n📝 Seeding skill categories...');
    for (const category of TEST_SKILL_CATEGORIES) {
      const existingCategory = await skillCategoriesCollection.findOne({ category_name: category.category_name });
      let categoryId;

      if (existingCategory) {
        categoryId = existingCategory._id;
        console.log(`  ⚠️ Skill category ${category.category_name} already exists`);
      } else {
        const result = await skillCategoriesCollection.insertOne({
          category_name: category.category_name,
          category_description: category.category_description,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
        categoryId = result.insertedId;
        console.log(`  ✅ Created skill category: ${category.category_name}`);
      }

      for (const subCat of category.sub_categories) {
        const existingSubCat = await skillSubCategoriesCollection.findOne({
          sub_category_name: subCat.sub_category_name,
          parent_category_id: categoryId,
        });

        if (existingSubCat) {
          console.log(`    ⚠️ Sub-category ${subCat.sub_category_name} already exists`);
        } else {
          await skillSubCategoriesCollection.insertOne({
            sub_category_name: subCat.sub_category_name,
            sub_category_description: subCat.sub_category_description,
            parent_category_id: categoryId,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          });
          console.log(`    ✅ Created sub-category: ${subCat.sub_category_name}`);
        }
      }
    }

    console.log('\n✅ Test data seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`  Users: ${TEST_USERS.length}`);
    console.log(`  Companies: ${TEST_COMPANIES.length}`);
    console.log(`  Skill Categories: ${TEST_SKILL_CATEGORIES.length}`);
    console.log(`  Total Sub-categories: ${TEST_SKILL_CATEGORIES.reduce((sum, cat) => sum + cat.sub_categories.length, 0)}`);

    console.log('\n🔑 Test Credentials:');
    console.log('  Freelancer: freelancer@test.com / Test123456!');
    console.log('  HR: hr@test.com / Test123456!');
    console.log('  Admin: admin@test.com / Admin123456!');

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

async function seedUser(
  usersCollection: any,
  userRolesCollection: any,
  user: TestUser,
  userTypeId: any
) {
  const existingUser = await usersCollection.findOne({ email: user.email });
  
  if (existingUser) {
    console.log(`  ⚠️ User ${user.email} already exists, updating password...`);
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await usersCollection.updateOne(
      { email: user.email },
      { 
        $set: { 
          password: hashedPassword, 
          user_name: user.user_name,
          user_type_id: userTypeId,
          is_active: true,
          registration_date: new Date()
        } 
      }
    );
    
    const existingRole = await userRolesCollection.findOne({ 
      user_id: existingUser._id, 
      role_type: user.role 
    });
    if (!existingRole) {
      await userRolesCollection.insertOne({
        user_id: existingUser._id,
        role_type: user.role,
        status: 'approved',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`    ✅ Created role: ${user.role}`);
    } else {
      await userRolesCollection.updateOne(
        { user_id: existingUser._id, role_type: user.role },
        { $set: { status: 'approved', is_active: true } }
      );
      console.log(`    ⚠️ Role ${user.role} already exists, updated`);
    }
  } else {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await usersCollection.insertOne({
      email: user.email,
      password: hashedPassword,
      user_name: user.user_name,
      user_type_id: userTypeId,
      is_active: true,
      registration_date: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`  ✅ Created user: ${user.email}`);
    
    await userRolesCollection.insertOne({
      user_id: result.insertedId,
      role_type: user.role,
      status: 'approved',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`    ✅ Created role: ${user.role}`);
  }
}

seedTestData();
