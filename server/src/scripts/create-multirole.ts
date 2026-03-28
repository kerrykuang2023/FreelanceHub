import mongoose from 'mongoose';
import UserAccount from '../models/user/user-account.model';
import UserType from '../models/user/user-type.model';
import UserRole from '../models/user/user-role.model';
import UserCredit from '../models/credit/user-credit.model';

const MONGO_URL = 'mongodb://localhost:27017/job-portal';

async function createMultiRoleUser() {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Connected to MongoDB');

  const userTypes = await UserType.find();
  const userTypeMap: Record<string, string> = {};
  userTypes.forEach((ut) => {
    userTypeMap[ut.user_type_name] = ut._id.toString();
  });

  const existing = await UserAccount.findOne({ email: 'multirole@test.com' });
  
  if (existing) {
    existing.password = 'Test1234!';
    await existing.save();
    console.log('✅ Updated password for multirole@test.com');
    
    const existingRoles = await UserRole.find({ user_id: existing._id });
    if (existingRoles.length === 0) {
      await UserRole.create([
        { user_id: existing._id, role_type: 'job_seeker', status: 'approved', is_active: true },
        { user_id: existing._id, role_type: 'hr_recruiter', status: 'approved', is_active: false },
      ]);
      console.log('✅ Created roles for multirole user');
    }
  } else {
    const user = await UserAccount.create({
      user_type_id: userTypeMap['job_seeker'],
      email: 'multirole@test.com',
      password: 'Test1234!',
      first_name: 'Multi',
      last_name: 'Role',
      registration_date: new Date(),
      sms_notification_active: false,
      email_notification_active: true,
      is_active: true,
    });
    console.log('✅ Created user: multirole@test.com');

    await UserRole.create([
      { user_id: user._id, role_type: 'job_seeker', status: 'approved', is_active: true },
      { user_id: user._id, role_type: 'hr_recruiter', status: 'approved', is_active: false },
    ]);
    console.log('✅ Created roles: job_seeker, hr_recruiter');

    await UserCredit.create({
      user_id: user._id,
      current_balance: 50,
      total_earned: 50,
      total_spent: 0,
      level: 'bronze',
    });
    console.log('✅ Created credit');
  }

  console.log('\n✅ Done!');
  await mongoose.disconnect();
}

createMultiRoleUser();
