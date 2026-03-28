const mongoose = require('mongoose');

async function initDashboardTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    const db = mongoose.connection.db;

    console.log('\n========================================');
    console.log('  工作台数据测试初始化');
    console.log('========================================\n');

    const now = new Date();
    const timestamp = Date.now();

    const freelancerUser = await db.collection('user_account').findOne({ email: 'freelancer@test.com' });
    const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });
    const adminUser = await db.collection('user_account').findOne({ email: 'admin@test.com' });

    if (!freelancerUser || !hrUser) {
      console.log('❌ 测试用户不存在，请先运行基础数据初始化');
      return;
    }

    console.log('✅ 找到测试用户:');
    console.log(`   - Freelancer: ${freelancerUser.email} (${freelancerUser._id})`);
    console.log(`   - HR: ${hrUser.email} (${hrUser._id})`);

    let company = await db.collection('company').findOne({ company_name: '工作台测试公司' });
    if (!company) {
      const companyResult = await db.collection('company').insertOne({
        company_name: '工作台测试公司',
        company_code: `DASHBOARD-${timestamp}`,
        status: 'active',
        created_at: now,
        updated_at: now
      });
      company = { _id: companyResult.insertedId, company_name: '工作台测试公司' };
    }
    console.log(`✅ 公司: ${company.company_name} (${company._id})`);

    await db.collection('user_account').updateOne(
      { _id: hrUser._id },
      { $set: { company_id: company._id, updated_at: now } }
    );
    console.log(`✅ 更新 HR 用户的 company_id`);

    let freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser._id });
    if (!freelancerProfile) {
      const profileResult = await db.collection('freelancer_profile').insertOne({
        user_id: freelancerUser._id,
        display_name: freelancerUser.user_name || '测试顾问',
        headline: '资深技术顾问',
        summary: '10年+企业级应用开发经验',
        freelancer_type: '独立顾问',
        years_of_experience: 10,
        availability_status: 'open_to_opportunities',
        is_active: true,
        profile_completion: 80,
        created_at: now,
        updated_at: now
      });
      freelancerProfile = { _id: profileResult.insertedId };
    }
    console.log(`✅ Freelancer Profile: ${freelancerProfile._id}`);

    const existingJobs = await db.collection('job_post').find({
      company_id: company._id
    }).toArray();

    let job1, job2, job3;

    if (existingJobs.length === 0) {
      const jobsData = [
        {
          posted_by: hrUser._id,
          company_id: company._id,
          job_title: 'SAP S/4HANA 实施顾问',
          job_description: '负责 SAP S/4HANA 项目的实施和配置工作',
          status: 'published',
          is_active: true,
          job_nature: '自由顾问',
          work_format: '远程',
          rate_type: '日薪',
          rate_amount: 3000,
          rate_currency: 'CNY',
          project_cycle: '6个月',
          hiring_count: 2,
          created_date: now,
          createdAt: now,
          updatedAt: now
        },
        {
          posted_by: hrUser._id,
          company_id: company._id,
          job_title: 'ABAP 开发工程师',
          job_description: '负责 ABAP 程序开发和系统优化',
          status: 'in_progress',
          is_active: true,
          job_nature: '自由顾问',
          work_format: '混合',
          rate_type: '日薪',
          rate_amount: 2500,
          rate_currency: 'CNY',
          project_cycle: '3个月',
          hiring_count: 1,
          assigned_freelancers: [freelancerProfile._id],
          created_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: now
        },
        {
          posted_by: hrUser._id,
          company_id: company._id,
          job_title: 'Fiori 前端开发',
          job_description: '负责 SAP Fiori 应用的开发和设计',
          status: 'published',
          is_active: true,
          job_nature: '兼职',
          work_format: '远程',
          rate_type: '日薪',
          rate_amount: 2000,
          rate_currency: 'CNY',
          project_cycle: '1个月',
          hiring_count: 1,
          created_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: now
        }
      ];

      const jobsResult = await db.collection('job_post').insertMany(jobsData);
      const jobIds = Object.values(jobsResult.insertedIds);
      job1 = { _id: jobIds[0], ...jobsData[0] };
      job2 = { _id: jobIds[1], ...jobsData[1] };
      job3 = { _id: jobIds[2], ...jobsData[2] };
      console.log(`✅ 创建职位: ${jobsResult.insertedCount} 个`);
    } else {
      job1 = existingJobs.find(j => j.status === 'published') || existingJobs[0];
      job2 = existingJobs.find(j => j.status === 'in_progress') || existingJobs[1];
      job3 = existingJobs[2] || existingJobs[0];
      console.log(`✅ 使用现有职位: ${existingJobs.length} 个`);
    }

    const existingApplications = await db.collection('job_post_activity').find({
      user_account_id: freelancerUser._id
    }).toArray();

    let acceptedApp, pendingApp;

    if (existingApplications.length === 0) {
      const applicationsData = [
        {
          user_account_id: freelancerUser._id,
          freelancer_id: freelancerProfile._id,
          job_post_id: job2._id,
          company_id: company._id,
          application_type: 'job',
          apply_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          status: 'accepted',
          cover_letter: '我有丰富的 SAP 实施经验，希望能参与这个项目。',
          expected_rate: 2800,
          availability: '立即可用',
          reviewed_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
          reviewed_by: hrUser._id,
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
        },
        {
          user_account_id: freelancerUser._id,
          freelancer_id: freelancerProfile._id,
          job_post_id: job1._id,
          company_id: company._id,
          application_type: 'job',
          apply_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          status: 'pending',
          cover_letter: '我对这个职位很感兴趣。',
          expected_rate: 3000,
          availability: '一周内可到岗',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          user_account_id: freelancerUser._id,
          freelancer_id: freelancerProfile._id,
          job_post_id: job3._id,
          company_id: company._id,
          application_type: 'job',
          apply_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          status: 'pending',
          cover_letter: '我有 Fiori 开发经验。',
          expected_rate: 2200,
          availability: '立即可用',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        }
      ];

      const appsResult = await db.collection('job_post_activity').insertMany(applicationsData);
      const appIds = Object.values(appsResult.insertedIds);
      acceptedApp = { _id: appIds[0], ...applicationsData[0] };
      pendingApp = { _id: appIds[1], ...applicationsData[1] };
      console.log(`✅ 创建申请: ${appsResult.insertedCount} 个`);
    } else {
      acceptedApp = existingApplications.find(a => a.status === 'accepted') || existingApplications[0];
      pendingApp = existingApplications.find(a => a.status === 'pending') || existingApplications[1];
      console.log(`✅ 使用现有申请: ${existingApplications.length} 个`);
    }

    console.log('\n========================================');
    console.log('  数据验证');
    console.log('========================================\n');

    const updatedHrUser = await db.collection('user_account').findOne({ _id: hrUser._id });
    console.log(`HR 用户 company_id: ${updatedHrUser?.company_id}`);

    const hrJobs = await db.collection('job_post').find({
      $or: [
        { company_id: updatedHrUser?.company_id },
        { posted_by: hrUser._id }
      ]
    }).toArray();
    console.log(`HR 发布的职位: ${hrJobs.length} 个`);

    const hrApplications = await db.collection('job_post_activity').find({
      job_post_id: { $in: hrJobs.map(j => j._id) }
    }).toArray();
    console.log(`HR 收到的申请: ${hrApplications.length} 个`);

    const freelancerAcceptedApps = await db.collection('job_post_activity').find({
      user_account_id: freelancerUser._id,
      status: 'accepted'
    }).toArray();
    console.log(`Freelancer 已接受的申请: ${freelancerAcceptedApps.length} 个`);

    const freelancerProjects = await db.collection('job_post').find({
      $or: [
        { _id: { $in: freelancerAcceptedApps.map(a => a.job_post_id) } },
        { assigned_freelancers: freelancerProfile._id }
      ],
      status: { $in: ['published', 'in_progress'] }
    }).toArray();
    console.log(`Freelancer 进行中的项目: ${freelancerProjects.length} 个`);

    console.log('\n✅ 工作台数据初始化完成！\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initDashboardTestData();
