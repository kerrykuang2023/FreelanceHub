const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/freelancehub');
  const db = mongoose.connection.db;
  
  const freelancerUser = await db.collection('user_account').findOne({ email: 'freelancer@test.com' });
  console.log('Freelancer User ID:', String(freelancerUser._id));
  
  const freelancerProfile = await db.collection('freelancer_profile').findOne({ user_id: freelancerUser._id });
  console.log('Freelancer Profile ID:', freelancerProfile ? String(freelancerProfile._id) : 'NOT FOUND');
  
  const allWorkLogs = await db.collection('work_log').find({}).toArray();
  console.log('Total work logs in DB:', allWorkLogs.length);
  
  for (const wl of allWorkLogs.slice(0, 5)) {
    console.log('WorkLog freelancer_id:', String(wl.freelancer_id), 'status:', wl.status);
  }
  
  if (freelancerProfile) {
    const matchingWorkLogs = await db.collection('work_log').find({
      freelancer_id: freelancerProfile._id
    }).toArray();
    console.log('Work logs matching profile._id:', matchingWorkLogs.length);
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
