const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    const db = mongoose.connection.db;
    
    console.log('\n========================================');
    console.log('  检查 HR 审批数据关联');
    console.log('========================================\n');
    
    // 检查 HR 用户
    const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });
    console.log('HR 用户:');
    console.log('  _id:', hrUser?._id?.toString());
    console.log('  company_id:', hrUser?.company_id?.toString());
    
    // 检查公司
    const companies = await db.collection('company').find({}).toArray();
    console.log('\n公司列表:');
    for (const c of companies) {
      console.log('  ', c._id.toString(), '-', c.company_name);
    }
    
    // 检查项目
    const projects = await db.collection('projectrequirements').find({}).toArray();
    console.log('\n项目列表:');
    for (const p of projects) {
      console.log('  ', p._id.toString(), '- company_id:', p.company_id?.toString());
    }
    
    // 检查工时
    const workLogs = await db.collection('work_log').find({ status: 'submitted' }).toArray();
    console.log('\n待审批工时:');
    for (const w of workLogs) {
      console.log('  ', w._id.toString());
      console.log('    company_id:', w.company_id?.toString());
      console.log('    project_id:', w.project_requirement_id?.toString());
    }
    
    // 关键检查：HR company_id 与工时 company_id 是否匹配
    console.log('\n========================================');
    console.log('  关键关联检查');
    console.log('========================================\n');
    
    if (hrUser?.company_id) {
      const hrCompanyId = hrUser.company_id.toString();
      const matchingWorkLogs = workLogs.filter(w => 
        w.company_id?.toString() === hrCompanyId
      );
      console.log(`HR company_id: ${hrCompanyId}`);
      console.log(`匹配的待审批工时: ${matchingWorkLogs.length} 条`);
      
      // 检查项目关联
      const matchingProjects = projects.filter(p => 
        p.company_id?.toString() === hrCompanyId
      );
      console.log(`HR 公司的项目: ${matchingProjects.length} 个`);
      
      // 检查工时的项目是否属于 HR 公司
      for (const w of workLogs) {
        const project = projects.find(p => p._id.toString() === w.project_requirement_id?.toString());
        if (project) {
          const belongsToHRCompany = project.company_id?.toString() === hrCompanyId;
          console.log(`工时 ${w._id} 的项目属于 HR 公司: ${belongsToHRCompany}`);
        }
      }
    } else {
      console.log('❌ HR 用户没有 company_id！');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('错误:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkData();
