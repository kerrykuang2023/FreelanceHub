const mongoose = require('mongoose');

async function cleanTestData() {
  await mongoose.connect('mongodb://localhost:27017/freelancehub');
  const db = mongoose.connection.db;
  
  // 删除旧的工时记录
  const result = await db.collection('work_log').deleteMany({
    work_description: { $regex: 'E2E测试工时' }
  });
  console.log('删除工时记录:', result.deletedCount);
  
  await mongoose.disconnect();
  console.log('清理完成');
}

cleanTestData().catch(console.error);
