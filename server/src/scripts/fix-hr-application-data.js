const mongoose = require('mongoose');

async function fixHRApplicationData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/freelancehub');
    const db = mongoose.connection.db;

    console.log('\n========================================');
    console.log('  修复 HR 申请数据关联');
    console.log('========================================\n');

    const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });
    const hrCompanyId = hrUser.company_id;
    console.log(`HR company_id: ${hrCompanyId}`);

    const hrJobs = await db.collection('job_post').find({
      company_id: hrCompanyId
    }).toArray();
    
    console.log(`HR 公司关联的职位数: ${hrJobs.length}`);
    const hrJobIds = hrJobs.map(j => j._id);
    
    const applications = await db.collection('job_post_activity').find({
      job_post_id: { $in: hrJobIds }
    }).toArray();
    
    console.log(`HR 的职位关联的申请�? ${applications.length}`);

    if (applications.length === 0 && hrJobs.length > 0) {
      console.log('没有找到关联的申请，创建新的申请...');
      
      const freelancerUser = await db.collection('user_account').findOne({ email: 'freelancer@test.com' });
      const freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser._id });
      
      if (!freelancerProfile) {
        console.log('�?未找�?Freelancer Profile');
        await mongoose.disconnect();
        return;
      }

      console.log(`Freelancer Profile ID: ${freelancerProfile._id}`);

      const newApplications = [];
      for (const job of hrJobs) {
        newApplications.push({
          user_account_id: freelancerUser._id,
          freelancer_id: freelancerProfile._id,
          job_post_id: job._id,
          company_id: hrCompanyId,
          application_type: 'job',
          apply_date: new Date(),
          status: 'pending',
          cover_letter: '测试申请 - 工作台数据验�?,
          expected_rate: 2000,
          availability: '立即可用',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      const result = await db.collection('job_post_activity').insertMany(newApplications);
      console.log(`创建新申�? ${result.insertedCount} 个`);
    }

    const hrApplications = await db.collection('job_post_activity').find({
      job_post_id: { $in: hrJobIds }
    }).toArray();
    
    console.log(`修复�?HR 收到的申请数: ${hrApplications.length}`);
    hrApplications.forEach(app => {
      console.log(`  申请 ${app._id} 关联职位 ${app.job_post_id}, 状�? ${app.status}`);
    });

    await mongoose.disconnect();
    
    console.log('\n�?修复完成!');
  } catch (error) {
    console.error('�?修复失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixHRApplicationData();
