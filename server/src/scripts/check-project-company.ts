const mongoose = require('mongoose');

async function checkProjectCompany() {
  await mongoose.connect('mongodb://localhost:27017/freelancehub');
  const db = mongoose.connection.db;

  const hrCompanyId = '69c487eae54c541bc125ae00';

  // 检查项�?
  const projects = await db.collection('projectrequirements').find({
    company_id: new mongoose.Types.ObjectId(hrCompanyId)
  }).toArray();

  console.log('HR 公司的项�?(使用 ObjectId):', projects.length);
  for (const p of projects) {
    console.log('  -', p._id.toString(), p.job_title || p.project_title);
  }

  // 检查所有项�?
  const allProjects = await db.collection('projectrequirements').find({}).toArray();
  console.log('\n所有项�?');
  for (const p of allProjects) {
    console.log('  -', p._id.toString(), 'company_id:', p.company_id?.toString());
  }

  await mongoose.disconnect();
}

checkProjectCompany();
