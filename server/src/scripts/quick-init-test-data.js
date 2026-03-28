const mongoose = require('mongoose');

async function quickInit() {
  await mongoose.connect('mongodb://localhost:27017/jobportal');
  const db = mongoose.connection.db;
  
  // Get test users
  const hrUser = await db.collection('user_account').findOne({ email: 'hr@test.com' });
  const freelancerUser = await db.collection('user_account').findOne({ email: 'freelancer@test.com' });
  let freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser._id });
  
  // Get company
  let company = await db.collection('company').findOne({ company_name: '审批测试公司' });
  if (!company) {
    const result = await db.collection('company').insertOne({
      company_name: '审批测试公司',
      company_code: 'APPROVAL-TEST-001',
      status: 'active',
      created_at: new Date()
    });
    company = { _id: result.insertedId };
  }
  
  // Update HR company_id
  await db.collection('user_account').updateOne({ _id: hrUser._id }, { $set: { company_id: company._id } });
  console.log('HR company_id updated:', company._id);
  
  // Get or create project
  let project = await db.collection('project_requirement').findOne({ company_id: company._id });
  if (!project) {
    const result = await db.collection('project_requirement').insertOne({
      job_title: '审批测试项目',
      company_id: company._id,
      status: '进行中',
      created_at: new Date()
    });
    project = { _id: result.insertedId };
  }
  console.log('Project:', project._id);
  
  // Create affiliation
  let affiliation = await db.collection('freelancer_affiliation').findOne({ freelancer_id: freelancerProfile._id, company_id: company._id });
  if (!affiliation) {
    const result = await db.collection('freelancer_affiliation').insertOne({
      freelancer_id: freelancerProfile._id,
      company_id: company._id,
      status: 'active',
      start_date: new Date(),
      created_at: new Date()
    });
    affiliation = { _id: result.insertedId };
  }
  
  // Clean old test data
  await db.collection('work_log').deleteMany({ work_description: { $regex: '审批测试' } });
  await db.collection('freelancer_invoice').deleteMany({ description: { $regex: '审批测试' } });
  
  // Create work logs
  await db.collection('work_log').insertMany([
    {
      freelancer_id: freelancerProfile._id,
      project_requirement_id: project._id,
      company_id: company._id,
      affiliation_id: affiliation._id,
      work_date: new Date(Date.now() - 2*24*60*60*1000),
      work_period_start: new Date(Date.now() - 2*24*60*60*1000 + 9*60*60*1000),
      work_period_end: new Date(Date.now() - 2*24*60*60*1000 + 18*60*60*1000),
      hours_worked: 8,
      work_type: 'remote_work',
      work_description: '审批测试工时-待审批',
      status: 'submitted',
      billing_info: { daily_rate: 2000, hours_billable: 8, amount: 2000, currency: 'CNY' },
      submitted_at: new Date(),
      created_at: new Date()
    },
    {
      freelancer_id: freelancerProfile._id,
      project_requirement_id: project._id,
      company_id: company._id,
      affiliation_id: affiliation._id,
      work_date: new Date(),
      hours_worked: 8,
      work_type: 'remote_work',
      work_description: '审批测试工时-草稿',
      status: 'draft',
      billing_info: { daily_rate: 2000, hours_billable: 8, amount: 2000, currency: 'CNY' },
      created_at: new Date()
    }
  ]);
  console.log('Work logs created');
  
  // Create invoices
  await db.collection('freelancer_invoice').insertMany([
    {
      freelancer_id: freelancerProfile._id,
      project_requirement_id: project._id,
      company_id: company._id,
      affiliation_id: affiliation._id,
      invoice_number: 'INV-TEST-' + Date.now() + '-1',
      invoice_date: new Date(),
      invoice_type: 'service_fee',
      billing_period_start: new Date(Date.now() - 7*24*60*60*1000),
      billing_period_end: new Date(),
      due_date: new Date(Date.now() + 30*24*60*60*1000),
      status: 'submitted',
      description: '审批测试发票-待审批',
      items: [{ description: '服务', quantity: 8, unit_price: 250, amount: 2000 }],
      subtotal_amount: 2000,
      tax_rate: 0.06,
      tax_amount: 120,
      total_amount: 2120,
      currency: 'CNY',
      tax_calculation_mode: 'exclusive',
      submitted_at: new Date(),
      created_at: new Date()
    },
    {
      freelancer_id: freelancerProfile._id,
      project_requirement_id: project._id,
      company_id: company._id,
      affiliation_id: affiliation._id,
      invoice_number: 'INV-TEST-' + Date.now() + '-2',
      invoice_date: new Date(),
      invoice_type: 'service_fee',
      billing_period_start: new Date(Date.now() - 7*24*60*60*1000),
      billing_period_end: new Date(),
      due_date: new Date(Date.now() + 30*24*60*60*1000),
      status: 'draft',
      description: '审批测试发票-草稿',
      items: [{ description: '服务', quantity: 8, unit_price: 250, amount: 2000 }],
      subtotal_amount: 2000,
      tax_rate: 0.06,
      tax_amount: 120,
      total_amount: 2120,
      currency: 'CNY',
      tax_calculation_mode: 'exclusive',
      created_at: new Date()
    }
  ]);
  console.log('Invoices created');
  
  await mongoose.disconnect();
  console.log('Done!');
}

quickInit().catch(e => { console.error(e); process.exit(1); });
