import { test, expect, APIRequestContext } from '@playwright/test';
import mongoose from '../server/node_modules/mongoose';
import UserType from '../server/src/models/user/user-type.model';
import UserAccount from '../server/src/models/user/user-account.model';
import Company from '../server/src/models/company-profile/company.model';
import FreelancerProfile from '../server/src/models/freelancer/freelancer_profile.model';
import FreelancerAffiliation from '../server/src/models/freelancer/freelancer_affiliation.model';
import ProjectRequirement from '../server/src/models/freelancer/project_requirement.model';
import WorkLog from '../server/src/models/freelancer/work_log.model';
import FreelancerInvoice from '../server/src/models/freelancer/freelancer_invoice.model';

const API_BASE_URL = 'http://localhost:5555/api/v1';
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/job-portal';
const PASSWORD = 'Test123456!';
const PREFIX = 'prod-state-e2e';

type Fixture = {
  freelancerToken: string;
  hrToken: string;
  otherHrToken: string;
  adminToken: string;
  freelancerUser: any;
  hrUser: any;
  otherHrUser: any;
  freelancerProfile: any;
  company: any;
  otherCompany: any;
  project: any;
  affiliation: any;
};

const fx: Fixture = {} as Fixture;

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

async function cleanup() {
  await WorkLog.deleteMany({
    $or: [
      { notes: PREFIX },
      { work_description: { $regex: `^${PREFIX}` } },
      { work_description: 'Invalid 8 hours inside a 2 hour window' },
    ],
  });
  await FreelancerInvoice.deleteMany({ notes: PREFIX });
  await ProjectRequirement.deleteMany({ project_title: { $regex: `^${PREFIX}` } });
  await FreelancerAffiliation.deleteMany({ notes: PREFIX });
  await Company.deleteMany({ company_name: { $regex: `^${PREFIX}` } });
  await UserAccount.deleteMany({ email: { $in: [`${PREFIX}-hr@test.com`] } });
}

async function login(request: APIRequestContext, email: string) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password: PASSWORD },
  });
  expect(response.ok(), `login ${email}`).toBeTruthy();
  const body = await response.json();
  return body.data?.token || body.token;
}

async function ensureFixture(request: APIRequestContext) {
  await connectDb();
  await cleanup();

  const [adminType, freelancerType, hrType] = await Promise.all([
    UserType.findOneAndUpdate(
      { user_type_name: 'admin' },
      { user_type_name: 'admin', user_type_display_name: 'Administrator' },
      { upsert: true, new: true }
    ),
    UserType.findOneAndUpdate(
      { user_type_name: 'job_seeker' },
      { user_type_name: 'job_seeker', user_type_display_name: 'Freelancer' },
      { upsert: true, new: true }
    ),
    UserType.findOneAndUpdate(
      { user_type_name: 'hr_recruiter' },
      { user_type_name: 'hr_recruiter', user_type_display_name: 'HR Recruiter' },
      { upsert: true, new: true }
    ),
  ]);

  fx.freelancerUser = await UserAccount.findOne({ email: 'freelancer@test.com' });
  fx.hrUser = await UserAccount.findOne({ email: 'hr@test.com' });
  const adminUser = await UserAccount.findOne({ email: 'admin@test.com' });
  expect(fx.freelancerUser, 'freelancer@test.com must exist').toBeTruthy();
  expect(fx.hrUser, 'hr@test.com must exist').toBeTruthy();
  expect(adminUser, 'admin@test.com must exist').toBeTruthy();

  fx.otherHrUser = new UserAccount({
    email: `${PREFIX}-hr@test.com`,
    password: PASSWORD,
    user_name: 'Other Company HR',
    user_type_id: hrType._id,
    is_active: true,
    registration_date: new Date(),
  });

  fx.company = await Company.create({
    company_name: `${PREFIX} Company A`,
    company_type: 'limited_company',
    verification_status: 'approved',
    created_by: fx.hrUser._id,
  });
  fx.otherCompany = await Company.create({
    company_name: `${PREFIX} Company B`,
    company_type: 'limited_company',
    verification_status: 'approved',
    created_by: fx.otherHrUser._id,
  });

  fx.hrUser.company_id = fx.company._id;
  fx.otherHrUser.company_id = fx.otherCompany._id;
  fx.freelancerUser.user_type_id = freelancerType._id;
  adminUser.user_type_id = adminType._id;
  await Promise.all([fx.hrUser.save(), fx.otherHrUser.save(), fx.freelancerUser.save(), adminUser.save()]);

  fx.freelancerProfile = await FreelancerProfile.findOneAndUpdate(
    { user_id: fx.freelancerUser._id },
    {
      user_id: fx.freelancerUser._id,
      display_name: 'Production State Freelancer',
      freelancer_type: '独立顾问',
      availability_status: 'available',
      is_active: true,
    },
    { upsert: true, new: true }
  );

  fx.project = await ProjectRequirement.create({
    posted_by: fx.hrUser._id,
    company_id: fx.company._id,
    project_title: `${PREFIX} Project`,
    project_description: 'Production readiness state machine project',
    job_nature: 'freelance',
    work_format: 'remote',
    rate_type: 'daily',
    rate_amount: 1000,
    rate_currency: 'CNY',
    project_cycle: '3_months',
    status: 'in_progress',
    is_active: true,
    created_date: new Date(),
  });

  fx.affiliation = await FreelancerAffiliation.create({
    freelancer_id: fx.freelancerProfile._id,
    company_id: fx.company._id,
    affiliation_type: 'contract',
    start_date: new Date(),
    status: 'active',
    notes: PREFIX,
    billing_info: {
      billing_mode: 'daily',
      billing_currency: 'CNY',
      agreed_daily_rate: 1000,
    },
  });

  fx.freelancerToken = await login(request, 'freelancer@test.com');
  fx.hrToken = await login(request, 'hr@test.com');
  fx.otherHrToken = await login(request, `${PREFIX}-hr@test.com`);
  fx.adminToken = await login(request, 'admin@test.com');
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createWorkLog(status: 'draft' | 'submitted' | 'confirmed', offsetDays: number, totalAmount = 1060) {
  const day = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
  day.setHours(0, 0, 0, 0);
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  const end = new Date(day);
  end.setHours(17, 0, 0, 0);

  return WorkLog.create({
    freelancer_id: fx.freelancerProfile._id,
    project_requirement_id: fx.project._id,
    company_id: fx.company._id,
    affiliation_id: fx.affiliation._id,
    work_date: day,
    work_period_start: start,
    work_period_end: end,
    hours_worked: 8,
    work_type: 'remote_work',
    work_description: `${PREFIX} work log ${offsetDays}`,
    status,
    submitted_at: status !== 'draft' ? new Date() : undefined,
    confirmed_at: status === 'confirmed' ? new Date() : undefined,
    confirmed_by: status === 'confirmed' ? fx.hrUser._id : undefined,
    billing_info: {
      daily_rate: 1000,
      hours_billable: 8,
      amount: 1000,
      currency: 'CNY',
      is_tax_inclusive: false,
      tax_rate: 6,
      tax_amount: totalAmount - 1000,
      total_amount: totalAmount,
    },
    notes: PREFIX,
    created_at: new Date(),
    updated_at: new Date(),
  });
}

async function createInvoice(workLogId: string, totalAmount = 1060) {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: { ...auth(fx.freelancerToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      work_log_ids: [workLogId],
      invoice_type: 'vat_special',
      billing_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      billing_period_end: new Date().toISOString(),
      currency: 'CNY',
      items: [{ description: 'Consulting service', quantity: 1, unit: 'day', unit_price: 1000, amount: 1000 }],
      subtotal_amount: 1000,
      tax_calculation_mode: 'exclusive',
      tax_rate: 6,
      tax_amount: totalAmount - 1000,
      total_amount: totalAmount,
      notes: PREFIX,
    }),
  });
  const body = await response.json();
  return { response, body };
}

test.describe.serial('Production business state machine coverage', () => {
  test.beforeAll(async ({ request }) => {
    await ensureFixture(request);
  });

  test.afterAll(async () => {
    await cleanup();
    await mongoose.disconnect();
  });

  test('rejects abnormal work log data before it enters approval and billing', async ({ request }) => {
    const day = new Date();
    day.setDate(day.getDate() - 1);
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(day);
    end.setHours(11, 0, 0, 0);

    const response = await request.post(`${API_BASE_URL}/work-logs`, {
      headers: auth(fx.freelancerToken),
      data: {
        project_requirement_id: fx.project._id.toString(),
        work_date: day.toISOString(),
        work_period_start: start.toISOString(),
        work_period_end: end.toISOString(),
        hours_worked: 8,
        work_type: 'remote_work',
        work_description: 'Invalid 8 hours inside a 2 hour window',
        notes: PREFIX,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('supports HR rejection, freelancer correction, and clean resubmission', async ({ request }) => {
    const workLog = await createWorkLog('submitted', 11);

    const reject = await request.post(`${API_BASE_URL}/work-logs/${workLog._id}/reject`, {
      headers: auth(fx.hrToken),
      data: { rejection_reason: 'Hours need more detail' },
    });
    expect(reject.ok()).toBeTruthy();

    const afterReject = await WorkLog.findById(workLog._id);
    expect(afterReject?.status).toBe('rejected');
    expect(afterReject?.rejection_reason).toBe('Hours need more detail');

    const update = await request.put(`${API_BASE_URL}/work-logs/${workLog._id}`, {
      headers: auth(fx.freelancerToken),
      data: { work_description: 'Corrected work details with deliverables' },
    });
    expect(update.ok()).toBeTruthy();

    const resubmit = await request.post(`${API_BASE_URL}/work-logs/${workLog._id}/submit`, {
      headers: auth(fx.freelancerToken),
    });
    expect(resubmit.ok()).toBeTruthy();

    const afterResubmit = await WorkLog.findById(workLog._id);
    expect(afterResubmit?.status).toBe('submitted');
    expect(afterResubmit?.rejection_reason).toBeUndefined();
    expect(afterResubmit?.rejected_at).toBeUndefined();
  });

  test('prevents a different company HR from approving someone else company work log', async ({ request }) => {
    const workLog = await createWorkLog('submitted', 12);

    const forbidden = await request.post(`${API_BASE_URL}/work-logs/${workLog._id}/confirm`, {
      headers: auth(fx.otherHrToken),
      data: { billing_info: { amount: 1000, total_amount: 1060, currency: 'CNY' } },
    });
    expect(forbidden.status()).toBe(400);

    const stillSubmitted = await WorkLog.findById(workLog._id);
    expect(stillSubmitted?.status).toBe('submitted');

    const allowed = await request.post(`${API_BASE_URL}/work-logs/${workLog._id}/confirm`, {
      headers: auth(fx.hrToken),
      data: { billing_info: { amount: 1000, total_amount: 1060, currency: 'CNY' } },
    });
    expect(allowed.ok()).toBeTruthy();
    const confirmed = await WorkLog.findById(workLog._id);
    expect(confirmed?.status).toBe('confirmed');
  });

  test('blocks invoices whose amount does not match confirmed work logs', async () => {
    const workLog = await createWorkLog('confirmed', 13, 1060);

    const { response } = await createInvoice(workLog._id.toString(), 999);

    expect(response.status).toBe(400);
    const unchanged = await WorkLog.findById(workLog._id);
    expect(unchanged?.status).toBe('confirmed');
    expect(unchanged?.invoice_id).toBeUndefined();
  });

  test('keeps invoice, work log, rejection, resubmission, approval, and payment states synchronized', async ({ request }) => {
    const workLog = await createWorkLog('confirmed', 14, 1060);

    const created = await createInvoice(workLog._id.toString(), 1060);
    expect(created.response.status).toBe(201);
    const invoiceId = created.body.invoice._id;

    const submit = await request.post(`${API_BASE_URL}/invoices/${invoiceId}/submit`, {
      headers: auth(fx.freelancerToken),
    });
    expect(submit.ok()).toBeTruthy();
    expect((await WorkLog.findById(workLog._id))?.status).toBe('invoiced');

    const reject = await request.post(`${API_BASE_URL}/invoices/${invoiceId}/reject`, {
      headers: auth(fx.hrToken),
      data: { reason: 'Missing purchase order reference' },
    });
    expect(reject.ok()).toBeTruthy();
    expect((await WorkLog.findById(workLog._id))?.status).toBe('confirmed');

    const resubmit = await request.post(`${API_BASE_URL}/invoices/${invoiceId}/submit`, {
      headers: auth(fx.freelancerToken),
    });
    expect(resubmit.ok()).toBeTruthy();
    const resubmittedInvoice = await FreelancerInvoice.findById(invoiceId);
    expect(resubmittedInvoice?.status).toBe('submitted');
    expect((resubmittedInvoice as any)?.rejection_reason).toBeUndefined();
    expect((await WorkLog.findById(workLog._id))?.status).toBe('invoiced');

    const approve = await request.post(`${API_BASE_URL}/invoices/${invoiceId}/approve`, {
      headers: auth(fx.hrToken),
    });
    expect(approve.ok()).toBeTruthy();

    const pay = await request.post(`${API_BASE_URL}/invoices/${invoiceId}/mark-paid`, {
      headers: auth(fx.hrToken),
      data: { payment_method: 'bank_transfer', payment_reference: `${PREFIX}-payment` },
    });
    expect(pay.ok()).toBeTruthy();

    expect((await FreelancerInvoice.findById(invoiceId))?.status).toBe('paid');
    expect((await WorkLog.findById(workLog._id))?.status).toBe('paid');
  });
});
