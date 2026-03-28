const mongoose = require('mongoose');

async function initApprovalTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    const db = mongoose.connection.db;

    console.log('\n========================================');
    console.log('  审批流程测试数据初始化');
    console.log('========================================\n');

    // 1. 获取测试用户
    const freelancerUser = await db.collection('user_account').findOne({ email: 'freelancer@test.com' });
    const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });
    const adminUser = await db.collection('user_account').findOne({ email: 'admin@test.com' });

    if (!freelancerUser || !hrUser || !adminUser) {
      console.log('❌ 测试用户不存在，请先运行基础数据初始化');
      return;
    }

    // 2. 获取求职者档案
    let freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser._id });
    if (!freelancerProfile) {
      const profileResult = await db.collection('freelancer_profile').insertOne({
        user_id: freelancerUser._id,
        full_name: freelancerUser.user_name || '测试求职者',
        email: freelancerUser.email,
        phone: '13800138000',
        skills: ['SAP', 'ABAP', 'Fiori'],
        experience_years: 5,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      freelancerProfile = { _id: profileResult.insertedId, user_id: freelancerUser._id };
    }
    const freelancerId = freelancerProfile._id;

    // 3. 获取或创建公司（确保公司存在）
    let company = await db.collection('company').findOne({ company_name: '审批测试公司' });
    if (!company) {
      const companyResult = await db.collection('company').insertOne({
        company_name: '审批测试公司',
        company_code: 'APPROVAL-TEST-001',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      company = { _id: companyResult.insertedId, company_name: '审批测试公司' };
    }
    console.log(`✅ 公司: ${company.company_name} (${company._id})`);

    // 3.1 更新 HR 用户的 company_id（关键修复！）
    await db.collection('user_account').updateOne(
      { _id: hrUser._id },
      { $set: { company_id: company._id, updated_at: new Date() } }
    );
    console.log(`✅ 已更新 HR 用户(${hrUser.email})的 company_id 为: ${company._id}`);

    // 4. 获取或创建项目（确保项目属于正确的公司）
    // 注意：使用正确的集合名 project_requirement（模型定义的集合名）
    let project = await db.collection('project_requirement').findOne({ 
      job_title: '审批测试项目',
      company_id: company._id
    });
    if (!project) {
      const projectResult = await db.collection('project_requirement').insertOne({
        job_title: '审批测试项目',
        project_title: '审批测试项目',
        job_description: '用于审批流程测试的项目',
        project_description: '用于审批流程测试的项目',
        status: '进行中',
        company_id: company._id,
        posted_by: freelancerUser._id,
        created_at: new Date(),
        updated_at: new Date()
      });
      project = { _id: projectResult.insertedId, job_title: '审批测试项目' };
    }
    console.log(`✅ 项目: ${project.job_title} (${project._id})`);

    // 5. 获取或创建挂靠关系
    let affiliation = await db.collection('freelancer_affiliation').findOne({
      freelancer_id: freelancerId,
      company_id: company._id
    });
    if (!affiliation) {
      const affiliationResult = await db.collection('freelancer_affiliation').insertOne({
        freelancer_id: freelancerId,
        company_id: company._id,
        status: 'active',
        start_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
      affiliation = { _id: affiliationResult.insertedId };
    }

    // 6. 清理旧的审批测试数据
    await db.collection('work_log').deleteMany({
      work_description: { $regex: '审批测试' }
    });
    await db.collection('freelancer_invoice').deleteMany({
      description: { $regex: '审批测试' }
    });

    // 7. 创建审批测试工时记录（确保 company_id 正确）
    const workLogsData = [
      {
        freelancer_id: freelancerId,
        project_requirement_id: project._id,
        company_id: company._id,
        affiliation_id: affiliation._id,
        work_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        work_period_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
        work_period_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
        hours_worked: 8,
        work_type: '远程工作',
        work_description: '审批测试工时-待审批',
        status: 'submitted',
        billing_info: {
          daily_rate: 2000,
          hours_billable: 8,
          amount: 2000,
          currency: 'CNY',
          is_tax_inclusive: false,
          tax_rate: 0.06,
          tax_amount: 120,
          total_amount: 2120
        },
        submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        freelancer_id: freelancerId,
        project_requirement_id: project._id,
        company_id: company._id,
        affiliation_id: affiliation._id,
        work_date: new Date(),
        work_period_start: new Date(Date.now() + 9 * 60 * 60 * 1000),
        work_period_end: new Date(Date.now() + 18 * 60 * 60 * 1000),
        hours_worked: 8,
        work_type: '远程工作',
        work_description: '审批测试工时-草稿',
        status: 'draft',
        billing_info: {
          daily_rate: 2000,
          hours_billable: 8,
          amount: 2000,
          currency: 'CNY',
          is_tax_inclusive: false,
          tax_rate: 0.06,
          tax_amount: 120,
          total_amount: 2120
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const workLogsResult = await db.collection('work_log').insertMany(workLogsData);
    console.log(`✅ 创建审批测试工时记录: ${workLogsResult.insertedCount}条`);

    // 8. 创建审批测试发票记录（确保 company_id 正确）
    const invoicesData = [
      {
        freelancer_id: freelancerId,
        project_requirement_id: project._id,
        company_id: company._id,
        affiliation_id: affiliation._id,
        invoice_number: `INV-APPROVAL-${Date.now()}-1`,
        invoice_date: new Date(),
        invoice_type: 'service_fee',
        billing_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        billing_period_end: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'submitted',
        description: '审批测试发票-待审批',
        items: [{
          description: '咨询服务',
          quantity: 8,
          unit_price: 250,
          amount: 2000
        }],
        subtotal_amount: 2000,
        tax_rate: 0.06,
        tax_amount: 120,
        total_amount: 2120,
        currency: 'CNY',
        tax_calculation_mode: 'exclusive',
        submitted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        freelancer_id: freelancerId,
        project_requirement_id: project._id,
        company_id: company._id,
        affiliation_id: affiliation._id,
        invoice_number: `INV-APPROVAL-${Date.now()}-2`,
        invoice_date: new Date(),
        invoice_type: 'service_fee',
        billing_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        billing_period_end: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        description: '审批测试发票-草稿',
        items: [{
          description: '咨询服务',
          quantity: 8,
          unit_price: 250,
          amount: 2000
        }],
        subtotal_amount: 2000,
        tax_rate: 0.06,
        tax_amount: 120,
        total_amount: 2120,
        currency: 'CNY',
        tax_calculation_mode: 'exclusive',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const invoicesResult = await db.collection('freelancer_invoice').insertMany(invoicesData);
    console.log(`✅ 创建审批测试发票记录: ${invoicesResult.insertedCount}条`);

    // 9. 验证数据
    console.log('\n========================================');
    console.log('  数据验证');
    console.log('========================================\n');

    // 验证 HR 用户的 company_id
    const updatedHrUser = await db.collection('user_account').findOne({ _id: hrUser._id });
    console.log(`HR 用户 company_id: ${updatedHrUser?.company_id}`);

    const finalWorkLogs = await db.collection('work_log').find({
      work_description: { $regex: '审批测试' }
    }).toArray();
    const finalInvoices = await db.collection('freelancer_invoice').find({
      description: { $regex: '审批测试' }
    }).toArray();

    console.log('📊 审批测试数据统计:');
    console.log(`   - 待审批工时: ${finalWorkLogs.filter(w => w.status === 'submitted').length} 条`);
    console.log(`   - 草稿工时: ${finalWorkLogs.filter(w => w.status === 'draft').length} 条`);
    console.log(`   - 待审批发票: ${finalInvoices.filter(i => i.status === 'submitted').length} 条`);
    console.log(`   - 草稿发票: ${finalInvoices.filter(i => i.status === 'draft').length} 条`);

    // 验证数据关联
    console.log('\n📊 数据关联验证:');
    const hrCompanyId = updatedHrUser?.company_id?.toString();
    const workLogCompanyId = finalWorkLogs[0]?.company_id?.toString();
    const projectCompanyId = project.company_id?.toString() || company._id.toString();
    
    console.log(`   - HR company_id: ${hrCompanyId}`);
    console.log(`   - 工时 company_id: ${workLogCompanyId}`);
    console.log(`   - 项目 company_id: ${projectCompanyId}`);
    console.log(`   - 数据关联一致: ${hrCompanyId === workLogCompanyId && workLogCompanyId === projectCompanyId ? '✅ 是' : '❌ 否'}`);

    console.log('\n✅ 审批流程测试数据初始化完成！\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initApprovalTestData();
