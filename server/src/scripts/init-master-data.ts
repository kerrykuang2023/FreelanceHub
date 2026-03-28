import mongoose from 'mongoose';
import Company from '../models/company-profile/company.model';
import SkillCategory from '../models/freelancer/skill_category.model';
import SkillSubCategory from '../models/freelancer/skill_sub_category.model';
import UserAccount from '../models/user/user-account.model';
import FreelancerProfile from '../models/freelancer/freelancer_profile.model';
import UserRole from '../models/user/user-role.model';
import SystemConfig, { SYSTEM_CONFIG_TYPES } from '../models/system-config.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal';

interface MasterDataResult {
  companies: any[];
  skillCategories: any[];
  skillSubCategories: any[];
  users: any[];
  freelancerProfiles: any[];
  systemConfigs: any[];
}

export async function initializeMasterData(): Promise<MasterDataResult> {
  console.log('🚀 开始初始化主数据...');
  
  const result: MasterDataResult = {
    companies: [],
    skillCategories: [],
    skillSubCategories: [],
    users: [],
    freelancerProfiles: [],
    systemConfigs: [],
  };

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');

    result.companies = await initializeCompanies();
    result.skillCategories = await initializeSkillCategories();
    result.skillSubCategories = await initializeSkillSubCategories(result.skillCategories);
    result.systemConfigs = await initializeSystemConfigs();
    result.users = await initializeTestUsers(result.companies);
    result.freelancerProfiles = await initializeFreelancerProfiles(result.users);

    console.log('\n' + '='.repeat(80));
    console.log('✅ 主数据初始化完成');
    console.log('='.repeat(80));
    console.log(`- 公司: ${result.companies.length} 家`);
    console.log(`- 技能大类: ${result.skillCategories.length} 个`);
    console.log(`- 技能小类: ${result.skillSubCategories.length} 个`);
    console.log(`- 系统配置: ${result.systemConfigs.length} 项`);
    console.log(`- 测试用户: ${result.users.length} 个`);
    console.log(`- 顾问档案: ${result.freelancerProfiles.length} 个`);
    console.log('='.repeat(80));

    return result;
  } catch (error) {
    console.error('❌ 主数据初始化失败:', error);
    throw error;
  }
}

async function initializeCompanies(): Promise<any[]> {
  console.log('\n📋 初始化公司信息...');
  
  const companies = [
    {
      company_name: '测试终端企业A',
      company_type: 'limited_company',
      business_license_number: '91110000MA00ABCD12',
      legal_representative: '张三',
      contact_phone: '13800138001',
      company_address: '北京市朝阳区测试路1号',
      verification_status: 'approved',
      verified_at: new Date(),
      profile_description: '测试终端企业，用于E2E测试',
    },
    {
      company_name: '测试挂靠企业B',
      company_type: 'limited_company',
      business_license_number: '91110000MA00EFGH34',
      legal_representative: '王五',
      contact_phone: '13800138002',
      company_address: '北京市海淀区测试街2号',
      verification_status: 'approved',
      verified_at: new Date(),
      profile_description: '测试挂靠企业，用于E2E测试',
    },
    {
      company_name: '测试外包公司C',
      company_type: 'limited_company',
      business_license_number: '91110000MA00IJKL56',
      legal_representative: '赵七',
      contact_phone: '13800138003',
      company_address: '上海市浦东新区测试大道3号',
      verification_status: 'approved',
      verified_at: new Date(),
      profile_description: '测试外包公司，用于E2E测试',
    },
  ];

  const createdCompanies: any[] = [];
  
  for (const companyData of companies) {
    const existing = await Company.findOne({ company_name: companyData.company_name });
    if (existing) {
      console.log(`  - 公司已存在: ${companyData.company_name}`);
      createdCompanies.push(existing);
    } else {
      const company = new Company(companyData);
      await company.save();
      console.log(`  - 创建公司: ${companyData.company_name}`);
      createdCompanies.push(company);
    }
  }

  return createdCompanies;
}

async function initializeSkillCategories(): Promise<any[]> {
  console.log('\n📋 初始化技能大类...');
  
  const categories = [
    { category_name: 'SAP', category_code: 'SAP', description: 'SAP相关技能', display_order: 1 },
    { category_name: 'Java', category_code: 'JAVA', description: 'Java开发技能', display_order: 2 },
    { category_name: 'Python', category_code: 'PYTHON', description: 'Python开发技能', display_order: 3 },
    { category_name: '前端开发', category_code: 'FRONTEND', description: '前端开发技能', display_order: 4 },
    { category_name: '数据库', category_code: 'DATABASE', description: '数据库技能', display_order: 5 },
    { category_name: '项目管理', category_code: 'PM', description: '项目管理技能', display_order: 6 },
  ];

  const createdCategories: any[] = [];
  
  for (const catData of categories) {
    const existing = await SkillCategory.findOne({ category_code: catData.category_code });
    if (existing) {
      console.log(`  - 技能大类已存在: ${catData.category_name}`);
      createdCategories.push(existing);
    } else {
      const category = new SkillCategory(catData);
      await category.save();
      console.log(`  - 创建技能大类: ${catData.category_name}`);
      createdCategories.push(category);
    }
  }

  return createdCategories;
}

async function initializeSkillSubCategories(parentCategories: any[]): Promise<any[]> {
  console.log('\n📋 初始化技能小类...');
  
  const subCategoriesMap: { [key: string]: { name: string; code: string }[] } = {
    'SAP': [
      { name: 'SAP MM', code: 'SAP_MM' },
      { name: 'SAP FICO', code: 'SAP_FICO' },
      { name: 'SAP SD', code: 'SAP_SD' },
      { name: 'SAP PP', code: 'SAP_PP' },
    ],
    'Java': [
      { name: 'Spring Boot', code: 'JAVA_SPRING_BOOT' },
      { name: '微服务', code: 'JAVA_MICROSERVICE' },
      { name: 'MyBatis', code: 'JAVA_MYBATIS' },
    ],
    'Python': [
      { name: 'Django', code: 'PYTHON_DJANGO' },
      { name: 'Flask', code: 'PYTHON_FLASK' },
      { name: '数据分析', code: 'PYTHON_DATA' },
    ],
    '前端开发': [
      { name: 'React', code: 'FE_REACT' },
      { name: 'Vue', code: 'FE_VUE' },
      { name: 'Angular', code: 'FE_ANGULAR' },
    ],
    '数据库': [
      { name: 'MySQL', code: 'DB_MYSQL' },
      { name: 'PostgreSQL', code: 'DB_POSTGRESQL' },
      { name: 'MongoDB', code: 'DB_MONGODB' },
    ],
    '项目管理': [
      { name: '敏捷管理', code: 'PM_AGILE' },
      { name: 'PMP', code: 'PM_PMP' },
    ],
  };

  const createdSubCategories: any[] = [];
  
  for (const parent of parentCategories) {
    const subCats = subCategoriesMap[parent.category_name] || [];
    
    for (const subCatData of subCats) {
      const existing = await SkillSubCategory.findOne({ 
        category_id: parent._id, 
        sub_category_code: subCatData.code 
      });
      
      if (existing) {
        console.log(`  - 技能小类已存在: ${parent.category_name} > ${subCatData.name}`);
        createdSubCategories.push(existing);
      } else {
        const subCategory = new SkillSubCategory({
          category_id: parent._id,
          sub_category_name: subCatData.name,
          sub_category_code: subCatData.code,
          display_order: createdSubCategories.length + 1,
        });
        await subCategory.save();
        console.log(`  - 创建技能小类: ${parent.category_name} > ${subCatData.name}`);
        createdSubCategories.push(subCategory);
      }
    }
  }

  return createdSubCategories;
}

async function initializeSystemConfigs(): Promise<any[]> {
  console.log('\n📋 初始化系统配置...');
  
  const configs = [
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'remote', config_value: 'remote', display_name: '远程工作', display_order: 1 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'onsite', config_value: 'onsite', display_name: '现场开发', display_order: 2 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'meeting', config_value: 'meeting', display_name: '会议', display_order: 3 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'training', config_value: 'training', display_name: '培训', display_order: 4 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'travel', config_value: 'travel', display_name: '出差', display_order: 5 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'code_review', config_value: 'code_review', display_name: '代码评审', display_order: 6 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'bug_fix', config_value: 'bug_fix', display_name: '问题修复', display_order: 7 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'requirement', config_value: 'requirement', display_name: '需求分析', display_order: 8 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'documentation', config_value: 'documentation', display_name: '文档编写', display_order: 9 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'testing', config_value: 'testing', display_name: '测试', display_order: 10 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'deployment', config_value: 'deployment', display_name: '部署', display_order: 11 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'other', config_value: 'other', display_name: '其他', display_order: 12 },
    
    { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'fulltime', config_value: '全职', display_name: '全职', display_order: 1 },
    { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'parttime', config_value: '兼职', display_name: '兼职', display_order: 2 },
    { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'freelancer', config_value: '自由顾问', display_name: '自由顾问', display_order: 3 },
    { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'intern', config_value: '实习', display_name: '实习', display_order: 4 },
    
    { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: 'remote', config_value: '远程', display_name: '远程', display_order: 1 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: 'onsite', config_value: '现场', display_name: '现场', display_order: 2 },
    { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: 'hybrid', config_value: '混合', display_name: '混合', display_order: 3 },
    
    { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'negotiable', config_value: '待面试', display_name: '待面试', display_order: 1 },
    { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'daily', config_value: '日薪', display_name: '日薪', display_order: 2 },
    { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'monthly', config_value: '月薪', display_name: '月薪', display_order: 3 },
    { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'yearly', config_value: '年薪', display_name: '年薪', display_order: 4 },
    { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'project', config_value: '项目总价', display_name: '项目总价', display_order: 5 },
    
    { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'CNY', config_value: 'CNY', display_name: '人民币 (CNY)', display_order: 1 },
    { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'USD', config_value: 'USD', display_name: '美元 (USD)', display_order: 2 },
    { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'EUR', config_value: 'EUR', display_name: '欧元 (EUR)', display_order: 3 },
    
    { config_type: SYSTEM_CONFIG_TYPES.TAX_RATE, config_key: 'vat_6', config_value: '6', display_name: '6%', display_order: 1 },
    { config_type: SYSTEM_CONFIG_TYPES.TAX_RATE, config_key: 'vat_13', config_value: '13', display_name: '13%', display_order: 2 },
    
    { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: 'vat_special', config_value: '增值税专用发票', display_name: '增值税专用发票', display_order: 1 },
    { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: 'vat_normal', config_value: '增值税普通发票', display_name: '增值税普通发票', display_order: 2 },
    { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: 'personal', config_value: '个人发票', display_name: '个人发票', display_order: 3 },
  ];

  const createdConfigs: any[] = [];
  
  for (const configData of configs) {
    const existing = await SystemConfig.findOne({ 
      config_type: configData.config_type, 
      config_key: configData.config_key 
    });
    
    if (existing) {
      createdConfigs.push(existing);
    } else {
      const config = new SystemConfig(configData);
      await config.save();
      createdConfigs.push(config);
    }
  }
  
  console.log(`  - 创建/更新系统配置: ${createdConfigs.length} 项`);

  return createdConfigs;
}

async function initializeTestUsers(companies: any[]): Promise<any[]> {
  console.log('\n📋 初始化测试用户...');
  
  const testUsers = [
    {
      email: 'freelancer1@test.com',
      password: 'Test1234!',
      first_name: '测试顾问',
      last_name: 'A',
      contact_number: '13900139001',
      user_type_id: null,
    },
    {
      email: 'freelancer2@test.com',
      password: 'Test1234!',
      first_name: '测试顾问',
      last_name: 'B',
      contact_number: '13900139002',
      user_type_id: null,
    },
    {
      email: 'hr1@test.com',
      password: 'Test1234!',
      first_name: '测试HR',
      last_name: 'A',
      contact_number: '13900139003',
      user_type_id: null,
    },
    {
      email: 'hr2@test.com',
      password: 'Test1234!',
      first_name: '测试HR',
      last_name: 'B',
      contact_number: '13900139004',
      user_type_id: null,
    },
    {
      email: 'admin@test.com',
      password: 'Test1234!',
      first_name: '测试管理员',
      last_name: '',
      contact_number: '13900139005',
      user_type_id: null,
    },
    {
      email: 'admin2@test.com',
      password: 'Test1234!',
      first_name: '测试管理员',
      last_name: 'B',
      contact_number: '13900139006',
      user_type_id: null,
    },
  ];

  const createdUsers: any[] = [];
  const bcrypt = require('bcrypt');
  
  for (const userData of testUsers) {
    const existing = await UserAccount.findOne({ email: userData.email });
    if (existing) {
      console.log(`  - 用户已存在: ${userData.email}`);
      createdUsers.push(existing);
    } else {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new UserAccount({
        email: userData.email,
        password: hashedPassword,
        first_name: userData.first_name,
        last_name: userData.last_name,
        contact_number: userData.contact_number,
        is_active: true,
        registration_date: new Date(),
      });
      await user.save();
      console.log(`  - 创建用户: ${userData.email}`);
      createdUsers.push(user);
    }
  }

  console.log('\n📋 创建用户角色...');
  
  const userRoles = [
    { email: 'freelancer1@test.com', role_type: 'Job Seeker', status: 'approved' },
    { email: 'freelancer2@test.com', role_type: 'Job Seeker', status: 'approved' },
    { email: 'hr1@test.com', role_type: 'HR Recruiter', status: 'approved' },
    { email: 'hr2@test.com', role_type: 'HR Recruiter', status: 'approved' },
    { email: 'admin@test.com', role_type: 'Administrator', status: 'approved' },
    { email: 'admin2@test.com', role_type: 'Administrator', status: 'approved' },
  ];

  for (const roleData of userRoles) {
    const user = createdUsers.find(u => u.email === roleData.email);
    if (user) {
      const existingRole = await UserRole.findOne({ 
        user_id: user._id, 
        role_type: roleData.role_type 
      });
      
      if (!existingRole) {
        const userRole = new UserRole({
          user_id: user._id,
          role_type: roleData.role_type,
          status: roleData.status,
          approved_at: new Date(),
        });
        await userRole.save();
        console.log(`  - 创建角色: ${roleData.email} - ${roleData.role_type}`);
      }
    }
  }

  return createdUsers;
}

async function initializeFreelancerProfiles(users: any[]): Promise<any[]> {
  console.log('\n📋 初始化顾问档案...');
  
  const freelancerUsers = users.filter(u => 
    u.email.includes('freelancer')
  );

  const createdProfiles: any[] = [];
  
  for (const user of freelancerUsers) {
    const existing = await FreelancerProfile.findOne({ user_id: user._id });
    if (existing) {
      console.log(`  - 顾问档案已存在: ${user.email}`);
      createdProfiles.push(existing);
    } else {
      const profile = new FreelancerProfile({
        user_id: user._id,
        display_name: `${user.first_name} ${user.last_name}`,
        headline: '资深技术顾问',
        summary: '拥有丰富项目经验的技术顾问',
        years_of_experience: 8,
        daily_rate: 2000,
        monthly_rate: 40000,
        preferred_currency: 'CNY',
        availability_status: 'available',
        is_verified: true,
        is_active: true,
      });
      await profile.save();
      console.log(`  - 创建顾问档案: ${user.email}`);
      createdProfiles.push(profile);
    }
  }

  return createdProfiles;
}

export async function verifyMasterData(): Promise<{ success: boolean; details: any }> {
  console.log('\n🔍 验证主数据完整性...');
  
  const checks = {
    companies: await Company.countDocuments(),
    skillCategories: await SkillCategory.countDocuments(),
    skillSubCategories: await SkillSubCategory.countDocuments(),
    systemConfigs: await SystemConfig.countDocuments(),
    users: await UserAccount.countDocuments(),
    freelancerProfiles: await FreelancerProfile.countDocuments(),
  };

  const requirements = {
    companies: { min: 2, description: '终端企业和挂靠企业' },
    skillCategories: { min: 2, description: '技能大类' },
    skillSubCategories: { min: 4, description: '技能小类' },
    systemConfigs: { min: 20, description: '系统配置' },
    users: { min: 6, description: '测试用户' },
    freelancerProfiles: { min: 2, description: '顾问档案' },
  };

  let allPassed = true;
  const details: any = {};

  for (const [key, requirement] of Object.entries(requirements)) {
    const actual = checks[key as keyof typeof checks];
    const passed = actual >= requirement.min;
    allPassed = allPassed && passed;
    
    details[key] = {
      actual,
      required: requirement.min,
      passed,
      description: requirement.description,
    };

    if (passed) {
      console.log(`  ✅ ${requirement.description}: ${actual}/${requirement.min}`);
    } else {
      console.log(`  ❌ ${requirement.description}: ${actual}/${requirement.min} (不足)`);
    }
  }

  return {
    success: allPassed,
    details,
  };
}

if (require.main === module) {
  initializeMasterData()
    .then(async () => {
      const verification = await verifyMasterData();
      if (verification.success) {
        console.log('\n✅ 主数据验证通过');
        process.exit(0);
      } else {
        console.log('\n❌ 主数据验证失败');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('初始化失败:', error);
      process.exit(1);
    })
    .finally(() => {
      mongoose.disconnect();
    });
}
