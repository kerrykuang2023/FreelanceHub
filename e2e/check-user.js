const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb://localhost:27017/job_portal';

async function checkUser() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const usersCollection = db.collection('user_account');
  
  const user = await usersCollection.findOne({ email: 'freelancer@test.com' });
  
  console.log('User found:', {
    email: user?.email,
    user_name: user?.user_name,
    user_type_id: user?.user_type_id,
    is_active: user?.is_active,
    password_hash: user?.password?.substring(0, 30) + '...',
    password_length: user?.password?.length
  });
  
  if (user) {
    const testPassword = 'Test123456!';
    const match = await bcrypt.compare(testPassword, user.password);
    console.log('Password match:', match);
    
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash length:', newHash.length);
    console.log('Stored hash length:', user.password.length);
    
    const newMatch = await bcrypt.compare(testPassword, newHash);
    console.log('New hash match:', newMatch);
  }
  
  await mongoose.disconnect();
}

checkUser().catch(console.error);
