# 项目管理规范

**版本:** v1.0  
**创建日期:** 2026-03-24  
**适用项目:** JobPortal 自由顾问平台

---

## 1. 概述

本文档定义了JobPortal项目的开发管理规范，包括任务管理、需求实现、国际化支持、测试验证等全流程规范。

---

## 2. 任务管理规范

### 2.1 任务状态定义

| 状态 | 标识 | 描述 |
|------|------|------|
| 待处理 | `pending` | 任务已创建，等待开始 |
| 进行中 | `in_progress` | 任务正在执行 |
| 已完成 | `completed` | 任务已完成并通过验证 |
| 已阻塞 | `blocked` | 任务被阻塞，需要外部支持 |
| 已取消 | `cancelled` | 任务已取消 |

### 2.2 任务优先级定义

| 优先级 | 标识 | 处理时限 | 描述 |
|--------|------|----------|------|
| P0 | `critical` | 立即处理 | 核心功能缺失，影响主流程 |
| P1 | `high` | 1-2周 | 重要功能优化，影响用户体验 |
| P2 | `medium` | 1个月 | 功能增强，提升产品价值 |
| P3 | `low` | 迭代处理 | 优化改进，非紧急 |

### 2.3 任务生命周期

```
创建任务 → 待处理 → 进行中 → 已完成
              ↓           ↓
           已阻塞      测试失败 → 创建新任务
              ↓
           取消 → 已取消
```

### 2.4 任务文件结构

```
docs/
├── TASK-LIST.md              # 待办任务清单（主文件）
├── TASK-HISTORY.md           # 任务历史记录
├── PRD-Freelancer-Platform.md # PRD文档
├── PRD-Feature-Checklist.md  # 功能检查清单
└── E2E-Test-Documentation.md  # 测试文档
```

---

## 3. 需求实现规范

### 3.1 需求实现流程

```
1. 读取任务清单，选择优先级最高的待处理任务
2. 阅读PRD文档中对应的功能需求
3. 设计实现方案（前端+后端）
4. 编写代码实现
5. 编写/更新E2E测试用例
6. 执行测试验证
7. 更新任务状态
8. 更新功能检查清单
```

### 3.2 需求描述模板

每个任务必须包含以下信息：

```markdown
### TASK-XXX: 任务名称

**优先级:** P0/P1/P2/P3  
**状态:** pending/in_progress/completed  
**PRD章节:** X.X.X  
**创建时间:** YYYY-MM-DD  
**完成时间:** YYYY-MM-DD（完成后填写）

#### 需求描述
详细描述需求内容和业务背景。

#### 任务目标
- [ ] 目标1：具体可验证的目标
- [ ] 目标2：具体可验证的目标
- [ ] 目标3：具体可验证的目标

#### 验收标准
1. 标准1：具体的验收条件
2. 标准2：具体的验收条件

#### 技术实现要点
- 前端实现要点
- 后端实现要点
- 数据库变更

#### 相关文件
- 前端文件路径
- 后端文件路径
- 测试文件路径

#### 测试用例
- TEST-XXX: 测试用例描述
```

### 3.3 任务完成标准

任务必须满足以下所有条件才能标记为完成：

| 条件 | 验证方式 |
|------|----------|
| 代码实现完成 | 代码已提交 |
| TypeScript编译通过 | `npm run build` 无错误 |
| ESLint检查通过 | `npm run lint` 无错误 |
| E2E测试通过 | 测试用例全部通过 |
| PRD需求对照通过 | 功能检查清单已更新 |
| 国际化支持 | 文案支持中英文 |

---

## 4. 国际化规范

### 4.1 语言支持

| 语言 | 代码 | 默认 |
|------|------|------|
| 英文 | `en` | ✅ |
| 中文 | `zh` | - |

### 4.2 国际化实现规范

#### 前端实现

1. **使用i18n库**
```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') },
      zh: { translation: require('./locales/zh.json') },
    },
    lng: 'en', // 默认英文
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

2. **文案使用规范**
```tsx
// ✅ 正确：使用翻译函数
<h1>{t('dashboard.welcome')}</h1>
<button>{t('common.submit')}</button>

// ❌ 错误：硬编码文案
<h1>欢迎回来</h1>
<button>提交</button>
```

3. **语言切换组件**
```tsx
// components/LanguageSwitcher.tsx
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
  };
  
  return (
    <button onClick={toggleLanguage}>
      {i18n.language === 'en' ? '中文' : 'English'}
    </button>
  );
};
```

#### 后端实现

1. **API响应国际化**
```typescript
// 返回消息码，前端根据语言显示对应文案
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials" // 默认英文
  }
}
```

### 4.3 文案管理

#### 文案文件结构
```
src/i18n/locales/
├── en.json          # 英文文案
│   ├── common/      # 公共文案
│   ├── auth/        # 认证相关
│   ├── dashboard/   # 工作台
│   ├── jobs/        # 职位/项目
│   ├── worklog/     # 工时
│   ├── invoice/     # 发票
│   ├── payment/     # 付款
│   └── admin/       # 管理后台
└── zh.json          # 中文文案
    └── ...（同上结构）
```

#### 文案命名规范
```json
{
  "模块.功能.动作": "文案内容",
  "common.button.submit": "Submit",
  "auth.login.title": "Sign In",
  "jobs.list.empty": "No jobs available"
}
```

---

## 5. 测试规范

### 5.1 测试类型

| 类型 | 描述 | 文件位置 |
|------|------|----------|
| E2E测试 | 端到端业务流程测试 | `e2e-*.spec.ts` |
| 单元测试 | 函数/组件单元测试 | `**/*.test.ts` |
| API测试 | 后端接口测试 | `**/*.api.test.ts` |

### 5.2 测试执行时机

| 时机 | 测试范围 |
|------|----------|
| 任务完成后 | 该任务相关的E2E测试 |
| 每日构建 | 全量E2E测试 |
| 发布前 | 全量测试 + 性能测试 |

### 5.3 测试问题处理流程

```
发现测试问题
    │
    ▼
创建新任务（标记来源：测试发现）
    │
    ▼
设置优先级（P0/P1/P2）
    │
    ▼
添加到待办任务清单
    │
    ▼
按优先级处理
```

### 5.4 测试问题任务模板

```markdown
### BUG-XXX: 问题简述

**优先级:** P0/P1/P2  
**状态:** pending  
**来源:** E2E测试/手动测试/用户反馈  
**发现时间:** YYYY-MM-DD  
**测试用例:** TEST-XXX

#### 问题描述
详细描述问题现象。

#### 复现步骤
1. 步骤1
2. 步骤2
3. 步骤3

#### 预期行为
描述正确的行为应该是什么。

#### 实际行为
描述当前错误的行为。

#### 截图/日志
附上相关截图或日志。

#### 修复方案
描述修复思路。
```

---

## 6. 开发工作流程

### 6.1 每日启动流程

```
1. 读取 docs/TASK-LIST.md
2. 查找状态为 "pending" 的任务
3. 按优先级排序（P0 > P1 > P2 > P3）
4. 选择优先级最高的任务开始执行
5. 将任务状态更新为 "in_progress"
```

### 6.2 任务执行流程

```
1. 阅读任务需求描述和PRD章节
2. 分析技术实现方案
3. 编写代码实现
4. 添加国际化支持
5. 编写/更新测试用例
6. 执行测试验证
7. 更新功能检查清单
8. 将任务状态更新为 "completed"
9. 记录完成时间
```

### 6.3 任务阻塞处理

```
1. 将任务状态更新为 "blocked"
2. 记录阻塞原因
3. 创建新任务解决阻塞问题
4. 阻塞解决后恢复 "in_progress"
```

---

## 7. 文档更新规范

### 7.1 任务完成后更新

| 文档 | 更新内容 |
|------|----------|
| TASK-LIST.md | 更新任务状态、完成时间 |
| PRD-Feature-Checklist.md | 更新功能实现状态 |
| E2E-Test-Documentation.md | 添加新测试用例（如有） |
| TASK-HISTORY.md | 记录任务完成历史 |

### 7.2 版本发布后更新

| 文档 | 更新内容 |
|------|----------|
| PRD-Freelancer-Platform.md | 更新版本号、新增功能 |
| README.md | 更新功能列表 |

---

## 9. 统一错误码规范

### 9.1 错误码格式

```
[模块]_[类型]_[序号]
```

| 组成部分 | 说明 | 示例 |
|----------|------|------|
| 模块 | 功能模块缩写 | AUTH, USER, JOB, WORKLOG, INVOICE, PAYMENT, ADMIN |
| 类型 | 错误类型 | ERR(错误), WARN(警告), INFO(提示) |
| 序号 | 三位数字序号 | 001, 002, 003 |

### 9.2 模块代码定义

| 模块代码 | 模块名称 | 说明 |
|----------|----------|------|
| AUTH | 认证模块 | 登录、注册、密码找回 |
| USER | 用户模块 | 用户信息、角色管理 |
| COMP | 企业模块 | 企业信息、认证 |
| JOB | 项目模块 | 项目发布、申请 |
| WORK | 工时模块 | 工时填报、审核 |
| INV | 发票模块 | 发票创建、审核 |
| PAY | 付款模块 | 付款确认、收款 |
| RATE | 评价模块 | 评价提交、查看 |
| RPT | 举报模块 | 举报提交、处理 |
| ADMIN | 管理模块 | 系统管理、配置 |
| SYS | 系统模块 | 系统级错误 |

### 9.3 错误码列表

#### AUTH 认证模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| AUTH_ERR_001 | Invalid credentials | 账号或密码错误 | 401 |
| AUTH_ERR_002 | Account not found | 账号不存在 | 404 |
| AUTH_ERR_003 | Account already exists | 账号已存在 | 409 |
| AUTH_ERR_004 | Email format invalid | 邮箱格式无效 | 400 |
| AUTH_ERR_005 | Password too weak | 密码强度不足 | 400 |
| AUTH_ERR_006 | Account not activated | 账号未激活 | 403 |
| AUTH_ERR_007 | Account has been banned | 账号已被封禁 | 403 |
| AUTH_ERR_008 | Token expired | 登录已过期 | 401 |
| AUTH_ERR_009 | Invalid verification code | 验证码错误 | 400 |
| AUTH_ERR_010 | Too many login attempts | 登录尝试次数过多 | 429 |

#### USER 用户模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| USER_ERR_001 | User not found | 用户不存在 | 404 |
| USER_ERR_002 | Profile incomplete | 档案不完整 | 400 |
| USER_ERR_003 | Role not authorized | 无此角色权限 | 403 |
| USER_ERR_004 | Role switch failed | 角色切换失败 | 400 |
| USER_ERR_005 | Avatar upload failed | 头像上传失败 | 500 |

#### COMP 企业模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| COMP_ERR_001 | Company not found | 企业不存在 | 404 |
| COMP_ERR_002 | Company name already exists | 企业名称已存在 | 409 |
| COMP_ERR_003 | Company not certified | 企业未认证 | 403 |
| COMP_ERR_004 | License upload failed | 营业执照上传失败 | 500 |
| COMP_ERR_005 | License format invalid | 营业执照格式无效 | 400 |
| COMP_ERR_006 | Certification pending | 认证审核中 | 202 |
| COMP_ERR_007 | Certification rejected | 认证已驳回 | 403 |

#### JOB 项目模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| JOB_ERR_001 | Job not found | 项目不存在 | 404 |
| JOB_ERR_002 | Job already applied | 已申请过该项目 | 409 |
| JOB_ERR_003 | Job not accepting applications | 项目不接受申请 | 400 |
| JOB_ERR_004 | Application deadline passed | 申请截止日期已过 | 400 |
| JOB_ERR_005 | Job status invalid | 项目状态无效 | 400 |
| JOB_ERR_006 | Application not found | 申请不存在 | 404 |
| JOB_ERR_007 | Application already processed | 申请已处理 | 400 |
| JOB_ERR_008 | Cannot accept multiple applications | 一个项目只能接受一个申请 | 400 |

#### WORK 工时模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| WORK_ERR_001 | Work log not found | 工时记录不存在 | 404 |
| WORK_ERR_002 | Cannot edit submitted work log | 已提交工时不可编辑 | 400 |
| WORK_ERR_003 | Cannot edit confirmed work log | 已确认工时不可编辑 | 400 |
| WORK_ERR_004 | Work date cannot be in future | 工时日期不能是未来日期 | 400 |
| WORK_ERR_005 | Hours must be between 0 and 24 | 工时必须在0-24之间 | 400 |
| WORK_ERR_006 | Project not in progress | 项目不在进行中 | 400 |
| WORK_ERR_007 | Work log already invoiced | 工时已开票 | 400 |
| WORK_ERR_008 | Duplicate work log for same date | 同一日期已存在工时记录 | 409 |

#### INV 发票模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| INV_ERR_001 | Invoice not found | 发票不存在 | 404 |
| INV_ERR_002 | Cannot edit submitted invoice | 已提交发票不可编辑 | 400 |
| INV_ERR_003 | Cannot edit approved invoice | 已审核发票不可编辑 | 400 |
| INV_ERR_004 | Work logs not confirmed | 工时未确认 | 400 |
| INV_ERR_005 | Work logs already invoiced | 工时已开票 | 400 |
| INV_ERR_006 | Invoice amount invalid | 发票金额无效 | 400 |
| INV_ERR_007 | Tax calculation error | 税额计算错误 | 400 |

#### PAY 付款模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| PAY_ERR_001 | Payment not found | 付款记录不存在 | 404 |
| PAY_ERR_002 | Invoice not approved | 发票未审核通过 | 400 |
| PAY_ERR_003 | Payment already processed | 付款已处理 | 400 |
| PAY_ERR_004 | Voucher upload failed | 付款凭证上传失败 | 500 |
| PAY_ERR_005 | Payment amount mismatch | 付款金额不匹配 | 400 |

#### RATE 评价模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| RATE_ERR_001 | Rating not found | 评价不存在 | 404 |
| RATE_ERR_002 | Already rated | 已评价过 | 409 |
| RATE_ERR_003 | Cannot rate yourself | 不能评价自己 | 400 |
| RATE_ERR_004 | Project not completed | 项目未完成 | 400 |
| RATE_ERR_005 | Rating score invalid | 评分无效（1-5） | 400 |

#### RPT 举报模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| RPT_ERR_001 | Report not found | 举报不存在 | 404 |
| RPT_ERR_002 | Already reported | 已举报过 | 409 |
| RPT_ERR_003 | Cannot report yourself | 不能举报自己 | 400 |
| RPT_ERR_004 | Report already processed | 举报已处理 | 400 |
| RPT_ERR_005 | Invalid report type | 无效的举报类型 | 400 |

#### ADMIN 管理模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| ADMIN_ERR_001 | Admin access required | 需要管理员权限 | 403 |
| ADMIN_ERR_002 | Operation not allowed | 操作不允许 | 403 |
| ADMIN_ERR_003 | Configuration not found | 配置不存在 | 404 |
| ADMIN_ERR_004 | Invalid configuration value | 配置值无效 | 400 |

#### SYS 系统模块

| 错误码 | 英文描述 | 中文描述 | HTTP状态码 |
|--------|----------|----------|------------|
| SYS_ERR_001 | Internal server error | 服务器内部错误 | 500 |
| SYS_ERR_002 | Service unavailable | 服务不可用 | 503 |
| SYS_ERR_003 | Request timeout | 请求超时 | 408 |
| SYS_ERR_004 | Rate limit exceeded | 请求频率超限 | 429 |
| SYS_ERR_005 | File upload failed | 文件上传失败 | 500 |
| SYS_ERR_006 | File size exceeded | 文件大小超限 | 400 |
| SYS_ERR_007 | Invalid file format | 文件格式无效 | 400 |

### 9.4 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // 错误码
    message: string;     // 英文描述
    messageZh: string;   // 中文描述
    details?: any;       // 详细信息（可选）
    timestamp: string;   // 时间戳
    path: string;        // 请求路径
  };
}
```

### 9.5 示例响应

```json
{
  "success": false,
  "error": {
    "code": "AUTH_ERR_001",
    "message": "Invalid credentials",
    "messageZh": "账号或密码错误",
    "timestamp": "2026-03-24T10:30:00Z",
    "path": "/api/auth/login"
  }
}
```

### 9.6 前端错误处理

```typescript
// utils/errorHandler.ts
import { useTranslation } from 'react-i18next';

const errorMessages = {
  AUTH_ERR_001: {
    en: 'Invalid credentials',
    zh: '账号或密码错误'
  },
  // ... 其他错误码
};

export function getErrorMessage(code: string, language: 'en' | 'zh'): string {
  return errorMessages[code]?.[language] || 'An error occurred';
}

// 使用示例
const { i18n } = useTranslation();
const errorMessage = getErrorMessage(error.code, i18n.language as 'en' | 'zh');
```

---

## 10. 代码规范

### 8.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `UserProfile.tsx` |
| 页面文件 | PascalCase + Page | `DashboardPage.tsx` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| CSS类名 | kebab-case | `user-profile-card` |
| data-testid | kebab-case | `data-testid="submit-btn"` |

### 8.2 注释规范

```typescript
/**
 * 函数描述
 * @param paramName 参数描述
 * @returns 返回值描述
 */
function functionName(paramName: Type): ReturnType {
  // 实现
}
```

### 8.3 国际化注释

```typescript
// i18n: dashboard.welcome
const welcomeText = t('dashboard.welcome');
```

---

## 9. Git提交规范

### 9.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 9.2 Type类型

| Type | 描述 |
|------|------|
| feat | 新功能 |
| fix | Bug修复 |
| docs | 文档更新 |
| style | 代码格式调整 |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具相关 |
| i18n | 国际化相关 |

### 9.3 示例

```
feat(auth): add company registration flow

- Add company setup page
- Add company info form validation
- Add business license upload
- Add admin company review page

Closes #TASK-001
```

---

## 11. 消息通知规范

### 11.1 通知类型定义

| 类型 | 代码 | 描述 | 优先级 |
|------|------|------|--------|
| 系统 | `system` | 系统公告、安全提醒 | 高 |
| 业务 | `business` | 申请状态、审核结果 | 中 |
| 财务 | `finance` | 发票、付款通知 | 高 |
| 提醒 | `reminder` | 待办事项、截止日期 | 低 |
| 营销 | `marketing` | 活动推广、新功能 | 最低 |

### 11.2 通知场景定义

#### 系统通知

| 场景代码 | 场景名称 | 触发条件 | 接收者 |
|----------|----------|----------|--------|
| SYS_001 | 账号安全提醒 | 异地登录 | 用户本人 |
| SYS_002 | 密码修改成功 | 密码修改 | 用户本人 |
| SYS_003 | 系统维护通知 | 计划维护 | 全部用户 |
| SYS_004 | 账号被封禁 | 违规处理 | 用户本人 |

#### 业务通知

| 场景代码 | 场景名称 | 触发条件 | 接收者 |
|----------|----------|----------|--------|
| BIZ_001 | 项目申请通知 | 顾问申请项目 | HR |
| BIZ_002 | 申请通过通知 | HR批准申请 | 顾问 |
| BIZ_003 | 申请拒绝通知 | HR拒绝申请 | 顾问 |
| BIZ_004 | 工时提交通知 | 顾问提交工时 | HR |
| BIZ_005 | 工时确认通知 | HR确认工时 | 顾问 |
| BIZ_006 | 工时驳回通知 | HR驳回工时 | 顾问 |
| BIZ_007 | 发票提交通知 | 顾问提交发票 | HR |
| BIZ_008 | 发票审核通知 | HR审核发票 | 顾问 |
| BIZ_009 | 评价通知 | 收到评价 | 被评价者 |
| BIZ_010 | 举报处理通知 | 举报处理完成 | 举报者 |

#### 财务通知

| 场景代码 | 场景名称 | 触发条件 | 接收者 |
|----------|----------|----------|--------|
| FIN_001 | 发票待付款 | 发票审核通过 | HR |
| FIN_002 | 付款成功通知 | HR确认付款 | 顾问 |
| FIN_003 | 收款确认通知 | 顾问确认收款 | HR |
| FIN_004 | 发票逾期提醒 | 发票超期未付 | HR、顾问 |

#### 提醒通知

| 场景代码 | 场景名称 | 触发条件 | 接收者 |
|----------|----------|----------|--------|
| REM_001 | 项目截止提醒 | 项目即将到期 | HR、顾问 |
| REM_002 | 工时填报提醒 | 未填报工时 | 顾问 |
| REM_003 | 待审核提醒 | 有待审核项 | HR |
| REM_004 | 档案完善提醒 | 档案完整度低 | 顾问 |

### 11.3 通知数据结构

```typescript
interface Notification {
  _id: string;
  user_id: string;           // 接收者ID
  type: 'system' | 'business' | 'finance' | 'reminder' | 'marketing';
  scene_code: string;        // 场景代码
  title: string;             // 通知标题
  title_en: string;          // 通知标题（英文）
  content: string;           // 通知内容
  content_en: string;        // 通知内容（英文）
  link?: string;             // 跳转链接
  metadata?: {               // 元数据
    related_id?: string;     // 相关业务ID
    related_type?: string;   // 相关业务类型
    [key: string]: any;
  };
  read: boolean;             // 是否已读
  read_at?: Date;            // 阅读时间
  created_at: Date;
}
```

### 11.4 通知发送方式

| 方式 | 适用场景 | 配置项 |
|------|----------|--------|
| 站内信 | 所有通知 | 默认开启 |
| 邮件 | 重要通知 | 用户可配置 |
| 短信 | 安全相关 | 默认开启 |
| 微信 | 可选 | 用户绑定后可用 |

### 11.5 通知文案模板

```json
{
  "BIZ_001": {
    "zh": {
      "title": "收到新的项目申请",
      "content": "顾问 {freelancer_name} 申请了您的项目「{project_name}」，请及时处理。"
    },
    "en": {
      "title": "New Project Application",
      "content": "Consultant {freelancer_name} has applied for your project \"{project_name}\". Please review it."
    }
  }
}
```

---

## 12. API接口规范

### 12.1 接口命名规范

```
/api/{version}/{module}/{resource}/{action}
```

| 组成部分 | 说明 | 示例 |
|----------|------|------|
| version | API版本 | v1 |
| module | 功能模块 | auth, jobs, worklogs |
| resource | 资源名称 | users, invoices |
| action | 操作动作 | login, approve, reject |

### 12.2 HTTP方法规范

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 查询资源 | GET /api/v1/jobs |
| POST | 创建资源 | POST /api/v1/jobs |
| PUT | 完整更新 | PUT /api/v1/jobs/:id |
| PATCH | 部分更新 | PATCH /api/v1/jobs/:id/status |
| DELETE | 删除资源 | DELETE /api/v1/jobs/:id |

### 12.3 请求头规范

```
Content-Type: application/json
Authorization: Bearer {token}
Accept-Language: en/zh
X-Request-ID: {uuid}
```

### 12.4 响应格式规范

#### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "Operation successful",
  "messageZh": "操作成功"
}
```

#### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "AUTH_ERR_001",
    "message": "Invalid credentials",
    "messageZh": "账号或密码错误"
  }
}
```

### 12.5 接口版本管理

| 版本 | 状态 | 说明 |
|------|------|------|
| v1 | 当前版本 | 正常维护 |
| v2 | 计划中 | 新功能开发 |

---

## 13. 数据库规范

### 13.1 集合命名规范

| 规则 | 示例 |
|------|------|
| 使用小写字母 | `user_account` |
| 多个单词用下划线连接 | `work_log` |
| 不使用复数形式 | `company` 而非 `companies` |

### 13.2 字段命名规范

| 规则 | 示例 |
|------|------|
| 使用小驼峰命名 | `firstName`, `createdAt` |
| 布尔字段以 `is`/`has` 开头 | `isActive`, `hasPermission` |
| 时间字段以 `_at` 结尾 | `created_at`, `updated_at` |
| ID字段以 `_id` 结尾 | `user_id`, `company_id` |

### 13.3 必备字段

每个集合必须包含以下字段：

```typescript
{
  _id: ObjectId,           // 主键
  created_at: Date,        // 创建时间
  updated_at: Date,        // 更新时间
  created_by?: ObjectId,   // 创建人
  updated_by?: ObjectId,   // 更新人
  is_deleted?: Boolean,    // 软删除标记
  deleted_at?: Date        // 删除时间
}
```

### 13.4 索引规范

| 索引类型 | 使用场景 | 示例 |
|----------|----------|------|
| 单字段索引 | 频繁查询的字段 | `{ email: 1 }` |
| 复合索引 | 多字段组合查询 | `{ user_id: 1, status: 1 }` |
| 文本索引 | 全文搜索 | `{ description: "text" }` |
| 唯一索引 | 唯一性约束 | `{ email: 1 }` (unique) |

---

## 14. 安全规范

### 14.1 认证授权

| 项目 | 规范 |
|------|------|
| 认证方式 | JWT Token |
| Token有效期 | 60天 |
| Token存储 | HttpOnly Cookie + LocalStorage |
| 刷新机制 | Refresh Token |

### 14.2 密码安全

| 项目 | 规范 |
|------|------|
| 加密算法 | BCrypt |
| 加密强度 | 10轮 |
| 最小长度 | 8位 |
| 复杂度要求 | 必须包含大小写字母和数字 |

### 14.3 数据安全

| 项目 | 规范 |
|------|------|
| 传输加密 | HTTPS/TLS 1.3 |
| 敏感数据加密 | AES-256 |
| 敏感数据脱敏 | 手机号/身份证中间隐藏 |
| 日志脱敏 | 不记录密码/Token |

### 14.4 接口安全

| 项目 | 规范 |
|------|------|
| 请求频率限制 | 100次/分钟 |
| SQL注入防护 | 参数化查询 |
| XSS防护 | 输入输出转义 |
| CSRF防护 | Token验证 |

---

## 15. 性能规范

### 15.1 前端性能

| 指标 | 目标值 |
|------|--------|
| 首屏加载时间 | < 3秒 |
| 白屏时间 | < 1秒 |
| 可交互时间 | < 3秒 |
| 页面大小 | < 2MB |
| 接口响应时间 | < 500ms |

### 15.2 后端性能

| 指标 | 目标值 |
|------|--------|
| 接口响应时间 | < 200ms |
| 数据库查询时间 | < 100ms |
| 并发处理能力 | > 1000 QPS |
| 内存使用率 | < 80% |
| CPU使用率 | < 70% |

### 15.3 数据库性能

| 指标 | 目标值 |
|------|--------|
| 查询响应时间 | < 50ms |
| 索引命中率 | > 95% |
| 连接池使用率 | < 80% |

---

## 16. 日志规范

### 16.1 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| ERROR | 错误日志 | 接口异常、数据库错误 |
| WARN | 警告日志 | 性能警告、业务异常 |
| INFO | 信息日志 | 接口调用、业务流程 |
| DEBUG | 调试日志 | 开发调试信息 |

### 16.2 日志格式

```json
{
  "timestamp": "2026-03-24T10:30:00.000Z",
  "level": "INFO",
  "service": "job-portal-api",
  "traceId": "abc-123-def",
  "userId": "user_001",
  "action": "API_CALL",
  "method": "POST",
  "path": "/api/v1/jobs",
  "statusCode": 201,
  "duration": 150,
  "message": "Job created successfully"
}
```

### 16.3 日志存储

| 日志类型 | 存储方式 | 保留期限 |
|----------|----------|----------|
| 应用日志 | 文件 + ELK | 30天 |
| 访问日志 | 文件 | 7天 |
| 审计日志 | 数据库 | 365天 |
| 错误日志 | 文件 + 告警 | 90天 |

---

## 17. 文件上传规范

### 17.1 文件类型限制

| 用途 | 允许类型 | 最大大小 |
|------|----------|----------|
| 头像 | jpg, png, gif | 2MB |
| 营业执照 | jpg, png, pdf | 10MB |
| 付款凭证 | jpg, png, pdf | 10MB |
| 附件 | jpg, png, pdf, doc, docx, xls, xlsx | 20MB |

### 17.2 文件命名规范

```
{module}/{type}/{year}/{month}/{uuid}.{ext}
```

示例：`company/license/2026/03/abc-123-def.pdf`

### 17.3 存储方式

| 环境 | 存储方式 |
|------|----------|
| 开发环境 | 本地文件系统 |
| 生产环境 | 云存储（OSS/S3） |

---

## 18. 缓存规范

### 18.1 缓存策略

| 数据类型 | 缓存方式 | 过期时间 | 更新策略 |
|----------|----------|----------|----------|
| 用户信息 | Redis | 30分钟 | 写时更新 |
| 项目列表 | Redis | 5分钟 | 定时刷新 |
| 技能分类 | Redis | 24小时 | 写时更新 |
| 匹配度计算 | Redis | 1小时 | 定时刷新 |
| 配置数据 | Redis | 1天 | 写时更新 |

### 18.2 缓存键命名规范

```
{module}:{resource}:{id}:{field}
```

| 示例 | 说明 |
|------|------|
| `user:profile:123` | 用户档案缓存 |
| `job:list:page:1` | 项目列表第一页 |
| `match:score:123:456` | 用户123与项目456的匹配度 |
| `config:skills` | 技能配置缓存 |

### 18.3 缓存使用规范

```typescript
// ✅ 正确：先查缓存，再查数据库
async function getUserProfile(userId: string) {
  const cacheKey = `user:profile:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const profile = await UserModel.findById(userId);
  await redis.setex(cacheKey, 1800, JSON.stringify(profile));
  return profile;
}

// ✅ 正确：更新时清除缓存
async function updateUserProfile(userId: string, data: any) {
  await UserModel.findByIdAndUpdate(userId, data);
  await redis.del(`user:profile:${userId}`);
}
```

---

## 19. 并发控制规范

### 19.1 乐观锁

适用于读多写少的场景：

```typescript
// 使用版本号实现乐观锁
interface IDocument {
  _id: string;
  version: number;
  // ...其他字段
}

// 更新时检查版本
async function updateWithOptimisticLock(id: string, data: any, version: number) {
  const result = await Model.findOneAndUpdate(
    { _id: id, version: version },
    { ...data, $inc: { version: 1 } },
    { new: true }
  );
  
  if (!result) {
    throw new Error('CONFLICT_ERR_001'); // 数据已被修改
  }
  
  return result;
}
```

### 19.2 悲观锁

适用于写多的场景：

```typescript
// 使用Redis分布式锁
async function withLock(key: string, ttl: number, fn: () => Promise<any>) {
  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', ttl);
  
  if (!acquired) {
    throw new Error('LOCK_ERR_001'); // 获取锁失败
  }
  
  try {
    return await fn();
  } finally {
    await redis.del(lockKey);
  }
}
```

### 19.3 并发场景处理

| 场景 | 控制方式 | 说明 |
|------|----------|------|
| 项目申请 | 乐观锁 | 防止重复申请 |
| 工时提交 | 分布式锁 | 防止并发提交 |
| 发票创建 | 分布式锁 | 防止重复创建 |
| 付款确认 | 乐观锁 | 防止重复付款 |

---

## 20. 数据迁移规范

### 20.1 迁移文件命名

```
{timestamp}_{description}.ts
```

示例：`20260324120000_add_user_avatar_field.ts`

### 20.2 迁移文件结构

```typescript
// migrations/20260324120000_add_user_avatar_field.ts
import { Migration } from '../migration-runner';

export const up: Migration = async (db) => {
  await db.collection('users').updateMany(
    {},
    { $set: { avatar: '' } }
  );
};

export const down: Migration = async (db) => {
  await db.collection('users').updateMany(
    {},
    { $unset: { avatar: '' } }
  );
};
```

### 20.3 迁移执行流程

```
1. 备份数据库
2. 执行迁移脚本
3. 验证迁移结果
4. 记录迁移日志
5. 如失败，执行回滚
```

### 20.4 迁移注意事项

- 迁移脚本必须支持回滚
- 大数据量迁移需分批执行
- 迁移前必须备份数据
- 迁移过程记录详细日志

---

## 21. 版本发布规范

### 21.1 版本号规范

```
MAJOR.MINOR.PATCH
```

| 类型 | 说明 | 示例 |
|------|------|------|
| MAJOR | 不兼容的API变更 | 1.0.0 → 2.0.0 |
| MINOR | 向后兼容的功能新增 | 1.0.0 → 1.1.0 |
| PATCH | 向后兼容的问题修复 | 1.0.0 → 1.0.1 |

### 21.2 发布流程

```
开发环境 → 测试环境 → 预发布环境 → 生产环境
```

| 环境 | 用途 | 数据 |
|------|------|------|
| 开发环境 | 日常开发测试 | 测试数据 |
| 测试环境 | QA测试 | 测试数据 |
| 预发布环境 | 最终验证 | 生产数据副本 |
| 生产环境 | 正式运行 | 生产数据 |

### 21.3 发布检查清单

- [ ] 所有测试用例通过
- [ ] 代码审查完成
- [ ] 数据库迁移脚本准备就绪
- [ ] 配置文件更新完成
- [ ] 回滚方案准备就绪
- [ ] 发布说明编写完成

### 21.4 发布窗口

| 时间段 | 允许发布 | 说明 |
|--------|----------|------|
| 工作日 10:00-18:00 | ✅ | 正常发布窗口 |
| 工作日其他时间 | ⚠️ | 需审批 |
| 周末/节假日 | ❌ | 禁止发布（紧急修复除外） |

---

## 22. 监控告警规范

### 22.1 监控指标

| 指标类型 | 指标名称 | 告警阈值 | 严重级别 |
|----------|----------|----------|----------|
| 应用 | 错误率 | > 1% | P1 |
| 应用 | 响应时间 | > 500ms | P2 |
| 应用 | QPS | > 1000 | P2 |
| 系统 | CPU使用率 | > 80% | P1 |
| 系统 | 内存使用率 | > 85% | P1 |
| 系统 | 磁盘使用率 | > 90% | P0 |
| 数据库 | 连接数 | > 80% | P1 |
| 数据库 | 慢查询 | > 100ms | P2 |

### 22.2 告警通知渠道

| 严重级别 | 通知渠道 | 响应时间 |
|----------|----------|----------|
| P0 | 电话 + 短信 + 邮件 | 5分钟 |
| P1 | 短信 + 邮件 | 15分钟 |
| P2 | 邮件 | 1小时 |
| P3 | 系统通知 | 4小时 |

### 22.3 告警处理流程

```
告警触发
    │
    ▼
确认告警
    │
    ▼
分析原因
    │
    ├─ 可立即修复 ──▶ 修复问题 ──▶ 验证恢复 ──▶ 关闭告警
    │
    └─ 需要时间修复 ──▶ 临时缓解措施 ──▶ 创建修复任务 ──▶ 跟踪处理
```

---

## 23. 灾备恢复规范

### 23.1 备份策略

| 数据类型 | 备份频率 | 保留期限 | 存储位置 |
|----------|----------|----------|----------|
| 数据库 | 每日全量 + 每小时增量 | 30天 | 异地存储 |
| 文件存储 | 每日增量 | 90天 | 异地存储 |
| 配置文件 | 每次变更 | 永久 | Git仓库 |
| 日志文件 | 实时同步 | 30天 | 日志服务 |

### 23.2 恢复时间目标

| 场景 | RTO (恢复时间目标) | RPO (恢复点目标) |
|------|-------------------|-----------------|
| 单点故障 | 15分钟 | 0 |
| 机房故障 | 1小时 | 1小时 |
| 区域故障 | 4小时 | 1小时 |

### 23.3 灾备演练

| 演练类型 | 频率 | 参与人员 |
|----------|------|----------|
| 数据库恢复 | 每月 | DBA + 运维 |
| 应用切换 | 每季度 | 开发 + 运维 |
| 全量灾备 | 每半年 | 全员 |

---

## 24. 代码审查规范

### 24.1 审查范围

| 文件类型 | 必须审查 | 审查重点 |
|----------|----------|----------|
| 业务代码 | ✅ | 逻辑正确性、性能、安全 |
| 配置文件 | ✅ | 配置正确性、敏感信息 |
| 数据库迁移 | ✅ | 迁移逻辑、回滚方案 |
| 测试代码 | ⚠️ | 测试覆盖、用例有效性 |
| 文档 | ⚠️ | 内容准确性 |

### 24.2 审查检查项

**代码质量：**
- [ ] 代码符合编码规范
- [ ] 命名清晰易懂
- [ ] 注释充分必要
- [ ] 无重复代码

**功能正确性：**
- [ ] 实现符合需求
- [ ] 边界条件处理
- [ ] 异常情况处理
- [ ] 并发安全

**性能：**
- [ ] 无明显性能问题
- [ ] 数据库查询优化
- [ ] 缓存使用合理

**安全：**
- [ ] 输入验证
- [ ] 权限检查
- [ ] 敏感数据处理

### 24.3 审查流程

```
提交代码
    │
    ▼
自动检查（CI）
    │
    ├─ 通过 ──▶ 分配审查人
    │                │
    │                ▼
    │              代码审查
    │                │
    │                ├─ 通过 ──▶ 合并代码
    │                │
    │                └─ 需修改 ──▶ 修改后重新审查
    │
    └─ 不通过 ──▶ 修复问题后重新提交
```

---

## 25. 测试数据管理规范

### 25.1 测试数据类型

| 类型 | 说明 | 管理方式 |
|------|------|----------|
| 种子数据 | 基础配置数据 | Git版本控制 |
| 测试用户 | 功能测试账号 | 脚本生成 |
| 业务数据 | 测试业务数据 | 自动生成/清理 |

### 25.2 测试数据生成

```typescript
// 测试数据生成脚本
async function seedTestData() {
  // 1. 创建测试用户
  const admin = await createTestUser('admin@test.com', 'admin');
  const hr = await createTestUser('hr@test.com', 'hr');
  const freelancer = await createTestUser('freelancer@test.com', 'freelancer');
  
  // 2. 创建测试公司
  const company = await createTestCompany(hr._id);
  
  // 3. 创建测试项目
  const job = await createTestJob(hr._id, company._id);
  
  // 4. 创建测试工时
  const workLog = await createTestWorkLog(freelancer._id, job._id);
  
  return { admin, hr, freelancer, company, job, workLog };
}
```

### 25.3 测试数据清理

```typescript
// 测试数据清理脚本
async function cleanTestData() {
  // 清理顺序：先清理关联数据，再清理主数据
  
  // 1. 清理业务数据
  await WorkLogModel.deleteMany({ is_test: true });
  await InvoiceModel.deleteMany({ is_test: true });
  await ApplicationModel.deleteMany({ is_test: true });
  await JobModel.deleteMany({ is_test: true });
  
  // 2. 清理测试用户
  await UserModel.deleteMany({ is_test: true });
  
  // 3. 清理测试公司
  await CompanyModel.deleteMany({ is_test: true });
}
```

### 25.4 测试数据隔离

| 环境 | 数据来源 | 隔离方式 |
|------|----------|----------|
| 开发环境 | 本地生成 | 数据库隔离 |
| 测试环境 | 脚本生成 | 数据库隔离 |
| 预发布环境 | 生产副本 | 数据脱敏 |
| 生产环境 | 真实数据 | 无测试数据 |

---

## 26. 附录

### 26.1 相关文档

| 文档 | 路径 |
|------|------|
| PRD文档 | `docs/PRD-Freelancer-Platform.md` |
| 待办任务清单 | `docs/TASK-LIST.md` |
| 任务历史记录 | `docs/TASK-HISTORY.md` |
| 功能检查清单 | `docs/PRD-Feature-Checklist.md` |
| 测试文档 | `docs/E2E-Test-Documentation.md` |

### 26.2 常用命令

```bash
# 构建项目
npm run build

# 代码检查
npm run lint

# 运行E2E测试
npx playwright test e2e-comprehensive-test.spec.ts

# 运行特定测试
npx playwright test -g "AUTH"

# 查看测试报告
npx playwright show-report

# 数据库迁移
npm run migrate:up
npm run migrate:down

# 生成测试数据
npm run seed:test

# 清理测试数据
npm run clean:test
```

### 26.3 联系方式

| 角色 | 职责 | 联系方式 |
|------|------|----------|
| 项目负责人 | 项目整体管理 | - |
| 技术负责人 | 技术决策 | - |
| 测试负责人 | 质量保障 | - |

---

**文档版本:** v2.0  
**更新日期:** 2026-03-24  
**维护者:** AI Assistant
