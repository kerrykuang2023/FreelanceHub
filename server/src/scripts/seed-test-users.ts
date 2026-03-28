import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import UserAccount from '../models/user/user-account.model';
import UserType from '../models/user/user-type.model';
import UserRole from '../models/user/user-role.model';
import UserCredit from '../models/credit/user-credit.model';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/job-portal';

interface TestUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type_name: string;
  roles: string[];
}

const testUsers: TestUser[] = [
  {
    email: 'freelancer@test.com',
    password: 'Test1234!',
    first_name: 'Test',
    last_name: 'Freelancer',
    user_type_name: 'job_seeker',
    roles: ['job_seeker'],
  },
  {
    email: 'hr@test.com',
    password: 'Test1234!',
    first_name: 'Test',
    last_name: 'HR',
    user_type_name: 'hr_recruiter',
    roles: ['hr_recruiter'],
  },
  {
    email: 'admin@test.com',
    password: 'Test1234!',
    first_name: 'Test',
    last_name: 'Admin',
    user_type_name: 'admin',
    roles: ['admin'],
  },
  {
    email: 'multirole@test.com',
    password: 'Test1234!',
    first_name: 'Multi',
    last_name: 'Role',
    user_type_name: 'job_seeker',
    roles: ['job_seeker', 'hr_recruiter'],
  },
];

async function seedTestUsers() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const userTypes = await UserType.find();
    console.log(`📋 Found ${userTypes.length} user types`);

    const userTypeMap: Record<string, string> = {};
    userTypes.forEach((ut) => {
      userTypeMap[ut.user_type_name] = ut._id.toString();
    });

    for (const testUser of testUsers) {
      const existingUser = await UserAccount.findOne({ email: testUser.email });
      
      if (existingUser) {
        console.log(`⚠️ User already exists: ${testUser.email}`);
        
        const existingRoles = await UserRole.find({ user_id: existingUser._id });
        if (existingRoles.length === 0) {
          for (const roleType of testUser.roles) {
            await UserRole.create({
              user_id: existingUser._id,
              role_type: roleType,
              status: 'approved',
              is_active: roleType === testUser.roles[0],
            });
          }
          console.log(`  ✅ Created roles for existing user: ${testUser.roles.join(', ')}`);
        }

        const existingCredit = await UserCredit.findOne({ user_id: existingUser._id });
        if (!existingCredit) {
          await UserCredit.create({
            user_id: existingUser._id,
            current_balance: 50,
            total_earned: 50,
            total_spent: 0,
            level: 'bronze',
          });
          console.log(`  ✅ Created credit for existing user`);
        }

        continue;
      }

      const userTypeId = userTypeMap[testUser.user_type_name];

      if (!userTypeId) {
        console.log(`❌ User type not found: ${testUser.user_type_name}`);
        continue;
      }

      const user = await UserAccount.create({
        user_type_id: userTypeId,
        email: testUser.email,
        password: testUser.password,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        registration_date: new Date(),
        sms_notification_active: false,
        email_notification_active: true,
        is_active: true,
      });

      console.log(`✅ Created user: ${testUser.email}`);

      for (const roleType of testUser.roles) {
        await UserRole.create({
          user_id: user._id,
          role_type: roleType,
          status: 'approved',
          is_active: roleType === testUser.roles[0],
        });
      }
      console.log(`  ✅ Created roles: ${testUser.roles.join(', ')}`);

      await UserCredit.create({
        user_id: user._id,
        current_balance: 50,
        total_earned: 50,
        total_spent: 0,
        level: 'bronze',
      });
      console.log(`  ✅ Created credit with initial balance: 50`);
    }

    console.log('\n🎉 Test users seeding completed!');
    console.log('\nTest Credentials:');
    console.log('------------------');
    testUsers.forEach((u) => {
      console.log(`  ${u.user_type_name}: ${u.email} / ${u.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

seedTestUsers();
