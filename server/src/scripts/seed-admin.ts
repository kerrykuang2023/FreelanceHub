import mongoose from 'mongoose';
import UserType from '../models/user/user-type.model';
import UserAccount from '../models/user/user-account.model';
import bcrypt from 'bcrypt';
import UserRole from '../models/user/user-role.model';
import UserCredit from '../models/credit/user-credit.model';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/job-portal';

async function seedAdminTypeAndUser() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    let adminType = await UserType.findOne({ user_type_name: 'admin' });
    
    if (!adminType) {
      adminType = await UserType.create({
        user_type_name: 'admin',
        user_type_display_name: '管理员',
      });
      console.log('✅ Created admin user type');
    } else {
      console.log('⚠️ Admin user type already exists');
    }

    const existingAdmin = await UserAccount.findOne({ email: 'admin@test.com' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      
      const existingRoles = await UserRole.find({ user_id: existingAdmin._id });
      if (existingRoles.length === 0) {
        await UserRole.create({
          user_id: existingAdmin._id,
          role_type: 'admin',
          status: 'approved',
          is_active: true,
        });
        console.log('  ✅ Created admin role for existing user');
      }

      const existingCredit = await UserCredit.findOne({ user_id: existingAdmin._id });
      if (!existingCredit) {
        await UserCredit.create({
          user_id: existingAdmin._id,
          current_balance: 100,
          total_earned: 100,
          total_spent: 0,
          level: 'bronze',
        });
        console.log('  ✅ Created credit for existing admin');
      }
    } else {
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      
      const admin = await UserAccount.create({
        user_type_id: adminType._id,
        email: 'admin@test.com',
        password: hashedPassword,
        first_name: 'System',
        last_name: 'Admin',
        registration_date: new Date(),
        sms_notification_active: false,
        email_notification_active: true,
        is_active: true,
      });

      console.log('✅ Created admin user: admin@test.com');

      await UserRole.create({
        user_id: admin._id,
        role_type: 'admin',
        status: 'approved',
        is_active: true,
      });
      console.log('  ✅ Created admin role');

      await UserCredit.create({
        user_id: admin._id,
        current_balance: 100,
        total_earned: 100,
        total_spent: 0,
        level: 'bronze',
      });
      console.log('  ✅ Created credit with initial balance: 100');
    }

    console.log('\n🎉 Admin setup completed!');
    console.log('\nAdmin Credentials:');
    console.log('  admin@test.com / Test1234!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

seedAdminTypeAndUser();
