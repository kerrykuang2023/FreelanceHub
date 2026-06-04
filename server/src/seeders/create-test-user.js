const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/job-portal';

const UserAccountSchema = new mongoose.Schema({
  user_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType' },
  email: String,
  password: String,
  registration_date: Date,
  is_active: Boolean,
}, { collection: 'user_account', timestamps: true });

const UserAccount = mongoose.model('UserAccount', UserAccountSchema);

async function createTestUser() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    // Hash password for "password123"
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Find job_seeker user type
    const jobType = await mongoose.connection.db.collection('user_type').findOne({ user_type_name: 'job_seeker' });
    
    if (!jobType) {
      console.log('Job seeker user type not found');
      return;
    }

    const user = new UserAccount({
      user_type_id: jobType._id,
      email: 'testuser@freelancehub.com',
      password: hashedPassword,
      registration_date: new Date(),
      is_active: true,
    });

    await user.save();
    console.log('Test user created successfully!');
    console.log('Email: testuser@freelancehub.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();
