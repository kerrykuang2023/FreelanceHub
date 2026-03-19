const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/job-portal';

const JobTypeSchema = new mongoose.Schema({
  job_type: { type: String, required: true },
}, { collection: 'job_type', timestamps: true });

const JobLocationSchema = new mongoose.Schema({
  street_address: String,
  city: String,
  state: String,
  country: String,
  zip_code: String,
}, { collection: 'job_location', timestamps: true });

const CompanySchema = new mongoose.Schema({
  company_name: String,
  profile_description: String,
  company_website_url: String,
  created_by: mongoose.Schema.Types.ObjectId,
}, { collection: 'company_profile', timestamps: true });

const JobPostSchema = new mongoose.Schema({
  posted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount' },
  job_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobType' },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  is_company_name_hidden: { type: Boolean, default: false },
  created_date: { type: Date, default: Date.now },
  job_description: String,
  job_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobLocation' },
  is_active: { type: Boolean, default: true },
}, { collection: 'job_post', timestamps: true });

const UserAccountSchema = new mongoose.Schema({
  email: String,
  password: String,
  user_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType' },
}, { collection: 'user_account', timestamps: true });

const JobType = mongoose.model('JobType', JobTypeSchema);
const JobLocation = mongoose.model('JobLocation', JobLocationSchema);
const Company = mongoose.model('Company', CompanySchema);
const JobPost = mongoose.model('JobPost', JobPostSchema);
const UserAccount = mongoose.model('UserAccount', UserAccountSchema);

const sampleJobs = [
  {
    description: 'Senior Full Stack Developer - We are looking for an experienced developer to join our team. You will be responsible for developing and maintaining web applications using React, Node.js, and MongoDB.',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    companyName: 'Tech Solutions Inc',
  },
  {
    description: 'Frontend Engineer - Join our dynamic team to build beautiful and responsive user interfaces. Experience with React, TypeScript, and modern CSS frameworks required.',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    companyName: 'Startup Hub',
  },
  {
    description: 'Backend Developer - Design and implement scalable APIs and microservices. Proficiency in Node.js, Express, and database design required.',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    companyName: 'DataFlow Systems',
  },
  {
    description: 'DevOps Engineer - Manage cloud infrastructure and CI/CD pipelines. Experience with AWS, Docker, and Kubernetes preferred.',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    companyName: 'CloudNine Tech',
  },
  {
    description: 'Mobile Developer - Build cross-platform mobile applications using React Native. Strong understanding of mobile UI/UX principles required.',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    companyName: 'AppWorks Studio',
  },
  {
    description: 'Data Scientist - Analyze large datasets and build machine learning models. Proficiency in Python, SQL, and data visualization tools required.',
    city: 'Boston',
    state: 'MA',
    country: 'United States',
    companyName: 'Analytics Pro',
  },
];

async function seedJobs() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const jobTypes = await JobType.find();
    if (jobTypes.length === 0) {
      console.log('No job types found. Please run job type seeder first.');
      return;
    }

    let user = await UserAccount.findOne();
    if (!user) {
      user = new UserAccount({
        email: 'test@example.com',
        password: 'hashedpassword',
        user_type_id: null,
      });
      await user.save();
      console.log('Created test user');
    }

    const existingJobs = await JobPost.countDocuments();
    if (existingJobs > 0) {
      console.log(`Jobs already exist (${existingJobs} jobs). Skipping seed.`);
      return;
    }

    for (const jobData of sampleJobs) {
      const location = new JobLocation({
        street_address: '',
        city: jobData.city,
        state: jobData.state,
        country: jobData.country,
        zip_code: '',
      });
      await location.save();

      let company = await Company.findOne({ company_name: jobData.companyName });
      if (!company) {
        company = new Company({
          company_name: jobData.companyName,
          profile_description: `A great company in ${jobData.city}`,
          company_website_url: `https://${jobData.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          created_by: user._id,
        });
        await company.save();
      }

      const randomJobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];

      const jobPost = new JobPost({
        posted_by: user._id,
        job_type_id: randomJobType._id,
        company_id: company._id,
        is_company_name_hidden: false,
        created_date: new Date(),
        job_description: jobData.description,
        job_location_id: location._id,
        is_active: true,
      });
      await jobPost.save();
      console.log(`Created job: ${jobData.description.substring(0, 30)}...`);
    }

    console.log('Job seeding completed!');
  } catch (error) {
    console.error('Error seeding jobs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedJobs();
