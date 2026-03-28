const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB 连接配置
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/job-portal';

async function createTestUsers() {
  try {
    // 连接 MongoDB
    await mongoose.connect(MONGO_URL);
    console.log('✓ 已连接到 MongoDB');

    // 定义 Schema
    const UserTypeSchema = new mongoose.Schema({
      user_type_name: String,
      description: String,
    }, { collection: 'user_type' });

    const UserAccountSchema = new mongoose.Schema({
      user_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType' },
      email: String,
      password: String,
      registration_date: Date,
      is_active: Boolean,
    }, { collection: 'user_account', timestamps: true });

    const UserType = mongoose.model('UserType', UserTypeSchema);
    const UserAccount = mongoose.model('UserAccount', UserAccountSchema);

    // 查找或创建用户类型
    let adminType = await UserType.findOne({ user_type_name: 'admin' });
    if (!adminType) {
      adminType = await UserType.create({
        user_type_name: 'admin',
        description: '系统管理员',
      });
      console.log('✓ 创建 admin 用户类型');
    }

    let freelancerType = await UserType.findOne({ user_type_name: 'job_seeker' });
    if (!freelancerType) {
      freelancerType = await UserType.create({
        user_type_name: 'job_seeker',
        description: '自由顾问',
      });
      console.log('✓ 创建 job_seeker 用户类型');
    }

    let companyType = await UserType.findOne({ user_type_name: 'hr' });
    if (!companyType) {
      companyType = await UserType.create({
        user_type_name: 'hr',
        description: '企业用户',
      });
      console.log('✓ 创建 hr 用户类型');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash('Test1234!', 10);

    // 创建测试用户
    const testUsers = [
      {
        email: 'admin@test.com',
        user_type_id: adminType._id,
      },
      {
        email: 'freelancer@test.com',
        user_type_id: freelancerType._id,
      },
      {
        email: 'company@test.com',
        user_type_id: companyType._id,
      },
    ];

    for (const userData of testUsers) {
      // 检查用户是否已存在
      const existingUser = await UserAccount.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠ 用户 ${userData.email} 已存在，跳过`);
        continue;
      }

      // 创建用户
      await UserAccount.create({
        user_type_id: userData.user_type_id,
        email: userData.email,
        password: hashedPassword,
        registration_date: new Date(),
        is_active: true,
      });
      console.log(`✓ 创建测试用户：${userData.email}`);
    }

    console.log('\n========================================');
    console.log('测试账号创建完成！');
    console.log('========================================');
    console.log('账号列表:');
    console.log('管理员：admin@test.com / Test1234!');
    console.log('自由顾问：freelancer@test.com / Test1234!');
    console.log('企业用户：company@test.com / Test1234!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ 已断开 MongoDB 连接');
  }
}

createTestUsers();
