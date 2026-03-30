# 自由顾问平台完整设计方案

## 一、业务流程总览

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              自由顾问平台 - SAP类自由顾问专属                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   1. 职位发布   │───▶│   2. 顾问申请   │───▶│   3. 项目匹配   │───▶│   4. 合同签订   │
│  (HR/猎头/企业) │    │  (自由顾问)    │    │  (平台/企业)   │    │  (多方确认)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                          │
                                                                          ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   12. 项目结算   │◀───│   11. 确认结算   │◀───│   10. 开具发票   │◀───│   9. 工时审核   │
│  (顾问收款)    │    │  (企业付款)    │    │  (顾问开票)    │    │  (企业确认)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      ▲
      │
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   8. 交付成果   │───▶│   7. 提交成果   │───▶│   6. 项目执行   │◀───│   5. 项目启动   │
│  (顾问提交)    │    │  (顾问交付)    │    │  (顾问工作)    │    │  (三方启动)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## 二、用户角色定义

| 角色 | 描述 | 主要操作 |
|------|------|---------|
| **自由顾问** | 个人工作者，如SAP顾问 | 创建简历、申请项目、填报工时、提交成果、开具发票 |
| **挂靠企业** | 顾问挂靠的公司 | 管理顾问、确认工时、结算付款、接收发票 |
| **外包公司** | 猎头/外包服务公司 | 发布职位、管理项目、管理顾问工时 |
| **终端企业** | 需要顾问的企业 | 发布需求、审核顾问、确认工时、验收成果 |
| **平台运营** | 系统管理员 | 审核企业、配置技能分类、管理订单 |

## 三、职位/需求发布功能 (ProjectRequirement)

### 3.1 核心字段

```typescript
interface ProjectRequirement {
  // 基础信息
  project_title: string;              // 项目标题
  project_description: string;        // 项目描述
  company_id: ObjectId;              // 所属企业

  // 语言要求（多选）
  language_requirements: [
    "中文", "英语", "俄语", "日语", 
    "韩语", "法语", "德语", "西班牙语",
    "葡萄牙语", "阿拉伯语"
  ];

  // 工作性质
  job_nature: "全职" | "兼职" | "自由顾问" | "实习";

  // 工作形式
  work_format: "远程" | "现场" | "混合";

  // Rate（报酬）设置
  rate_type: "待面试" | "日薪" | "月薪" | "年薪" | "项目总价";
  rate_amount?: number;               // 金额
  rate_currency: "CNY" | "USD" | "EUR" | "RUB" | "GBP";

  // 技能分类（多选联动）
  project_major_categories: ObjectId[];  // 大类：ERP、CRM、JAVA等
  project_sub_categories: ObjectId[];    // 小类：MM、FICO、SD等

  // 项目周期
  project_cycle: "1个月以内" | "3个月" | "6个月" | "1年" | "2年" | "2年以上" | "长期" | "待定";

  // 技能要求
  required_skills: [{
    skill_name: string;
    skill_level: "入门" | "初级" | "中级" | "高级" | "专家";
    is_mandatory: boolean;
  }];

  // 招聘人数
  hiring_count: number;
}
```

### 3.2 技能分类联动示例

```
大类 (SkillCategory)                    小类 (SkillSubCategory)
───────────────────────────────────   ─────────────────────────────────
ERP                                   ├── SAP
                                      │   ├── MM (物料管理)
                                      │   ├── FICO (财务)
                                      │   ├── SD (销售与分销)
                                      │   ├── ABAP (开发)
                                      │   ├── HANA
                                      │   └── PP (生产计划)
                                      │
                                      ├── Oracle EBS
                                      │   ├── Financials
                                      │   ├── SCM
                                      │   └── HR
                                      │
CRM                                   ├── Salesforce
                                      ├── Dynamics 365
                                      └── SAP CRM

JAVA                                  ├── Spring
                                      │   ├── Spring Boot
                                      │   ├── Spring Cloud
                                      │   └── Spring Security
                                      │
                                      ├── Maven/Gradle
                                      ├── Kafka
                                      ├── MyBatis
                                      └── 分布式系统

.NET                                  ├── ASP.NET Core
                                      ├── .NET Framework
                                      └── Xamarin

前端                                  ├── React
                                      ├── Vue.js
                                      ├── Angular
                                      └── Next.js
```

## 四、自由顾问简历 (FreelancerProfile)

### 4.1 核心字段

```typescript
interface FreelancerProfile {
  user_id: ObjectId;
  freelancer_type: "独立顾问" | "挂靠顾问" | "团队顾问";

  // 费率设置
  hourly_rate?: number;
  daily_rate?: number;
  monthly_rate?: number;
  preferred_currency: "CNY" | "USD" | "EUR" | "RUB" | "GBP";

  // 语言能力
  languages: [{
    language: string;
    proficiency: "入门" | "日常会话" | "商务" | "流利" | "母语";
  }];

  // 技能分类
  skill_category_ids: ObjectId[];    // 大类
  skill_sub_category_ids: ObjectId[]; // 小类

  // 认证
  certifications: [{
    certification_name: string;
    issuing_organization: string;
    issue_date: Date;
    expiry_date?: Date;
  }];

  // 可用性
  availability_status: "available" | "busy" | "not_available" | "open_to_opportunities";
}
```

## 五、工时填报与确认系统

### 5.1 工作日志 (WorkLog)

```typescript
interface WorkLog {
  freelancer_id: ObjectId;
  project_requirement_id: ObjectId;
  company_id: ObjectId;
  affiliation_id: ObjectId;          // 挂靠关系

  // 时间信息
  work_date: Date;
  work_period_start: Date;
  work_period_end: Date;
  hours_worked: number;

  // 工作类型
  work_type: 
    | "现场开发" | "远程工作" | "会议" 
    | "培训" | "出差" | "代码评审" 
    | "问题修复" | "需求分析" | "文档编写" 
    | "测试" | "部署" | "其他";

  // 工作内容
  work_description: string;          // 简要描述
  work_content_detail?: string;      // 详细内容

  // 附件（工时确认单等）
  attachments: [{
    file_name: string;
    file_url: string;
    file_type: string;
    file_description: string;
  }];

  // 状态流转
  status: "draft" | "submitted" | "confirmed" | "rejected" | "invoiced" | "paid";

  // billing
  billing_info: {
    daily_rate: number;
    hours_billable: number;
    amount: number;
    currency: string;
    is_tax_inclusive: boolean;        // 含税/不含税
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
  };
}
```

### 5.2 工时填报流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                    工时填报与确认流程                                 │
└─────────────────────────────────────────────────────────────────────┘

1. 顾问填报工时
   ├── 选择项目
   ├── 选择工作日期
   ├── 填写工作小时数
   ├── 选择工作类型
   ├── 填写工作描述
   ├── 上传附件（可选）
   └── 保存草稿/提交

2. 批量提交
   ├── 选择日期范围（如：1月1日-1月15日）
   ├── 汇总所有工作日志
   ├── 生成工时汇总表
   └── 批量提交给企业

3. 企业审核
   ├── 查看工时明细
   ├── 查看附件
   ├── 确认或驳回
   └── 驳回时填写原因

4. 确认后开票
   ├── 基于已确认工时生成账单
   ├── 创建发票
   └── 发送给企业
```

## 六、挂靠企业管理

### 6.1 挂靠关系 (FreelancerAffiliation)

```typescript
interface FreelancerAffiliation {
  freelancer_id: ObjectId;
  company_id: ObjectId;              // 挂靠企业
  affiliation_type: "挂靠" | "正式员工" | "外包" | "合作";

  // 合同信息
  contract_info: {
    contract_number: string;
    contract_start_date: Date;
    contract_end_date: Date;
    contract_document_url: string;
  };

  // 费率约定
  billing_info: {
    billing_mode: "月薪" | "日薪" | "项目制" | "小时制";
    agreed_daily_rate: number;
    agreed_monthly_rate?: number;
  };

  // 税务设置
  tax_info: {
    tax_inclusive: boolean;          // 含税价/不含税价
    tax_rate: number;                // 税率（如6%）
    invoice_type: "增值税专用发票" | "增值税普通发票" | "个人发票";
  };

  // 状态
  status: "pending" | "active" | "suspended" | "terminated";
}
```

### 6.2 多层关系示意图

```
终端企业 (End Client)
       │
       │  发布需求
       ▼
外包/猎头公司 (Outsourcing Company)
       │
       │  外包分配 / 挂靠
       ▼
挂靠企业 (Affiliated Company)
       │
       │  合作顾问
       ▼
自由顾问 (Freelancer)
       │
       │  工作输出
       ▼
工时填报 → 企业确认 → 开具发票 → 收款结算
```

## 七、开票与付款流程

### 7.1 发票模型 (FreelancerInvoice)

```typescript
interface FreelancerInvoice {
  invoice_number: string;           // 发票号
  freelancer_id: ObjectId;
  company_id: ObjectId;
  affiliation_id: ObjectId;

  // 开票类型
  invoice_type: "增值税专用发票" | "增值税普通发票" | "个人发票" | "服务费发票";

  // 计费周期
  billing_period_start: Date;
  billing_period_end: Date;

  // 税额计算模式
  tax_calculation_mode: "含税价" | "不含税价";
  tax_rate: number;                 // 如6%
  tax_amount: number;
  total_amount: number;

  // 税额分解
  tax_breakdown: {
    vat_amount: number;            // 增值税
    personal_income_tax_amount: number; // 个税
    other_taxes: number;
  };

  // 状态
  status: "draft" | "submitted" | "approved" | "rejected" | "sent" | "paid" | "cancelled";

  // 付款信息
  payment_method?: "银行转账" | "支付宝" | "微信支付";
  paid_date?: Date;
}
```

### 7.2 税务计算示例

```typescript
// 场景：顾问日薪1000元/天，工作15天

// 情况1：含税价（企业承担税费）
const grossAmount = 1000 * 15; // 15000元
const vatRate = 6;
const { exclTax, tax } = TaxCalculator.splitTaxFromGross(grossAmount, vatRate);
// exclTax = 14150.94元
// tax = 849.06元

// 情况2：不含税价（顾问实得）
const netAmount = 1000 * 15;   // 15000元
const { inclTax, tax } = TaxCalculator.addTaxToNet(netAmount, vatRate);
// inclTax = 15900元
// tax = 900元

// 情况3：含税价 + 个人所得税
const result = TaxCalculator.calculateFreelancerPayment({
  grossAmount: 15000,
  isTaxInclusive: true,
  vatRate: 6,
  personalIncomeTaxRate: 0.20,  // 预扣20%
  platformFeeRate: 5,           // 平台费5%
});
// 返回完整的税务分解和顾问实得金额
```

## 八、用户界面设计

### 8.1 职位发布页面字段

| 字段 | 类型 | 说明 |
|------|------|------|
| 项目标题 | 文本输入 | 必填，最多200字 |
| 项目描述 | 富文本 | 必填，详细描述项目需求 |
| 语言要求 | 多选checkbox | 中文、英语、俄语等 |
| 工作性质 | 单选 | 全职/兼职/自由顾问/实习 |
| 工作形式 | 单选 | 远程/现场/混合 |
| Rate类型 | 下拉选择 | 待面试/日薪/月薪/年薪/项目总价 |
| Rate金额 | 数字输入 | 根据类型显示 |
| 货币 | 下拉选择 | CNY/USD/EUR/RUB/GBP |
| 项目大类 | 多选（联动） | ERP/CRM/JAVA等 |
| 项目小类 | 多选（联动） | 根据大类联动显示 |
| 项目周期 | 下拉选择 | 1个月/3个月/6个月/1年/2年/长期 |
| 技能要求 | 标签+等级 | 可添加多项 |
| 工作地点 | 地址选择 | 城市/国家 |
| 预算范围 | 范围输入 | 最小-最大 |
| 招聘人数 | 数字 | 默认1 |

### 8.2 工时填报页面

```
┌────────────────────────────────────────────────────────────┐
│  工时填报 - 2024年1月                                        │
├────────────────────────────────────────────────────────────┤
│  项目选择: [SAP MM模块实施项目          ▼]                   │
│  挂靠企业: [上海外包公司A              ▼]                   │
├────────────────────────────────────────────────────────────┤
│  日期       │ 工作类型      │ 小时 │ 描述          │ 操作  │
├────────────────────────────────────────────────────────────┤
│  01-02 周二 │ 远程工作      │  8   │ 完成库存模块..│ 编辑  │
│  01-03 周三 │ 远程工作      │  6   │ 需求分析会议..│ 编辑  │
│  01-04 周四 │ 现场开发      │  8   │ 客户现场培.. │ 编辑  │
│  01-05 周五 │ 问题修复      │  4   │ Bug修复...   │ 编辑  │
├────────────────────────────────────────────────────────────┤
│  [+ 添加工时]                                               │
├────────────────────────────────────────────────────────────┤
│  汇总: 26小时  │  日薪: ¥2,000  │  合计: ¥52,000           │
│                                    含税价 ○  不含税价 ○     │
├────────────────────────────────────────────────────────────┤
│  附件上传: [选择文件] 已上传: 工时确认单_1月.pdf             │
├────────────────────────────────────────────────────────────┤
│                    [保存草稿]  [提交工时]                    │
└────────────────────────────────────────────────────────────┘
```

### 8.3 发票开具页面

```
┌────────────────────────────────────────────────────────────┐
│  开具发票                                                   │
├────────────────────────────────────────────────────────────┤
│  发票类型: [增值税普通发票              ▼]                 │
│  开票给:   [上海外包公司A              ▼]                  │
│  计费周期: [2024-01-01 至 2024-01-15]                      │
├────────────────────────────────────────────────────────────┤
│  价税分离设置:  ○ 含税价    ● 不含税价                       │
├────────────────────────────────────────────────────────────┤
│  明细项目:                                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 描述          │ 数量 │ 单位 │ 单价    │ 金额         │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ SAP MM顾问服务 │  15  │  天  │ 2,000   │ 30,000      │ │
│  │ SAP SD顾问服务 │  10  │  天  │ 2,200   │ 22,000      │ │
│  └──────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│  金额计算:                                                   │
│  ├── 不含税金额:          ¥52,000.00                       │
│  ├── 增值税率 (6%):        ¥3,120.00                       │
│  ├── 价税合计:            ¥55,120.00                       │
│  └── 大写: 伍万伍仟壹佰贰拾元整                             │
├────────────────────────────────────────────────────────────┤
│  发票信息:                                                   │
│  ├── 发票抬头: 上海外包公司A                                 │
│  ├── 税号: 91310000XXXXXXXXX                               │
│  ├── 开户行: 工商银行上海分行                                │
│  └── 账号: 1001XXXXXXXXXXXX                               │
├────────────────────────────────────────────────────────────┤
│                    [保存草稿]  [提交发票]                    │
└────────────────────────────────────────────────────────────┘
```

## 九、数据模型关系

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              数据模型关系图                                         │
└──────────────────────────────────────────────────────────────────────────────────┘

UserAccount ─────────────┬────────────── FreelancerProfile
     │                   │                    │
     │                    └──────┬───────────┘
     │                           │
     │                    FreelancerAffiliation
     │                           │
     │                           │
     │              ┌────────────┼────────────┐
     │              │            │            │
     │              ▼            ▼            ▼
     │     ProjectRequirement  WorkLog   FreelancerInvoice
     │              │            │            │
     │              │            │            │
     │              └────────────┼────────────┘
     │                           │
     │                           ▼
     │                  WorkLogBatch
     │                           │
     │                           ▼
     │                  MilestoneDeliverable
     │                           │
Company ────────────────────────┘
     │
     │
OutsourcingCompany
```

## 十、API 接口设计

### 10.1 职位相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/project-requirements | 获取项目需求列表 |
| GET | /api/project-requirements/:id | 获取项目需求详情 |
| POST | /api/project-requirements | 创建项目需求 |
| PUT | /api/project-requirements/:id | 更新项目需求 |
| DELETE | /api/project-requirements/:id | 删除项目需求 |
| POST | /api/project-requirements/:id/apply | 申请项目 |

### 10.2 工时相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/work-logs | 获取工时列表 |
| POST | /api/work-logs | 创建工时 |
| PUT | /api/work-logs/:id | 更新工时 |
| POST | /api/work-logs/batch/submit | 批量提交工时 |
| POST | /api/work-logs/:id/confirm | 确认工时 |
| POST | /api/work-logs/:id/reject | 驳回工时 |

### 10.3 发票相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/freelancer-invoices | 获取发票列表 |
| POST | /api/freelancer-invoices | 创建发票 |
| PUT | /api/freelancer-invoices/:id | 更新发票 |
| POST | /api/freelancer-invoices/:id/submit | 提交发票 |
| POST | /api/freelancer-invoices/:id/approve | 审批发票 |
| POST | /api/freelancer-invoices/:id/mark-paid | 标记已支付 |

### 10.4 技能分类

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/skill-categories | 获取所有技能大类 |
| GET | /api/skill-categories/:id/sub-categories | 获取技能小类 |
| GET | /api/skill-categories/tree | 获取完整分类树 |

## 十一、实现优先级

### P0 - 核心功能
1. 技能分类体系（SkillCategory + SkillSubCategory）
2. 项目需求发布（ProjectRequirement）
3. 自由顾问简历（FreelancerProfile）
4. 项目申请（FreelancerProjectApplication）

### P1 - 工时管理
5. 工时填报（WorkLog）
6. 工时确认/驳回
7. 工时批量提交

### P2 - 财务流程
8. 发票开具（FreelancerInvoice）
9. 税务计算工具
10. 付款记录

### P3 - 高级功能
11. 里程碑交付（MilestoneDeliverable）
12. 挂靠企业管理
13. 多语言支持
14. 评价与评分系统

## 十二、技术实现要点

### 12.1 大类小类联动前端实现

```typescript
// React联动选择示例
const [selectedMajorCategories, setSelectedMajorCategories] = useState<string[]>([]);
const [availableSubCategories, setAvailableSubCategories] = useState<ISkillSubCategory[]>([]);

useEffect(() => {
  if (selectedMajorCategories.length > 0) {
    // 根据选中的大类获取小类
    const subs = allSubCategories.filter(
      sub => selectedMajorCategories.includes(sub.category_id)
    );
    setAvailableSubCategories(subs);
  } else {
    setAvailableSubCategories([]);
  }
}, [selectedMajorCategories, allSubCategories]);
```

### 12.2 税额计算

```typescript
// 使用TaxCalculator
import { TaxCalculator } from '@/utils/tax_calculator';

const calculate = () => {
  const result = TaxCalculator.calculateWorkLogBilling({
    hoursOrDays: 15,
    unit: '天',
    dailyOrHourlyRate: 2000,
    isTaxInclusive: true,
    taxRate: 6
  });

  // 显示结果
  console.log(result);
};
```

### 12.3 附件上传

```typescript
// 工时附件上传
const uploadAttachment = async (file: File, workLogId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('workLogId', workLogId);

  const response = await fetch('/api/work-logs/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
};
```
