const mongoose = require('mongoose');

async function checkDashboardData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    const db = mongoose.connection.db;

    console.log('\n========================================');
    console.log('  检查工作台数据关联');
    console.log('========================================\n');

    const freelancerUser = await db.collection('user_account').findOne({ email: 'freelancer@test.com' });
    const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });

    console.log('=== 用户信息 ===');
    console.log(`Freelancer ID: ${freelancerUser?._id}`);
    console.log(`HR ID: ${hrUser?._id}`);
    console.log(`HR company_id: ${hrUser?.company_id}`);

    const freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser?._id });
    console.log(`\nFreelancer Profile ID: ${freelancerProfile?._id}`);

    console.log('\n=== 检查申请数据 ===');
    const allApplications = await db.collection('job_post_activity').find({}).toArray();
    console.log(`总申请数: ${allApplications.length}`);
    
    const freelancerApps = await db.collection('job_post_activity').find({
      user_account_id: freelancerUser?._id
    }).toArray();
    console.log(`Freelancer 的申请: ${freelancerApps.length}`);
    freelancerApps.forEach(app => {
      console.log(`  - 申请ID: ${app._id}, 状态: ${app.status}, 职位ID: ${app.job_post_id}`);
    });

    console.log('\n=== 检查职位数据 ===');
    const allJobs = await db.collection('job_post').find({}).toArray();
    console.log(`总职位数: ${allJobs.length}`);

    const hrJobs = await db.collection('job_post').find({
      $or: [
        { posted_by: hrUser?._id },
        { company_id: hrUser?.company_id }
      ]
    }).toArray();
    console.log(`HR 的职位: ${hrJobs.length}`);
    hrJobs.forEach(job => {
      console.log(`  - 职位ID: ${job._id}, 标题: ${job.job_title}, 状态: ${job.status}, company_id: ${job.company_id}`);
    });

    console.log('\n=== 检查数据关联 ===');
    
    const acceptedApps = await db.collection('job_post_activity').find({
      user_account_id: freelancerUser?._id,
      status: 'accepted'
    }).toArray();
    console.log(`Freelancer 已接受的申请: ${acceptedApps.length}`);

    if (acceptedApps.length > 0) {
      const acceptedJobIds = acceptedApps.map(a => a.job_post_id);
      const projects = await db.collection('job_post').find({
        _id: { $in: acceptedJobIds },
        status: { $in: ['published', 'in_progress'] }
      }).toArray();
      console.log(`Freelancer 进行中的项目 (通过已接受申请): ${projects.length}`);
      projects.forEach(p => {
        console.log(`  - ${p.job_title}, 状态: ${p.status}`);
      });
    }

    const assignedProjects = await db.collection('job_post').find({
      assigned_freelancers: freelancerProfile?._id,
      status: { $in: ['published', 'in_progress'] }
    }).toArray();
    console.log(`Freelancer 被分配的项目: ${assignedProjects.length}`);
    assignedProjects.forEach(p => {
      console.log(`  - ${p.job_title}, 状态: ${p.status}`);
    });

    console.log('\n=== HR 收到的申请 ===');
    const hrJobIds = hrJobs.map(j => j._id);
    const hrApplications = await db.collection('job_post_activity').find({
      job_post_id: { $in: hrJobIds }
    }).toArray();
    console.log(`HR 收到的申请: ${hrApplications.length}`);
    hrApplications.forEach(app => {
      console.log(`  - 申请ID: ${app._id}, 状态: ${app.status}`);
    });

    console.log('\n=== 问题诊断 ===');
    
    if (!hrUser?.company_id) {
      console.log('❌ HR 用户没有 company_id');
    } else {
      console.log('✅ HR 用户有 company_id');
    }

    if (hrJobs.length === 0) {
      console.log('❌ HR 没有发布的职位');
    } else {
      console.log('✅ HR 有发布的职位');
    }

    if (freelancerApps.length === 0) {
      console.log('❌ Freelancer 没有申请记录');
    } else {
      console.log('✅ Freelancer 有申请记录');
    }

    if (acceptedApps.length === 0) {
      console.log('❌ Freelancer 没有已接受的申请');
    } else {
      console.log('✅ Freelancer 有已接受的申请');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ 检查失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkDashboardData();
