const mongoose = require('mongoose');
const SystemConfig = require('../models/system-config.model').default;
const { SYSTEM_CONFIG_TYPES } = require('../models/system-config.model');

const enumConfigs = [
  // ==================== 工时状态 ====================
  { config_type: SYSTEM_CONFIG_TYPES.WORK_LOG_STATUS, config_key: 'draft', config_value: '草稿', display_name: '草稿', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_LOG_STATUS, config_key: 'submitted', config_value: '待审批', display_name: '待审批', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_LOG_STATUS, config_key: 'confirmed', config_value: '已确认', display_name: '已确认', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_LOG_STATUS, config_key: 'rejected', config_value: '已驳回', display_name: '已驳回', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_LOG_STATUS, config_key: 'invoiced', config_value: '已开票', display_name: '已开票', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_LOG_STATUS, config_key: 'paid', config_value: '已付款', display_name: '已付款', display_order: 6 },

  // ==================== 发票状态 ====================
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_STATUS, config_key: 'draft', config_value: '草稿', display_name: '草稿', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_STATUS, config_key: 'submitted', config_value: '待审核', display_name: '待审核', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_STATUS, config_key: 'approved', config_value: '已通过', display_name: '已通过', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_STATUS, config_key: 'rejected', config_value: '已驳回', display_name: '已驳回', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_STATUS, config_key: 'sent', config_value: '已发送', display_name: '已发送', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_STATUS, config_key: 'paid', config_value: '已付款', display_name: '已付款', display_order: 6 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_STATUS, config_key: 'cancelled', config_value: '已取消', display_name: '已取消', display_order: 7 },

  // ==================== 发票类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: 'vat_special', config_value: '增值税专用发票', display_name: '增值税专用发票', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: 'vat_normal', config_value: '增值税普通发票', display_name: '增值税普通发票', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: 'personal', config_value: '个人发票', display_name: '个人发票', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TYPE, config_key: 'service_fee', config_value: '服务费发票', display_name: '服务费发票', display_order: 4 },

  // ==================== 发票税务计算模式 ====================
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TAX_MODE, config_key: 'inclusive', config_value: '含税价', display_name: '含税价', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.INVOICE_TAX_MODE, config_key: 'exclusive', config_value: '不含税价', display_name: '不含税价', display_order: 2 },

  // ==================== 支付方式 ====================
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: 'bank_transfer', config_value: '银行转账', display_name: '银行转账', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: 'alipay', config_value: '支付宝', display_name: '支付宝', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: 'wechat', config_value: '微信支付', display_name: '微信支付', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: 'check', config_value: '支票', display_name: '支票', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: 'cash', config_value: '现金', display_name: '现金', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_METHOD, config_key: 'other', config_value: '其他', display_name: '其他', display_order: 6 },

  // ==================== 支付状态 ====================
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_STATUS, config_key: 'draft', config_value: '草稿', display_name: '草稿', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_STATUS, config_key: 'submitted', config_value: '待审批', display_name: '待审批', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_STATUS, config_key: 'approved', config_value: '已批准', display_name: '已批准', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_STATUS, config_key: 'rejected', config_value: '已驳回', display_name: '已驳回', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_STATUS, config_key: 'payment_initiated', config_value: '付款中', display_name: '付款中', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_STATUS, config_key: 'paid', config_value: '已付款', display_name: '已付款', display_order: 6 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_STATUS, config_key: 'cancelled', config_value: '已取消', display_name: '已取消', display_order: 7 },

  // ==================== 支付类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_TYPE, config_key: 'work_log_settlement', config_value: '工时结算', display_name: '工时结算', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_TYPE, config_key: 'project_payment', config_value: '项目款', display_name: '项目款', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_TYPE, config_key: 'advance_payment', config_value: '预付款', display_name: '预付款', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_TYPE, config_key: 'final_payment', config_value: '尾款', display_name: '尾款', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_TYPE, config_key: 'milestone_payment', config_value: '里程碑款', display_name: '里程碑款', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_TYPE, config_key: 'refund', config_value: '退款', display_name: '退款', display_order: 6 },
  { config_type: SYSTEM_CONFIG_TYPES.PAYMENT_TYPE, config_key: 'other', config_value: '其他', display_name: '其他', display_order: 7 },

  // ==================== 单位类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.UNIT_TYPE, config_key: 'day', config_value: '天', display_name: '天', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.UNIT_TYPE, config_key: 'month', config_value: '月', display_name: '月', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.UNIT_TYPE, config_key: 'hour', config_value: '小时', display_name: '小时', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.UNIT_TYPE, config_key: 'project', config_value: '项目', display_name: '项目', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.UNIT_TYPE, config_key: 'time', config_value: '次', display_name: '次', display_order: 5 },

  // ==================== 工作类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'onsite_dev', config_value: '现场开发', display_name: '现场开发', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'remote_work', config_value: '远程工作', display_name: '远程工作', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'meeting', config_value: '会议', display_name: '会议', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'training', config_value: '培训', display_name: '培训', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'business_trip', config_value: '出差', display_name: '出差', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'code_review', config_value: '代码评审', display_name: '代码评审', display_order: 6 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'bug_fix', config_value: '问题修复', display_name: '问题修复', display_order: 7 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'requirement_analysis', config_value: '需求分析', display_name: '需求分析', display_order: 8 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'documentation', config_value: '文档编写', display_name: '文档编写', display_order: 9 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'testing', config_value: '测试', display_name: '测试', display_order: 10 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'deployment', config_value: '部署', display_name: '部署', display_order: 11 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_TYPE, config_key: 'other', config_value: '其他', display_name: '其他', display_order: 12 },

  // ==================== 公司状态 ====================
  { config_type: SYSTEM_CONFIG_TYPES.COMPANY_STATUS, config_key: 'pending', config_value: '待审核', display_name: '待审核', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.COMPANY_STATUS, config_key: 'approved', config_value: '已通过', display_name: '已通过', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.COMPANY_STATUS, config_key: 'rejected', config_value: '已驳回', display_name: '已驳回', display_order: 3 },

  // ==================== 申请状态 ====================
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'submitted', config_value: '已申请', display_name: '已申请', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'viewed', config_value: '已查看', display_name: '已查看', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'interview_scheduled', config_value: '已安排面试', display_name: '已安排面试', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'interviewed', config_value: '已面试', display_name: '已面试', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'offer_extended', config_value: '已发offer', display_name: '已发offer', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'offer_accepted', config_value: '已接受offer', display_name: '已接受offer', display_order: 6 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'offer_rejected', config_value: '已拒绝offer', display_name: '已拒绝offer', display_order: 7 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'rejected', config_value: '已拒绝', display_name: '已拒绝', display_order: 8 },
  { config_type: SYSTEM_CONFIG_TYPES.APPLICATION_STATUS, config_key: 'withdrawn', config_value: '已撤回', display_name: '已撤回', display_order: 9 },

  // ==================== 挂靠状态 ====================
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_STATUS, config_key: 'active', config_value: '活跃', display_name: '活跃', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_STATUS, config_key: 'pending', config_value: '待审核', display_name: '待审核', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_STATUS, config_key: 'suspended', config_value: '已暂停', display_name: '已暂停', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_STATUS, config_key: 'terminated', config_value: '已终止', display_name: '已终止', display_order: 4 },

  // ==================== 挂靠类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_TYPE, config_key: 'affiliated', config_value: '挂靠', display_name: '挂靠', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_TYPE, config_key: 'full_time', config_value: '正式员工', display_name: '正式员工', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_TYPE, config_key: 'outsourced', config_value: '外包', display_name: '外包', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.AFFILIATION_TYPE, config_key: 'partner', config_value: '合作', display_name: '合作', display_order: 4 },

  // ==================== 顾问类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.CONSULTANT_TYPE, config_key: 'independent', config_value: '独立顾问', display_name: '独立顾问', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.CONSULTANT_TYPE, config_key: 'affiliated', config_value: '挂靠顾问', display_name: '挂靠顾问', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.CONSULTANT_TYPE, config_key: 'team', config_value: '团队顾问', display_name: '团队顾问', display_order: 3 },

  // ==================== 技能级别 ====================
  { config_type: SYSTEM_CONFIG_TYPES.SKILL_LEVEL, config_key: 'entry', config_value: '入门', display_name: '入门', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.SKILL_LEVEL, config_key: 'junior', config_value: '初级', display_name: '初级', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.SKILL_LEVEL, config_key: 'mid', config_value: '中级', display_name: '中级', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.SKILL_LEVEL, config_key: 'senior', config_value: '高级', display_name: '高级', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.SKILL_LEVEL, config_key: 'expert', config_value: '专家', display_name: '专家', display_order: 5 },

  // ==================== 语言水平 ====================
  { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE_LEVEL, config_key: 'beginner', config_value: '入门', display_name: '入门', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE_LEVEL, config_key: 'daily', config_value: '日常会话', display_name: '日常会话', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE_LEVEL, config_key: 'business', config_value: '商务', display_name: '商务', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE_LEVEL, config_key: 'fluent', config_value: '流利', display_name: '流利', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.LANGUAGE_LEVEL, config_key: 'native', config_value: '母语', display_name: '母语', display_order: 5 },

  // ==================== 项目周期 ====================
  { config_type: SYSTEM_CONFIG_TYPES.PROJECT_DURATION, config_key: 'within_1_month', config_value: '1个月以内', display_name: '1个月以内', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.PROJECT_DURATION, config_key: '3_months', config_value: '3个月', display_name: '3个月', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.PROJECT_DURATION, config_key: '6_months', config_value: '6个月', display_name: '6个月', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.PROJECT_DURATION, config_key: '1_year', config_value: '1年', display_name: '1年', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.PROJECT_DURATION, config_key: '2_years', config_value: '2年', display_name: '2年', display_order: 5 },
  { config_type: SYSTEM_CONFIG_TYPES.PROJECT_DURATION, config_key: 'long_term', config_value: '长期', display_name: '长期', display_order: 6 },
  { config_type: SYSTEM_CONFIG_TYPES.PROJECT_DURATION, config_key: 'undetermined', config_value: '待定', display_name: '待定', display_order: 7 },

  // ==================== 面试类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.INTERVIEW_TYPE, config_key: 'phone', config_value: '电话面试', display_name: '电话面试', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.INTERVIEW_TYPE, config_key: 'video', config_value: '视频面试', display_name: '视频面试', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.INTERVIEW_TYPE, config_key: 'onsite', config_value: '现场面试', display_name: '现场面试', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.INTERVIEW_TYPE, config_key: 'written', config_value: '笔试', display_name: '笔试', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.INTERVIEW_TYPE, config_key: 'technical', config_value: '技术面试', display_name: '技术面试', display_order: 5 },

  // ==================== 推荐级别 ====================
  { config_type: SYSTEM_CONFIG_TYPES.RECOMMENDATION_LEVEL, config_key: 'strongly_recommended', config_value: '强烈推荐', display_name: '强烈推荐', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.RECOMMENDATION_LEVEL, config_key: 'recommended', config_value: '推荐', display_name: '推荐', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.RECOMMENDATION_LEVEL, config_key: 'neutral', config_value: '一般', display_name: '一般', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.RECOMMENDATION_LEVEL, config_key: 'not_recommended', config_value: '不推荐', display_name: '不推荐', display_order: 4 },

  // ==================== 优先级 ====================
  { config_type: SYSTEM_CONFIG_TYPES.PRIORITY, config_key: 'low', config_value: '低', display_name: '低', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.PRIORITY, config_key: 'medium', config_value: '中', display_name: '中', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.PRIORITY, config_key: 'high', config_value: '高', display_name: '高', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.PRIORITY, config_key: 'urgent', config_value: '紧急', display_name: '紧急', display_order: 4 },

  // ==================== 用户角色 ====================
  { config_type: SYSTEM_CONFIG_TYPES.USER_ROLE, config_key: 'job_seeker', config_value: '求职者', display_name: '求职者', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.USER_ROLE, config_key: 'hr_recruiter', config_value: 'HR招聘', display_name: 'HR招聘', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.USER_ROLE, config_key: 'admin', config_value: '管理员', display_name: '管理员', display_order: 3 },

  // ==================== 用户角色状态 ====================
  { config_type: SYSTEM_CONFIG_TYPES.USER_ROLE_STATUS, config_key: 'pending', config_value: '待审核', display_name: '待审核', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.USER_ROLE_STATUS, config_key: 'approved', config_value: '已通过', display_name: '已通过', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.USER_ROLE_STATUS, config_key: 'rejected', config_value: '已驳回', display_name: '已驳回', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.USER_ROLE_STATUS, config_key: 'frozen', config_value: '已冻结', display_name: '已冻结', display_order: 4 },

  // ==================== 工作格式 ====================
  { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: 'remote', config_value: '远程', display_name: '远程', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: 'onsite', config_value: '现场', display_name: '现场', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.WORK_FORMAT, config_key: 'hybrid', config_value: '混合', display_name: '混合', display_order: 3 },

  // ==================== 工作性质 ====================
  { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'full_time', config_value: '全职', display_name: '全职', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'part_time', config_value: '兼职', display_name: '兼职', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'freelance', config_value: '自由顾问', display_name: '自由顾问', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.JOB_NATURE, config_key: 'internship', config_value: '实习', display_name: '实习', display_order: 4 },

  // ==================== 费率类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'negotiable', config_value: '待面试', display_name: '待面试', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'daily', config_value: '日薪', display_name: '日薪', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'monthly', config_value: '月薪', display_name: '月薪', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'yearly', config_value: '年薪', display_name: '年薪', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.RATE_TYPE, config_key: 'project', config_value: '项目总价', display_name: '项目总价', display_order: 5 },

  // ==================== 外包公司类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.OUTSOURCING_TYPE, config_key: 'outsourcing', config_value: '外包公司', display_name: '外包公司', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.OUTSOURCING_TYPE, config_key: 'headhunting', config_value: '猎头公司', display_name: '猎头公司', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.OUTSOURCING_TYPE, config_key: 'affiliation', config_value: '挂靠企业', display_name: '挂靠企业', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.OUTSOURCING_TYPE, config_key: 'direct', config_value: '直签企业', display_name: '直签企业', display_order: 4 },

  // ==================== 性别 ====================
  { config_type: SYSTEM_CONFIG_TYPES.GENDER, config_key: 'male', config_value: '男', display_name: '男', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.GENDER, config_key: 'female', config_value: '女', display_name: '女', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.GENDER, config_key: 'other', config_value: '其他', display_name: '其他', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.GENDER, config_key: 'prefer_not_to_say', config_value: '不愿透露', display_name: '不愿透露', display_order: 4 },

  // ==================== 设备类型 ====================
  { config_type: SYSTEM_CONFIG_TYPES.DEVICE_TYPE, config_key: 'desktop', config_value: '桌面端', display_name: '桌面端', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.DEVICE_TYPE, config_key: 'mobile', config_value: '移动端', display_name: '移动端', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.DEVICE_TYPE, config_key: 'tablet', config_value: '平板', display_name: '平板', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.DEVICE_TYPE, config_key: 'unknown', config_value: '未知', display_name: '未知', display_order: 4 },

  // ==================== 货币 ====================
  { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'CNY', config_value: '人民币', display_name: '人民币', display_order: 1 },
  { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'USD', config_value: '美元', display_name: '美元', display_order: 2 },
  { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'EUR', config_value: '欧元', display_name: '欧元', display_order: 3 },
  { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'RUB', config_value: '卢布', display_name: '卢布', display_order: 4 },
  { config_type: SYSTEM_CONFIG_TYPES.CURRENCY, config_key: 'GBP', config_value: '英镑', display_name: '英镑', display_order: 5 },
];

async function initEnumConfig() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    
    console.log('\n========================================');
    console.log('  初始化枚举配置');
    console.log('========================================\n');

    let created = 0;
    let updated = 0;

    for (const config of enumConfigs) {
      const existing = await SystemConfig.findOne({
        config_type: config.config_type,
        config_key: config.config_key
      });

      if (existing) {
        await SystemConfig.updateOne(
          { _id: existing._id },
          { $set: config }
        );
        updated++;
      } else {
        await SystemConfig.create(config);
        created++;
      }
    }

    console.log(`✅ 创建: ${created} 条`);
    console.log(`✅ 更新: ${updated} 条`);
    console.log(`📊 总计: ${enumConfigs.length} 条枚举配置\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initEnumConfig();
