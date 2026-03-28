const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URL = 'mongodb://localhost:27017/job-portal';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  user_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType' },
  first_name: { type: String },
  last_name: { type: String },
  user_image: { type: String },
  registration_date: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWT = function() {
  const payload = { id: this._id, email: this.email };
  return require('jsonwebtoken').sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const userTypeSchema = new mongoose.Schema({
  user_type_name: { type: String, required: true, unique: true },
}, { timestamps: true });

const UserAccount = mongoose.model('UserAccount', userSchema);
const UserType = mongoose.model('UserType', userTypeSchema);

async function createTestUsers() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const userTypes = await UserType.find({});
    console.log('User types:', userTypes.map(ut => ({ id: ut._id, name: ut.user_type_name })));

    const testUsers = [
      {
        email: 'admin@test.com',
        password: 'Test1234!',
        first_name: 'Admin',
        last_name: 'User',
        user_type_name: 'admin'
      },
      {
        email: 'freelancer@test.com',
        password: 'Test1234!',
        first_name: 'Freelancer',
        last_name: 'User',
        user_type_name: 'freelancer'
      },
      {
        email: 'company@test.com',
        password: 'Test1234!',
        first_name: 'Company',
        last_name: 'User',
        user_type_name: 'company_user'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await UserAccount.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️ User already exists: ${userData.email}`);
        continue;
      }

      const userType = await UserType.findOne({ user_type_name: userData.user_type_name });
      
      if (!userType) {
        console.log(`❌ User type not found: ${userData.user_type_name}`);
        continue;
      }

      const user = new UserAccount({
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type_id: userType._id
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.user_type_name})`);
    }

    const allUsers = await UserAccount.find({}).populate('user_type_id');
    console.log('\n📋 All users:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.user_type_id?.user_type_name || 'no type'})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUsers();