import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelancehub';

async function createCompleteTestData() {
  console.log('\n========================================');
  console.log('  完整测试数据初始�?);
  console.log('========================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('�?MongoDB 连接成功');

    const db = mongoose.connection.db;

    // 1. 获取测试用户
    const users = await db.collection('user_account').find({
      email: { $in: ['admin@test.com', 'hr@test.com', 'freelancer@test.com'] }
    }).toArray();

    const adminUser = users.find((u: any) => u.email === 'admin@test.com') as any;
    const hrUser = users.find((u: any) => u.email === 'hr@test.com') as any;
    const freelancerUser = users.find((u: any) => u.email === 'freelancer@test.com') as any;

    if (!adminUser || !hrUser || !freelancerUser) {
      console.log('�?缺少测试用户，请先运�?seeder');
      return;
    }

    console.log(`�?测试用户已就�?`);
    console.log(`   - 管理�? ${adminUser.email}`);
    console.log(`   - HR: ${hrUser.email}`);
    console.log(`   - 求职�? ${freelancerUser.email}`);

    // 2. 获取或创�?FreelancerProfile
    let freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser._id });
    
    if (!freelancerProfile) {
      const profileResult = await db.collection('freelancer_profile').insertOne({
        user_id: freelancerUser._id,
        full_name: freelancerUser.user_name || '测试求职�?,
        email: freelancerUser.email,
        phone: '13800138000',
        skills: ['SAP', 'ABAP', 'Fiori'],
        experience_years: 5,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      freelancerProfile = { _id: profileResult.insertedId, user_id: freelancerUser._id };
      console.log('�?创建求职者档�?);
    } else {
      console.log(`�?求职者档案已存在: ${freelancerProfile._id}`);
    }

    const freelancerId = freelancerProfile._id;

    // 3. 获取或创建公�?
    let company = await db.collection('company').findOne({ created_by: hrUser._id });
    
    if (!company) {
      const companyResult = await db.collection('company').insertOne({
        company_name: 'E2E测试公司',
        profile_description: '这是一个用于端到端测试的公�?,
        company_website_url: 'https://test-company.example.com',
        verification_status: 'approved',
        created_by: hrUser._id,
        created_at: new Date(),
        updated_at: new Date()
      });
      company = { _id: companyResult.insertedId, company_name: 'E2E测试公司' };
      console.log('�?创建测试公司');
    } else {
      console.log(`�?公司已存�? ${company.company_name}`);
    }

    // 4. 创建测试项目（如果不存在�?
    let projects = await db.collection('projectrequirements').find({
      posted_by: hrUser._id,
      status: { $in: ['published', 'in_progress'] }
    }).toArray();

    if (projects.length === 0) {
      const projectData = {
        posted_by: hrUser._id,
        company_id: company._id,
        job_title: 'E2E测试项目-SAP顾问',
        job_description: '这是一个端到端测试项目，用于验证完整的业务流程',
        job_nature: '自由顾问',
        work_format: '远程',
        rate_type: '日薪',
        rate_amount: 2000,
        rate_currency: 'CNY',
        project_cycle: '3个月',
        hiring_count: 1,
        status: 'published',
        is_active: true,
        language_requirements: ['中文', '英文'],
        created_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      await db.collection('projectrequirements').insertOne(projectData);
      projects = await db.collection('projectrequirements').find({
        posted_by: hrUser._id
      }).toArray();
      console.log('�?创建测试项目');
    } else {
      console.log(`�?项目已存�? ${projects.length} 个`);
    }

    // 5. 创建挂靠关系（Affiliation�?
    let affiliation = await db.collection('freelanceraffiliations').findOne({
      freelancer_id: freelancerId,
      company_id: company._id
    });

    if (!affiliation) {
      const affiliationResult = await db.collection('freelanceraffiliations').insertOne({
        freelancer_id: freelancerId,
        company_id: company._id,
        affiliation_type: '挂靠',
        status: 'active',
        start_date: new Date(),
        commission_rate: 0.1,
        billing_info: {
          billing_mode: '日薪',
          billing_currency: 'CNY',
          agreed_daily_rate: 2000
        },
        created_at: new Date(),
        updated_at: new Date()
      });
      affiliation = { _id: affiliationResult.insertedId };
      console.log('�?创建挂靠关系');
    } else {
      console.log('�?挂靠关系已存�?);
    }

    // 6. 创建项目分配
    const project = projects[0];
    await db.collection('projectrequirements').updateOne(
      { _id: project._id },
      { 
        $addToSet: { assigned_freelancers: freelancerId },
        $set: { status: 'in_progress', updated_at: new Date() }
      }
    );
    console.log('�?分配求职者到项目');

    // 7. 创建测试工时记录
    const existingWorkLogs = await db.collection('work_log').countDocuments({
      freelancer_id: freelancerId
    });

    if (existingWorkLogs === 0) {
      const workLogsData = [
        {
          freelancer_id: freelancerId,
          project_requirement_id: project._id,
          company_id: company._id,
          affiliation_id: affiliation._id,
          work_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          work_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
          work_period_end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
          hours_worked: 8,
          work_type: '远程工作',
          work_description: 'E2E测试工时-已完成需求分�?,
          status: 'confirmed',
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
          submitted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          confirmed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          confirmed_by: hrUser._id,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          freelancer_id: freelancerId,
          project_requirement_id: project._id,
          company_id: company._id,
          affiliation_id: affiliation._id,
          work_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          work_period_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
          work_period_end: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
          hours_worked: 8,
          work_type: '远程工作',
          work_description: 'E2E测试工时-待审�?,
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
          submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
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
          work_description: 'E2E测试工时-草稿',
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

      await db.collection('work_log').insertMany(workLogsData);
      console.log('�?创建测试工时记录: 3�?(1草稿, 1待审�? 1已确�?');
    } else {
      console.log(`�?工时记录已存�? ${existingWorkLogs} 条`);
    }

    // 8. 创建测试发票
    const existingInvoices = await db.collection('freelancer_invoice').countDocuments({
      freelancer_id: freelancerId
    });

    if (existingInvoices === 0) {
      const confirmedWorkLog = await db.collection('work_log').findOne({
        freelancer_id: freelancerId,
        status: 'confirmed'
      });

      if (confirmedWorkLog) {
        const invoiceData = {
          invoice_number: `INV-${Date.now()}`,
          freelancer_id: freelancerId,
          company_id: company._id,
          affiliation_id: affiliation._id,
          project_requirement_id: project._id,
          invoice_type: '增值税专用发票',
          billing_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          billing_period_end: new Date(),
          currency: 'CNY',
          items: [{
            description: 'SAP顾问服务',
            quantity: 1,
            unit: '�?,
            unit_price: 2000,
            amount: 2000,
            work_log_id: confirmedWorkLog._id
          }],
          subtotal_amount: 2000,
          tax_calculation_mode: '不含税价',
          tax_rate: 0.06,
          tax_amount: 120,
          total_amount: 2120,
          status: 'submitted',
          billing_info: {
            billing_company_name: 'E2E测试公司',
            billing_tax_id: '91110000MA00ABCD12',
            billing_address: '上海市浦东新区测试路123�?,
            billing_phone: '021-12345678',
            billing_bank_name: '测试银行',
            billing_bank_account: '1234567890'
          },
          issued_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        };

        await db.collection('freelancer_invoice').insertOne(invoiceData);
        console.log('�?创建测试发票');
      }
    } else {
      console.log(`�?发票已存�? ${existingInvoices} 条`);
    }

    // 9. 验证数据
    console.log('\n========================================');
    console.log('  数据验证');
    console.log('========================================\n');

    const finalWorkLogs = await db.collection('work_log').countDocuments({});
    const finalInvoices = await db.collection('freelancer_invoice').countDocuments({});
    const finalProjects = await db.collection('projectrequirements').countDocuments({});

    console.log(`📊 最终数据统�?`);
    console.log(`   - 项目: ${finalProjects} 个`);
    console.log(`   - 工时: ${finalWorkLogs} 条`);
    console.log(`   - 发票: ${finalInvoices} 条`);

    console.log('\n�?测试数据初始化完成！\n');

  } catch (error) {
    console.error('�?初始化失�?', error);
  } finally {
    await mongoose.disconnect();
  }
}

createCompleteTestData();
