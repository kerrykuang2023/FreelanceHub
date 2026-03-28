const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/jobportal';

async function initProfileTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.connection.collection('useraccounts');
    const FreelancerProfile = mongoose.connection.collection('freelancerprofiles');

    const freelancerUser = await User.findOne({ email: 'freelancer@test.com' });
    
    if (!freelancerUser) {
      console.log('Freelancer user not found, creating...');
      const newUser = await User.insertOne({
        user_name: '张三',
        email: 'freelancer@test.com',
        password: '$2a$10$YourHashedPasswordHere',
        user_type_name: 'freelancer',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('Created freelancer user:', newUser.insertedId);
    }

    const userId = freelancerUser?._id || (await User.findOne({ email: 'freelancer@test.com' }))._id;

    const existingProfile = await FreelancerProfile.findOne({ user_id: userId });

    if (existingProfile) {
      console.log('Profile already exists, updating...');
      await FreelancerProfile.updateOne(
        { user_id: userId },
        {
          $set: {
            headline: '高级全栈开发工程师 | 8年经验',
            summary: '我是一名经验丰富的全栈开发工程师，专注于React、Node.js和云原生技术。拥有8年的软件开发经验，曾参与多个大型企业级项目的开发。擅长前后端架构设计、性能优化和团队协作。对新技术保持热情，持续学习和成长。',
            location: '上海，中国',
            hourly_rate: 500,
            daily_rate: 3500,
            monthly_rate: 60000,
            preferred_currency: 'CNY',
            availability_status: 'available',
            available_hours_per_week: 40,
            languages: [
              { language: '中文', proficiency: '母语' },
              { language: '英语', proficiency: '流利' },
              { language: '日语', proficiency: '基础' }
            ],
            portfolio_links: [
              { title: '个人技术博客', url: 'https://blog.example.com' },
              { title: 'GitHub', url: 'https://github.com/zhangsan' }
            ],
            skills: [
              {
                _id: new mongoose.Types.ObjectId(),
                skill_name: 'React',
                skill_level: '专家',
                years_of_experience: 5
              },
              {
                _id: new mongoose.Types.ObjectId(),
                skill_name: 'Node.js',
                skill_level: '高级',
                years_of_experience: 6
              },
              {
                _id: new mongoose.Types.ObjectId(),
                skill_name: 'TypeScript',
                skill_level: '高级',
                years_of_experience: 4
              },
              {
                _id: new mongoose.Types.ObjectId(),
                skill_name: 'Python',
                skill_level: '中级',
                years_of_experience: 3
              },
              {
                _id: new mongoose.Types.ObjectId(),
                skill_name: 'MongoDB',
                skill_level: '高级',
                years_of_experience: 4
              },
              {
                _id: new mongoose.Types.ObjectId(),
                skill_name: 'Docker',
                skill_level: '中级',
                years_of_experience: 2
              }
            ],
            project_experiences: [
              {
                _id: new mongoose.Types.ObjectId(),
                project_name: '企业级电商平台重构',
                company_name: '某知名电商公司',
                role: '技术负责人',
                start_date: '2022-03-01',
                end_date: '2023-08-31',
                description: '负责整个电商平台的前端架构重构，从jQuery迁移到React技术栈。实现了微前端架构，提升了开发效率和系统可维护性。优化了首屏加载速度，从8秒降低到2秒。',
                technologies: ['React', 'TypeScript', 'Redux', 'Webpack', 'Docker', 'K8s']
              },
              {
                _id: new mongoose.Types.ObjectId(),
                project_name: '智能客服系统',
                company_name: '某科技公司',
                role: '全栈开发工程师',
                start_date: '2021-01-01',
                end_date: '2022-02-28',
                description: '开发了一套基于NLP的智能客服系统，支持多轮对话、意图识别和知识库管理。系统日均处理10万+用户咨询，客服效率提升60%。',
                technologies: ['Node.js', 'Vue.js', 'MongoDB', 'Redis', 'Python', 'TensorFlow']
              },
              {
                _id: new mongoose.Types.ObjectId(),
                project_name: '金融风控系统',
                company_name: '某金融科技公司',
                role: '高级开发工程师',
                start_date: '2019-06-01',
                end_date: '2020-12-31',
                description: '参与开发实时风控决策引擎，实现毫秒级风险评分。对接多家征信机构数据，构建用户画像体系。',
                technologies: ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'Redis']
              }
            ],
            certifications: [
              {
                _id: new mongoose.Types.ObjectId(),
                certification_name: 'AWS Solutions Architect Professional',
                issuing_organization: 'Amazon Web Services',
                issue_date: '2023-05-15',
                credential_id: 'AWS-SAP-123456',
                credential_url: 'https://aws.amazon.com/verification/123456'
              },
              {
                _id: new mongoose.Types.ObjectId(),
                certification_name: 'Google Cloud Professional Cloud Architect',
                issuing_organization: 'Google Cloud',
                issue_date: '2022-11-20',
                credential_id: 'GCP-PCA-789012'
              },
              {
                _id: new mongoose.Types.ObjectId(),
                certification_name: 'PMP项目管理专业人士',
                issuing_organization: 'Project Management Institute',
                issue_date: '2021-08-10',
                credential_id: 'PMP-345678'
              }
            ],
            education: [
              {
                _id: new mongoose.Types.ObjectId(),
                school: '上海交通大学',
                degree: '硕士',
                field_of_study: '计算机科学与技术',
                start_date: '2013-09-01',
                end_date: '2016-06-30'
              },
              {
                _id: new mongoose.Types.ObjectId(),
                school: '浙江大学',
                degree: '学士',
                field_of_study: '软件工程',
                start_date: '2009-09-01',
                end_date: '2013-06-30'
              }
            ],
            rating: {
              average: 4.8,
              count: 25
            },
            completed_projects: 15,
            profile_completion: 95,
            updated_at: new Date()
          }
        }
      );
      console.log('Profile updated successfully');
    } else {
      console.log('Creating new profile...');
      await FreelancerProfile.insertOne({
        user_id: userId,
        headline: '高级全栈开发工程师 | 8年经验',
        summary: '我是一名经验丰富的全栈开发工程师，专注于React、Node.js和云原生技术。拥有8年的软件开发经验，曾参与多个大型企业级项目的开发。擅长前后端架构设计、性能优化和团队协作。对新技术保持热情，持续学习和成长。',
        location: '上海，中国',
        hourly_rate: 500,
        daily_rate: 3500,
        monthly_rate: 60000,
        preferred_currency: 'CNY',
        availability_status: 'available',
        available_hours_per_week: 40,
        languages: [
          { language: '中文', proficiency: '母语' },
          { language: '英语', proficiency: '流利' },
          { language: '日语', proficiency: '基础' }
        ],
        portfolio_links: [
          { title: '个人技术博客', url: 'https://blog.example.com' },
          { title: 'GitHub', url: 'https://github.com/zhangsan' }
        ],
        skills: [
          {
            _id: new mongoose.Types.ObjectId(),
            skill_name: 'React',
            skill_level: '专家',
            years_of_experience: 5
          },
          {
            _id: new mongoose.Types.ObjectId(),
            skill_name: 'Node.js',
            skill_level: '高级',
            years_of_experience: 6
          },
          {
            _id: new mongoose.Types.ObjectId(),
            skill_name: 'TypeScript',
            skill_level: '高级',
            years_of_experience: 4
          },
          {
            _id: new mongoose.Types.ObjectId(),
            skill_name: 'Python',
            skill_level: '中级',
            years_of_experience: 3
          },
          {
            _id: new mongoose.Types.ObjectId(),
            skill_name: 'MongoDB',
            skill_level: '高级',
            years_of_experience: 4
          },
          {
            _id: new mongoose.Types.ObjectId(),
            skill_name: 'Docker',
            skill_level: '中级',
            years_of_experience: 2
          }
        ],
        project_experiences: [
          {
            _id: new mongoose.Types.ObjectId(),
            project_name: '企业级电商平台重构',
            company_name: '某知名电商公司',
            role: '技术负责人',
            start_date: '2022-03-01',
            end_date: '2023-08-31',
            description: '负责整个电商平台的前端架构重构，从jQuery迁移到React技术栈。实现了微前端架构，提升了开发效率和系统可维护性。优化了首屏加载速度，从8秒降低到2秒。',
            technologies: ['React', 'TypeScript', 'Redux', 'Webpack', 'Docker', 'K8s']
          },
          {
            _id: new mongoose.Types.ObjectId(),
            project_name: '智能客服系统',
            company_name: '某科技公司',
            role: '全栈开发工程师',
            start_date: '2021-01-01',
            end_date: '2022-02-28',
            description: '开发了一套基于NLP的智能客服系统，支持多轮对话、意图识别和知识库管理。系统日均处理10万+用户咨询，客服效率提升60%。',
            technologies: ['Node.js', 'Vue.js', 'MongoDB', 'Redis', 'Python', 'TensorFlow']
          },
          {
            _id: new mongoose.Types.ObjectId(),
            project_name: '金融风控系统',
            company_name: '某金融科技公司',
            role: '高级开发工程师',
            start_date: '2019-06-01',
            end_date: '2020-12-31',
            description: '参与开发实时风控决策引擎，实现毫秒级风险评分。对接多家征信机构数据，构建用户画像体系。',
            technologies: ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'Redis']
          }
        ],
        certifications: [
          {
            _id: new mongoose.Types.ObjectId(),
            certification_name: 'AWS Solutions Architect Professional',
            issuing_organization: 'Amazon Web Services',
            issue_date: '2023-05-15',
            credential_id: 'AWS-SAP-123456',
            credential_url: 'https://aws.amazon.com/verification/123456'
          },
          {
            _id: new mongoose.Types.ObjectId(),
            certification_name: 'Google Cloud Professional Cloud Architect',
            issuing_organization: 'Google Cloud',
            issue_date: '2022-11-20',
            credential_id: 'GCP-PCA-789012'
          },
          {
            _id: new mongoose.Types.ObjectId(),
            certification_name: 'PMP项目管理专业人士',
            issuing_organization: 'Project Management Institute',
            issue_date: '2021-08-10',
            credential_id: 'PMP-345678'
          }
        ],
        education: [
          {
            _id: new mongoose.Types.ObjectId(),
            school: '上海交通大学',
            degree: '硕士',
            field_of_study: '计算机科学与技术',
            start_date: '2013-09-01',
            end_date: '2016-06-30'
          },
          {
            _id: new mongoose.Types.ObjectId(),
            school: '浙江大学',
            degree: '学士',
            field_of_study: '软件工程',
            start_date: '2009-09-01',
            end_date: '2013-06-30'
          }
        ],
        rating: {
          average: 4.8,
          count: 25
        },
        completed_projects: 15,
        profile_completion: 95,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('Profile created successfully');
    }

    console.log('\n✅ Test data initialization completed!');
    console.log('Profile includes:');
    console.log('  - 6 skills');
    console.log('  - 3 project experiences');
    console.log('  - 3 certifications');
    console.log('  - 2 education records');
    console.log('  - Languages: 中文(母语), 英语(流利), 日语(基础)');
    console.log('  - Portfolio links: 个人技术博客, GitHub');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

initProfileTestData();
