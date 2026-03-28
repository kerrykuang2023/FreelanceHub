import mongoose from 'mongoose';
import UserAccount from '../models/user/user-account.model';
import UserType from '../models/user/user-type.model';
import UserRole from '../models/user/user-role.model';
import UserCredit from '../models/credit/user-credit.model';

const MONGO_URL = 'mongodb://localhost:27017/job-portal';

async function fixUsers() {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Connected to MongoDB');

  const userTypes = await UserType.find();
  const userTypeMap: Record<string, string> = {};
  userTypes.forEach((ut) => {
    userTypeMap[ut.user_type_name] = ut._id.toString();
  });

  const users = [
    { email: 'hr@test.com', first_name: 'HR', last_name: 'User', type: 'hr_recruiter' },
    { email: 'admin@test.com', first_name: 'Admin', last_name: 'User', type: 'admin' },
  ];

  for (const u of users) {
    const existing = await UserAccount.findOne({ email: u.email });
    if (existing) {
      existing.password = 'Test1234!';
      existing.first_name = u.first_name;
      existing.last_name = u.last_name;
      await existing.save();
      console.log(`✅ Updated password for: ${u.email}`);
    } else {
      const user = await UserAccount.create({
        user_type_id: userTypeMap[u.type],
        email: u.email,
        password: 'Test1234!',
        first_name: u.first_name,
        last_name: u.last_name,
        registration_date: new Date(),
        sms_notification_active: false,
        email_notification_active: true,
        is_active: true,
      });
      console.log(`✅ Created user: ${u.email}`);

      await UserRole.create({
        user_id: user._id,
        role_type: u.type,
        status: 'approved',
        is_active: true,
      });

      await UserCredit.create({
        user_id: user._id,
        current_balance: 50,
        total_earned: 50,
        total_spent: 0,
        level: 'bronze',
      });
    }
  }

  console.log('\n✅ Done! Passwords have been reset to: Test1234!');
  await mongoose.disconnect();
}

fixUsers();
