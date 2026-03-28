const mongoose = require('mongoose');
const UserAccount = require('./models/user/user-account.model').default;

async function testUserAccountModel() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    
    console.log('\n========================================');
    console.log('  测试 UserAccount 模型');
    console.log('========================================\n');
    
    const userId = '69c24caad1b318092a9e5db6';
    
    // 使用原生 MongoDB 查询
    const rawUser = await mongoose.connection.db.collection('user_account').findOne({ 
      _id: new mongoose.Types.ObjectId(userId) 
    });
    console.log('原生 MongoDB 查询:');
    console.log('  company_id:', rawUser.company_id);
    
    // 使用 Mongoose 模型查询
    const modelUser = await UserAccount.findById(userId);
    console.log('\nMongoose 模型查询:');
    console.log('  company_id:', modelUser?.company_id);
    console.log('  company_id type:', typeof modelUser?.company_id);
    
    // 检查 company_id 是否为 ObjectId
    if (modelUser?.company_id) {
      console.log('  company_id toString:', modelUser.company_id.toString());
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('错误:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testUserAccountModel();
