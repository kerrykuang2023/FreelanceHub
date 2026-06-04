const mongoose = require('mongoose');

async function testHRWorkLogsAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/freelancehub');
    const db = mongoose.connection.db;
    
    console.log('\n========================================');
    console.log('  测试 HR 工时 API 逻辑');
    console.log('========================================\n');
    
    // 模拟 API 逻辑
    const hrUserId = '69c24caad1b318092a9e5db6';
    
    // Step 1: 获取 HR 用户
    const userAccount = await db.collection('user_account').findOne({ _id: new mongoose.Types.ObjectId(hrUserId) });
    console.log('Step 1: HR 用户信息');
    console.log('  _id:', userAccount._id);
    console.log('  email:', userAccount.email);
    console.log('  company_id:', userAccount.company_id);
    
    if (!userAccount.company_id) {
      console.log('�?HR 用户没有 company_id，API 会返回空数组');
      await mongoose.disconnect();
      return;
    }
    
    // Step 2: 查找属于该公司的项目
    const projectRequirements = await db.collection('projectrequirements')
      .find({ company_id: userAccount.company_id })
      .project({ _id: 1 })
      .toArray();
    
    const projectIds = projectRequirements.map(p => p._id);
    console.log('\nStep 2: HR 公司的项�?);
    console.log('  项目数量:', projectIds.length);
    console.log('  项目 IDs:', projectIds);
    
    if (projectIds.length === 0) {
      console.log('�?HR 公司没有项目，API 会返回空数组');
      await mongoose.disconnect();
      return;
    }
    
    // Step 3: 查找关联到这些项目的工时
    const workLogs = await db.collection('work_log')
      .find({ project_requirement_id: { $in: projectIds } })
      .toArray();
    
    console.log('\nStep 3: HR 公司项目的工�?);
    console.log('  工时数量:', workLogs.length);
    
    // 检查工时状态分�?
    const statusCount = {};
    for (const w of workLogs) {
      statusCount[w.status] = (statusCount[w.status] || 0) + 1;
    }
    console.log('  状态分�?', statusCount);
    
    // Step 4: 检查工时的 project_requirement_id 是否正确
    console.log('\nStep 4: 工时详情');
    for (const w of workLogs) {
      console.log(`  工时 ${w._id}:`);
      console.log(`    project_requirement_id: ${w.project_requirement_id}`);
      console.log(`    status: ${w.status}`);
      console.log(`    company_id: ${w.company_id}`);
      console.log(`    项目匹配: ${projectIds.some(p => p.toString() === w.project_requirement_id?.toString()) ? '�? : '�?}`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('错误:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testHRWorkLogsAPI();
