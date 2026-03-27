# 系统阻塞性问题分析与解决方案

**创建时间**: 2026-03-24
**状态**: 进行中

---

## 一、问题概述

### 1.1 E2E测试结果

| 指标 | 数值 |
|------|------|
| 验证步骤 | 20 |
| 通过 | 9 |
| 失败 | 11 |
| 通过率 | 45.0% |

### 1.2 核心问题分类

| 类别 | 问题数量 | 严重程度 |
|------|----------|----------|
| 登录/Token校验问题 | 10 | 中等 |
| 数据流转问题 | 6 | 严重 |
| ID类型混淆 | 4 | 严重 |
| 模型混用 | 2 | 严重 |

---

## 二、根本原因分析

### 2.1 ID类型混淆问题（最严重）

**问题描述**: 系统中存在多种ID类型混用：

| ID类型 | 所属模型 | 常见错误 |
|--------|----------|----------|
| UserAccount._id | 用户账户 | 被错误用于查询 FreelancerProfile |
| FreelancerProfile._id | 顾问档案 | 被错误用于查询 UserAccount |
| Company._id | 公司 | 被错误用于查询 UserAccount |
| JobPost._id | 项目(JobPost) | 被错误用于查询 ProjectRequirement |
| ProjectRequirement._id | 项目需求 | 被错误用于查询 JobPost |

**影响范围**:
- 工时查询失败
- 项目查询失败
- HR无法查看顾问数据

### 2.2 两套项目模型并存

**问题**: 系统同时使用 JobPost 和 ProjectRequirement 两个模型：

| 模型 | 用途 | 状态枚举 |
|------|------|----------|
| JobPost | 项目发布 | draft, published, in_progress, closed, expired |
| ProjectRequirement | 项目需求 | 草稿, 发布, 进行中, 已关闭, 已到期 |

**影响**:
- 数据流转混乱
- 查询条件不一致
- 状态筛选失败

### 2.3 用户-公司关联缺失

**问题**: UserAccount 模型缺少 company_id 字段，导致：
- HR无法关联到公司
- 无法查询公司下的项目
- 无法查看公司员工的数据

---

## 三、详细解决方案

### 3.1 修复ID类型混淆（优先级: P0）

#### 3.1.1 修复工时查询

**文件**: `server/src/controllers/work-log.controller.ts`

```typescript
// 修复前
const query: any = { freelancer_id: user._id };

// 修复后
const profile = await FreelancerProfile.findOne({ user_id: user._id });
if (!profile) {
  return res.status(StatusCodes.OK).json({ work_logs: [], pagination: {...} });
}
const query: any = { freelancer_id: profile._id };
```

#### 3.1.2 修复项目查询

**文件**: `server/src/controllers/jobs.controller.ts`

```typescript
// 修复前
{ assigned_freelancers: user._id }

// 修复后
const profile = await FreelancerProfile.findOne({ user_id: user._id });
{ assigned_freelancers: profile._id }
```

### 3.2 添加用户-公司关联（优先级: P0）

#### 3.2.1 修改UserAccount模型

**文件**: `server/src/models/user/user-account.model.ts`

```typescript
company_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Company",
  required: false,
}
```

#### 3.2.2 修复HR工时查询

**文件**: `server/src/controllers/work-log.controller.ts`

```typescript
// 修复后
public static async getHRWorkLogs(req: IAuthRequest, res: Response, next: NextFunction) {
  const user = req.user as any;
  
  const userAccount = await UserAccount.findById(user._id);
  if (!userAccount?.company_id) {
    return res.status(StatusCodes.OK).json({ work_logs: [], pagination: {...} });
  }
  
  const projectRequirements = await ProjectRequirement.find({ 
    company_id: userAccount.company_id 
  }).select('_id');
  
  const query: any = { project_requirement_id: { $in: projectRequirements.map(p => p._id) } };
  // ...
}
```

### 3.3 统一项目模型使用（优先级: P1）

**决策**: 保留两个模型，但明确使用场景：
- JobPost: 用于项目发布和列表展示
- ProjectRequirement: 用于工时和发票关联

**需要修复**:
1. 创建JobPost时同步创建ProjectRequirement
2. 查询时正确使用对应的模型ID

### 3.4 修复API响应结构（优先级: P1）

**问题**: 前端 http.service.ts 已返回 response.data，但后端又包装了一层

**解决方案**: 保持后端响应格式不变，前端统一处理

```typescript
// 前端统一处理
const token = response?.data?.token || response?.token;
const user = response?.data?.user || response?.user;
```

---

## 四、修复任务清单

| 任务ID | 描述 | 优先级 | 状态 | 涉及文件 |
|--------|------|--------|------|----------|
| T001 | 修复工时查询ID类型 | P0 | 待处理 | work-log.controller.ts |
| T002 | 修复项目查询ID类型 | P0 | 待处理 | jobs.controller.ts |
| T003 | 添加用户-公司关联字段 | P0 | 待处理 | user-account.model.ts |
| T004 | 修复HR工时查询逻辑 | P0 | 待处理 | work-log.controller.ts |
| T005 | 修复项目创建流程 | P0 | 待处理 | jobs.controller.ts |
| T006 | 修复申请列表查询 | P1 | 待处理 | job-applications.controller.ts |
| T007 | 修复发票列表查询 | P1 | 待处理 | invoice.controller.ts |
| T008 | 更新测试数据seeder | P1 | 待处理 | test-data.seeder.ts |
| T009 | 运行E2E验证测试 | P1 | 待处理 | - |

---

## 五、验证标准

### 5.1 登录验证

- [ ] 所有角色可以正常登录
- [ ] Token正确存储到localStorage
- [ ] 登录后正确跳转到首页

### 5.2 数据流转验证

- [ ] HR发布项目后，项目出现在列表中
- [ ] 顾问可以看到HR发布的项目
- [ ] 顾问申请项目后，HR可以看到申请
- [ ] 顾问填报工时后，HR可以看到工时
- [ ] 顾问创建发票后，HR可以看到发票

### 5.3 E2E测试通过率

- 目标: 80%以上
- 当前: 45%

---

**维护者**: AI Assistant
**更新频率**: 每次修复后更新
