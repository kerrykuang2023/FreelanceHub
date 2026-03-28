const mongoose = require('mongoose');

const db = mongoose.connection.db;

async function fixHRApplicationData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');

    console.log('\n========================================');
    console.log('  修复 HR 申请数据关联');
    console.log('========================================\n');

    const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });
    const hrCompanyId = hrUser.company_id;
    console.log(`HR company_id: ${hrCompanyId}`);

    const applications = await db.collection('job_post_activity').find({
      job_post_id: { $in: hrJobs.map(j => j._id) }
    }).toArray();
    
    console.log(`HR 的职位关联的申请数: ${applications.length}`);
    applications.forEach(app => {
      console.log(`  申请 ${app._id} 关联职位 ${app.job_post_id}, 状态: ${app.status}`);
    });

    if (applications.length === 0) {
      const jobs = await db.collection('job_post').find({
        company_id: hrCompanyId
      }).toArray();
      
      console.log(`HR 公司关联的职位数: ${jobs.length}`);
      jobs.forEach(job => {
        console.log(`  职位 ${job._id}, 公司: ${job.company_id}`);
      });

      const newApplications = [];
      for (const job of jobs) {
        const newApp = {
          user_account_id: hrUser._id,
          freelancer_id: freelancerProfile._id,
          job_post_id: job._id,
          company_id: hrCompanyId,
          application_type: 'job',
          apply_date: new Date(),
          status: 'pending',
          cover_letter: '测试申请 - 巌作台数据验证',
          expected_rate: 2000,
          availability: '立即可用',
        };
        await db.collection('job_post_activity').insertOne(newApp);
      });
    }

    
    console.log(`创建新申请: ${newApplications.insertedCount} 个`);
    }

    const hrApplications = await db.collection('job_post_activity').find({
      job_post_id: { $in: jobs.map(j => j._id) }
    }).toArray();
    
    console.log(`修复后 HR 收到的申请数: ${hrApplications.length}`);
    hrApplications.forEach(app => {
      console.log(`  申请 ${app._id} 关联职位 ${app.job_post_id}, 状态: ${app.status}`);
    });

    await mongoose.disconnect();
    
    console.log('\n✅ 修复完成！');
    console.log('请重新运行测试验证修复效果');
  } catch (error) {
    console.error('❌ 修复失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixHRApplicationData();
