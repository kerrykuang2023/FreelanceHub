const mongoose = require('mongoose');

async function testAPIs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    const db = mongoose.connection.db;

    console.log('\n========================================');
    console.log('  模拟 API 调用测试');
    console.log('========================================\n');

    const freelancerUser = await db.collection('user_account').findOne({ email: 'freelancer@test.com' });
    const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });

    console.log('=== 模拟 getMyProjects API ===');
    console.log(`Freelancer user_id: ${freelancerUser._id}`);
    
    const freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser._id });
    console.log(`Freelancer profile_id: ${freelancerProfile?._id}`);

    const JobPostActivity = mongoose.model('JobPostActivity');
    
    const acceptedApplications = await db.collection('job_post_activity').find({
      user_account_id: freelancerUser._id,
      status: 'accepted'
    }).toArray();
    
    console.log(`已接受的申请: ${acceptedApplications.length}`);
    const projectIds = acceptedApplications.map(app => app.job_post_id);
    console.log(`项目 IDs: ${projectIds.map(id => id.toString())}`);

    const projects = await db.collection('job_post').find({
      $or: [
        { _id: { $in: projectIds } },
        { assigned_freelancers: freelancerProfile._id }
      ],
      status: { $in: ['published', 'in_progress'] }
    }).toArray();

    console.log(`找到的项目: ${projects.length}`);
    projects.forEach(p => {
      console.log(`  - ${p.job_title}, 状态: ${p.status}`);
    });

    console.log('\n=== 模拟 getMyPostedJobs API ===');
    console.log(`HR user_id: ${hrUser._id}`);
    console.log(`HR company_id: ${hrUser.company_id}`);

    const userAccount = await db.collection('user_account').findOne({ _id: hrUser._id });
    let companyQuery = {};
    
    if (userAccount?.company_id) {
      companyQuery.company_id = userAccount.company_id;
    } else {
      companyQuery.posted_by = hrUser._id;
    }
    
    console.log(`查询条件: ${JSON.stringify(companyQuery)}`);

    const hrJobs = await db.collection('job_post').find({
      ...companyQuery,
      is_active: true
    }).toArray();

    console.log(`HR 的职位: ${hrJobs.length}`);
    hrJobs.forEach(j => {
      console.log(`  - ${j.job_title}, 状态: ${j.status}`);
    });

    console.log('\n=== 模拟 getApplicationsForMyJobs API ===');
    const jobIds = hrJobs.map(j => j._id);
    console.log(`职位 IDs: ${jobIds.map(id => id.toString())}`);

    const applications = await db.collection('job_post_activity').find({
      job_post_id: { $in: jobIds }
    }).toArray();

    console.log(`收到的申请: ${applications.length}`);
    applications.forEach(a => {
      console.log(`  - 申请ID: ${a._id}, 状态: ${a.status}`);
    });

    console.log('\n=== 问题总结 ===');
    if (projects.length === 0) {
      console.log('❌ Freelancer 没有进行中的项目');
    } else {
      console.log(`✅ Freelancer 有 ${projects.length} 个进行中的项目`);
    }

    if (hrJobs.length === 0) {
      console.log('❌ HR 没有发布的职位');
    } else {
      console.log(`✅ HR 有 ${hrJobs.length} 个发布的职位`);
    }

    if (applications.length === 0) {
      console.log('❌ HR 没有收到的申请');
    } else {
      console.log(`✅ HR 有 ${applications.length} 个收到的申请`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ 测试失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testAPIs();
