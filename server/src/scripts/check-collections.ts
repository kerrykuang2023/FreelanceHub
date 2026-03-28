const mongoose = require('mongoose');

async function checkCollections() {
  await mongoose.connect('mongodb://localhost:27017/jobportal');
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log('数据库集合:');
  for (const c of collections) {
    if (c.name.includes('project') || c.name.includes('requirement')) {
      console.log('  -', c.name);
    }
  }

  // 检查 project_requirement 集合
  const projectRequirementCount = await db.collection('project_requirement').countDocuments();
  console.log('\nproject_requirement 集合文档数:', projectRequirementCount);

  // 检查 projectrequirements 集合
  const projectrequirementsCount = await db.collection('projectrequirements').countDocuments();
  console.log('projectrequirements 集合文档数:', projectrequirementsCount);

  await mongoose.disconnect();
}

checkCollections();
