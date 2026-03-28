import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserAccount from '../models/user/user-account.model';
import UserType from '../models/user/user-type.model';

const MONGO_URL = 'mongodb://localhost:27017/job-portal';

async function createTestUsers() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const userTypes = await UserType.find({});
    console.log('User types:', userTypes.map(ut => ({ id: ut._id, name: ut.user_type_name })));

    const testUsers = [
      {
        email: 'admin@test.com',
        password: 'Test1234!',
        first_name: 'Admin',
        last_name: 'User',
        user_type_name: 'admin'
      },
      {
        email: 'freelancer@test.com',
        password: 'Test1234!',
        first_name: 'Freelancer',
        last_name: 'User',
        user_type_name: 'freelancer'
      },
      {
        email: 'company@test.com',
        password: 'Test1234!',
        first_name: 'Company',
        last_name: 'User',
        user_type_name: 'company_user'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await UserAccount.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️ User already exists: ${userData.email}`);
        continue;
      }

      const userType = await UserType.findOne({ user_type_name: userData.user_type_name });
      
      if (!userType) {
        console.log(`❌ User type not found: ${userData.user_type_name}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = new UserAccount({
        email: userData.email,
        password: hashedPassword,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type_id: userType._id
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.user_type_name})`);
    }

    const allUsers = await UserAccount.find({}).populate('user_type_id');
    console.log('\n📋 All users:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${(u.user_type_id as any)?.user_type_name || 'no type'})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUsers();