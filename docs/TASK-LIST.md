# 待办任务清单

**版本:** v1.0  
**创建日期:** 2026-03-24  
**最后更新:** 2026-03-24  
**维护者:** AI Assistant

---

## 使用说明

### 任务状态定义

| 状态 | 标识 | 描述 |
|------|------|------|
| 🔴 待处理 | `pending` | 任务已创建，等待开始 |
| 🟡 进行中 | `in_progress` | 任务正在执行 |
| 🟢 已完成 | `completed` | 任务已完成并通过验证 |
| 🔵 已阻塞 | `blocked` | 任务被阻塞，需要外部支持 |
| ⚪ 已取消 | `cancelled` | 任务已取消 |

### 任务优先级定义

| 优先级 | 标识 | 处理时限 | 描述 |
|--------|------|----------|------|
| P0 | `critical` | 立即处理 | 核心功能缺失，影响主流程 |
| P1 | `high` | 1-2周 | 重要功能优化，影响用户体验 |
| P2 | `medium` | 1个月 | 功能增强，提升产品价值 |
| P3 | `low` | 迭代处理 | 优化改进，非紧急 |

### 国际化要求

**所有界面必须支持国际化：**
- 默认语言：英文 (en)
- 支持语言：中文 (zh)
- 所有文案必须使用 i18n 翻译函数
- 禁止硬编码任何界面文案

### 任务执行流程

```
1. 选择优先级最高的待处理任务
2. 阅读任务需求描述和PRD章节
3. 实现功能（包含国际化支持）
4. 编写/更新测试用例
5. 执行测试验证
6. 更新任务状态为已完成
7. 更新 PRD-Feature-Checklist.md
```

---

## 任务统计

| 优先级 | 总数 | 已完成 | 进行中 | 待处理 | 完成率 |
|--------|------|--------|--------|--------|--------|
| P0 | 12 | 5 | 0 | 7 | 42% |
| P1 | 16 | 8 | 0 | 8 | 50% |
| P2 | 8 | 8 | 0 | 0 | 100% |
| **总计** | **36** | **21** | **0** | **15** | **58%** |

### E2E数据流转测试问题修复任务 (2026-03-24)

> **来源:** 跨角色数据流转E2E测试  
> **详细报告:** [E2E-DATA-FLOW-ISSUES.md](./E2E-DATA-FLOW-ISSUES.md)

| 问题ID | 任务名称 | 优先级 | 状态 | 关联场景 |
|--------|----------|--------|------|----------|
| ISS-P0-001 | 修复项目列表为空问题 | P0 | 🔴 待处理 | SC-001 |
| ISS-P0-002 | 修复申请列表为空问题 | P0 | 🔴 待处理 | SC-001 |
| ISS-P0-003 | 添加工时表单项目选择器 | P0 | 🔴 待处理 | SC-002 |
| ISS-P0-004 | 修复HR工时列表为空问题 | P0 | 🔴 待处理 | SC-002 |
| ISS-P1-001 | 修复技能小类加载问题 | P1 | 🔴 待处理 | SC-001 |
| ISS-P1-002 | 修复项目创建后跳转问题 | P1 | 🔴 待处理 | SC-001 |
| ISS-P1-003 | 添加工时审批按钮 | P1 | 🔴 待处理 | SC-002 |
| ISS-P1-004 | 修复HR发票列表为空问题 | P1 | 🔴 待处理 | SC-003 |
| ISS-P1-005 | 添加发票审批按钮 | P1 | 🔴 待处理 | SC-003 |
| ISS-P1-006 | 添加付款确认按钮 | P1 | 🔴 待处理 | SC-003 |
| ISS-P1-007 | 修复管理员举报列表问题 | P1 | 🔴 待处理 | SC-004 |

---

## P0 任务清单

### TASK-P0-001: 项目标题字段缺失

**状态:** 🟢 已完成  
**PRD章节:** 4.4.1 项目发布  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** PRD Review Report (PRD-001)

#### 需求描述

项目发布表单中缺少项目标题字段。根据PRD要求，项目标题是必填字段，最大200字符，用于项目列表和详情页的标题展示。

#### 任务目标

- [ ] 在项目发布表单中添加项目标题输入框
- [ ] 标题字段必填，最大长度200字符
- [ ] 标题显示在项目列表页
- [ ] 标题显示在项目详情页
- [ ] 添加国际化支持（英文/中文）

#### 验收标准

1. 项目发布页面存在项目标题输入框
2. 标题为空时无法提交表单
3. 标题超过200字符时显示错误提示
4. 项目列表正确显示项目标题
5. 项目详情页正确显示项目标题
6. E2E测试通过

#### 技术实现要点

**前端：**
- 修改 `PostJobPage.tsx`，添加标题输入框
- 添加表单验证规则
- 更新项目列表和详情页显示

**后端：**
- 确认 Job 模型包含 title 字段
- 添加标题长度验证

**国际化：**
```json
{
  "jobs.form.title": "Project Title",
  "jobs.form.titlePlaceholder": "Enter project title",
  "jobs.form.titleRequired": "Project title is required",
  "jobs.form.titleMaxLength": "Title cannot exceed 200 characters"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/PostJobPage.tsx`
- 前端: `JobPortal/client/src/pages/JobsListPage.tsx`
- 前端: `JobPortal/client/src/pages/JobDetailPage.tsx`
- 后端: `JobPortal/server/src/models/job.model.ts`
- 测试: `e2e-comprehensive-test.spec.ts`

---

### TASK-P0-002: 发票自动生成工时明细

**状态:** 🟢 已完成  
**PRD章节:** 4.6.1 发票创建  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** PRD Review Report (PRD-002)

#### 需求描述

发票创建时，应自动从已确认的工时记录中生成发票明细，包括工作日期、工作小时、工作描述、单价、金额等信息。

#### 任务目标

- [ ] 发票创建页面显示可选的已确认工时列表
- [ ] 勾选工时后自动生成发票明细
- [ ] 自动计算小计金额
- [ ] 自动计算税额和价税合计
- [ ] 添加国际化支持

#### 验收标准

1. 发票创建页面显示该顾问的所有已确认未开票工时
2. 勾选工时后自动填充发票明细
3. 金额计算正确（小计 = 工时 × 单价）
4. 税额计算正确
5. E2E测试通过

#### 技术实现要点

**前端：**
- 修改 `CreateInvoicePage.tsx`，添加工时选择列表
- 实现勾选工时自动生成明细
- 实现金额自动计算

**后端：**
- 添加获取未开票工时的API
- 发票创建时关联工时记录

**国际化：**
```json
{
  "invoice.selectWorkLogs": "Select Work Logs",
  "invoice.workLogDetails": "Work Log Details",
  "invoice.autoCalculate": "Auto Calculate"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/CreateInvoicePage.tsx`
- 后端: `JobPortal/server/src/controllers/invoice.controller.ts`
- 后端: `JobPortal/server/src/controllers/work-log.controller.ts`

---

### TASK-P0-003: 发票税务计算功能

**状态:** 🟢 已完成  
**PRD章节:** 4.6.8 税务计算  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** PRD Review Report (PRD-003)

#### 需求描述

发票需要支持税务计算功能，包括含税价和不含税价两种计算方式，自动计算税额和价税合计。

#### 任务目标

- [ ] 发票表单添加税务计算方式选择（含税/不含税）
- [ ] 发票表单添加税率输入
- [ ] 实现含税价计算：不含税金额 = 含税金额 / (1 + 税率/100)
- [ ] 实现不含税价计算：价税合计 = 不含税金额 × (1 + 税率/100)
- [ ] 自动计算并显示税额
- [ ] 添加国际化支持

#### 验收标准

1. 用户可选择含税价或不含税价计算方式
2. 输入税率后自动计算税额
3. 含税价计算结果正确
4. 不含税价计算结果正确
5. 税额显示正确
6. E2E测试通过

#### 技术实现要点

**前端：**
- 添加税务计算方式选择器
- 添加税率输入框
- 实现实时计算逻辑

**后端：**
- 发票模型添加 taxMethod 和 taxRate 字段
- 创建/更新发票时验证税务计算

**国际化：**
```json
{
  "invoice.taxMethod": "Tax Calculation Method",
  "invoice.taxIncluded": "Tax Included",
  "invoice.taxExcluded": "Tax Excluded",
  "invoice.taxRate": "Tax Rate (%)",
  "invoice.taxAmount": "Tax Amount",
  "invoice.totalWithTax": "Total with Tax"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/CreateInvoicePage.tsx`
- 前端: `JobPortal/client/src/pages/InvoiceDetailPage.tsx`
- 后端: `JobPortal/server/src/controllers/invoice.controller.ts`

---

### TASK-P0-004: 项目批准后关联顾问

**状态:** 🟢 已完成  
**PRD章节:** 4.4.5 申请管理  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** Business Logic Check Report (PROJ-003)

#### 需求描述

当HR批准顾问的项目申请后，系统应自动将顾问关联到项目，建立项目-顾问关系，使顾问能够填报工时。

#### 任务目标

- [ ] HR批准申请后自动创建项目-顾问关联
- [ ] 项目状态自动更新为"进行中"
- [ ] 顾问可以在工时填报页面看到该项目
- [ ] 发送通知给顾问
- [ ] 添加国际化支持

#### 验收标准

1. HR批准申请后，项目关联顾问
2. 项目状态变为"进行中"
3. 顾问工时填报页面显示该项目
4. 顾问收到项目批准通知
5. E2E测试通过

#### 技术实现要点

**后端：**
- 修改 `job-applications.controller.ts` 的 approve 方法
- 批准后更新项目的 assigned_freelancers 字段
- 更新项目状态为 in_progress
- 发送通知

**国际化：**
```json
{
  "notifications.applicationApproved": "Your application has been approved",
  "notifications.projectAssigned": "You have been assigned to project"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/controllers/job-applications.controller.ts`
- 后端: `JobPortal/server/src/models/job.model.ts`
- 前端: `JobPortal/client/src/pages/CreateWorkLogPage.tsx`

---

### TASK-P0-005: 项目状态变更联动

**状态:** 🟢 已完成  
**PRD章节:** 4.4.8 项目状态管理  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** Business Logic Check Report (PROJ-004)

#### 需求描述

项目状态变更时，应触发相应的联动操作：
- 发布项目：通知匹配的顾问
- 开始项目：允许顾问填报工时
- 完成项目：触发评价流程
- 关闭项目：归档相关数据

#### 任务目标

- [ ] 项目发布时通知匹配的顾问
- [ ] 项目开始时允许工时填报
- [ ] 项目完成时触发评价入口
- [ ] 项目关闭时更新相关状态
- [ ] 添加国际化支持

#### 验收标准

1. 项目发布后匹配顾问收到通知
2. 项目进行中时顾问可填报工时
3. 项目完成后显示评价入口
4. 项目关闭后相关数据正确归档
5. E2E测试通过

#### 技术实现要点

**后端：**
- 创建项目状态变更服务
- 实现状态变更钩子
- 触发相应通知

**前端：**
- 根据项目状态显示不同操作入口
- 状态变更确认对话框

**国际化：**
```json
{
  "project.status.draft": "Draft",
  "project.status.published": "Published",
  "project.status.in_progress": "In Progress",
  "project.status.completed": "Completed",
  "project.status.closed": "Closed"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/controllers/jobs.controller.ts`
- 后端: `JobPortal/server/src/services/project-status.service.ts`
- 前端: `JobPortal/client/src/pages/JobDetailPage.tsx`

---

## E2E测试问题修复任务 (P0)

> **来源:** 2026-03-24 全链路E2E测试  
> **详细计划:** [E2E-ISSUES-FIX-PLAN.md](./E2E-ISSUES-FIX-PLAN.md)

### TASK-P0-006: 修复项目列表为空问题

**状态:** 🔴 待处理  
**问题ID:** ISSUE-P0-001  
**PRD章节:** 4.4.2 项目列表  
**创建时间:** 2026-03-24  
**来源:** E2E测试 FLOW-2

#### 问题描述

顾问访问项目列表页面 (`/jobs`) 时，项目列表显示为空，无法浏览和申请项目。HR发布项目后，项目状态可能未正确同步到列表中。

#### E2E测试预期结果

```
场景: 顾问浏览项目列表
前置条件: HR已成功发布项目
步骤:
  1. 顾问登录系统
  2. 访问 /jobs 页面
  3. 等待页面加载完成

预期结果:
  - 项目列表显示至少1个项目卡片
  - 项目卡片包含: 标题、描述、技能要求、费率信息
  - 项目卡片可点击查看详情
  - 有"申请"按钮可见

实际结果:
  - 项目列表为空
  - 显示"暂无项目"或空白
```

#### 任务目标

- [ ] 检查项目发布后状态是否正确设置为"已发布"
- [ ] 检查项目列表API查询条件是否正确
- [ ] 确保项目在列表中正确显示
- [ ] 添加国际化支持

#### 验收标准

1. HR发布项目后，项目状态为"已发布"
2. 顾问访问项目列表，能看到已发布的项目
3. 项目卡片显示完整信息（标题、描述、技能、费率）
4. E2E测试 `FLOW-2` 通过

#### 技术实现要点

**后端检查:**
```typescript
// jobs.controller.ts - 检查项目发布状态
async publishJob(req, res) {
  const job = await Job.findByIdAndUpdate(id, {
    status: 'published',
    is_active: true
  });
}

// 检查列表查询条件
async getJobs(req, res) {
  const jobs = await Job.find({
    is_active: true,
    status: { $in: ['published', 'in_progress'] }
  });
}
```

#### 相关文件

- 后端: `JobPortal/server/src/controllers/jobs.controller.ts`
- 后端: `JobPortal/server/src/models/job.model.ts`
- 前端: `JobPortal/client/src/pages/JobsListPage.tsx`
- 测试: `JobPortal/e2e/tests/complete-cross-role-flow.spec.ts`

---

### TASK-P0-007: 修复项目创建后跳转问题

**状态:** 🔴 待处理  
**问题ID:** ISSUE-P0-002  
**PRD章节:** 4.4.1 项目发布  
**创建时间:** 2026-03-24  
**来源:** E2E测试 FLOW-1

#### 问题描述

HR在项目发布页面提交项目后，页面未跳转到"我的项目"页面，也未显示成功提示，用户无法确认项目是否创建成功。

#### E2E测试预期结果

```
场景: HR发布项目
步骤:
  1. HR登录系统
  2. 访问 /post-job 页面
  3. 填写项目信息
  4. 选择技能大类和小类
  5. 点击提交按钮

预期结果:
  - 提交成功后跳转到 /my-jobs 页面
  - 或显示成功提示Toast
  - 新项目出现在"我的项目"列表中
  - URL变更为 /my-jobs

实际结果:
  - 提交后停留在 /post-job 页面
  - 无成功提示
  - 用户无法确认是否提交成功
```

#### 任务目标

- [ ] 项目提交成功后跳转到 /my-jobs 页面
- [ ] 或显示成功提示Toast
- [ ] 新项目出现在项目列表中
- [ ] 添加国际化支持

#### 验收标准

1. 项目提交成功后跳转到 /my-jobs 页面
2. 或显示成功提示Toast（包含项目名称）
3. 新项目出现在项目列表中
4. E2E测试 `FLOW-1` 通过

#### 技术实现要点

**前端修改:**
```typescript
// PostJobPage.tsx
const handleSubmit = async (data) => {
  try {
    const response = await api.post('/jobs', data);
    toast.success(t('jobs.createSuccess'));
    navigate('/my-jobs');
  } catch (error) {
    toast.error(t('jobs.createFailed'));
  }
};
```

**国际化文案:**
```json
{
  "jobs.createSuccess": "Project created successfully",
  "jobs.createFailed": "Failed to create project"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/PostJobPage.tsx`
- 前端: `JobPortal/client/src/pages/MyJobsPage.tsx`

---

### TASK-P0-008: 添加工时表单项目选择器

**状态:** 🔴 待处理  
**问题ID:** ISSUE-P0-003  
**PRD章节:** 4.5.1 工时填报  
**创建时间:** 2026-03-24  
**来源:** E2E测试 FLOW-4

#### 问题描述

顾问在工时填报页面无法选择关联项目，工时表单缺少项目选择下拉框，导致无法正确关联工时到项目。

#### E2E测试预期结果

```
场景: 顾问填报工时
前置条件: 顾问已被分配到项目
步骤:
  1. 顾问登录系统
  2. 访问 /work-logs 页面
  3. 点击"填报工时"按钮
  4. 进入工时填报表单

预期结果:
  - 表单包含项目选择下拉框
  - 下拉框显示顾问已关联的项目列表
  - 选择项目后显示项目名称
  - 可正常提交工时

实际结果:
  - 表单无项目选择下拉框
  - 无法关联工时到项目
  - 提交后项目字段为空
```

#### 任务目标

- [ ] 工时表单显示项目选择下拉框
- [ ] 下拉框包含顾问已关联的项目
- [ ] 选择项目后可正常提交
- [ ] 工时记录正确关联项目
- [ ] 添加国际化支持

#### 验收标准

1. 工时表单显示项目选择下拉框
2. 下拉框包含顾问已关联的项目
3. 选择项目后可正常提交
4. 工时记录正确关联项目
5. E2E测试 `FLOW-4` 通过

#### 技术实现要点

**前端修改:**
```typescript
// CreateWorkLogPage.tsx
const [projects, setProjects] = useState([]);

useEffect(() => {
  const fetchProjects = async () => {
    const response = await api.get('/users/me/projects');
    setProjects(response.data);
  };
  fetchProjects();
}, []);

return (
  <select name="project_requirement_id" required>
    <option value="">{t('workLog.selectProject')}</option>
    {projects.map(p => (
      <option key={p._id} value={p._id}>{p.project_title}</option>
    ))}
  </select>
);
```

**国际化文案:**
```json
{
  "workLog.project": "Project",
  "workLog.selectProject": "Select a project"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/CreateWorkLogPage.tsx`
- 后端: `JobPortal/server/src/controllers/work-log.controller.ts`
- 后端: `JobPortal/server/src/controllers/jobs.controller.ts`

---

## E2E测试问题修复任务 (P1)

### TASK-P1-009: 修复技能小类加载问题

**状态:** 🔴 待处理  
**问题ID:** ISSUE-P1-001  
**PRD章节:** 4.4.1 项目发布  
**创建时间:** 2026-03-24  
**来源:** E2E测试 FLOW-1

#### 问题描述

HR在项目发布页面选择技能大类后，技能小类按钮未正确加载显示，无法选择具体的技能小类。

#### E2E测试预期结果

```
场景: HR选择技能
步骤:
  1. 访问项目发布页面
  2. 点击技能大类按钮（如"SAP"）
  3. 等待技能小类加载

预期结果:
  - 大类按钮选中状态明显
  - 小类按钮区域显示相关技能
  - 小类按钮可点击选择
  - 选中的技能显示在已选区域

实际结果:
  - 大类按钮可点击
  - 小类按钮区域为空
  - 无法选择具体技能
```

#### 任务目标

- [ ] 选择大类后小类正确显示
- [ ] 小类按钮可点击
- [ ] 选中的技能正确保存
- [ ] 添加国际化支持

#### 验收标准

1. 选择大类后小类正确显示
2. 小类按钮可点击
3. 选中的技能正确保存到项目
4. E2E测试验证通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/PostJobPage.tsx`
- 后端: `JobPortal/server/src/controllers/skill-categories.controller.ts`

---

### TASK-P1-010: 添加工时审批按钮

**状态:** 🔴 待处理  
**问题ID:** ISSUE-P1-002  
**PRD章节:** 4.5.8 工时审核  
**创建时间:** 2026-03-24  
**来源:** E2E测试 FLOW-5

#### 问题描述

HR访问工时审核页面时，未找到工时确认/通过按钮，无法完成工时审批操作。

#### E2E测试预期结果

```
场景: HR审核工时
步骤:
  1. HR登录系统
  2. 访问 /hr-work-logs 页面
  3. 查看待审核工时列表

预期结果:
  - 工时列表显示待审核工时
  - 每条工时有"确认"和"驳回"按钮
  - 点击确认后工时状态变为"已确认"
  - 点击驳回需填写驳回原因

实际结果:
  - 工时列表可显示
  - 无确认/驳回按钮
  - 无法进行审批操作
```

#### 任务目标

- [ ] 工时列表显示确认/驳回按钮
- [ ] 确认按钮可点击并更新状态
- [ ] 驳回按钮可点击并弹出原因输入框
- [ ] 添加国际化支持

#### 验收标准

1. 工时列表显示确认/驳回按钮
2. 确认按钮可点击并更新状态
3. 驳回按钮可点击并弹出原因输入框
4. E2E测试 `FLOW-5` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/HRWorkLogsPage.tsx`
- 后端: `JobPortal/server/src/controllers/work-log.controller.ts`

---

### TASK-P1-011: 添加发票审批按钮

**状态:** 🔴 待处理  
**问题ID:** ISSUE-P1-003  
**PRD章节:** 4.6.6 发票审核  
**创建时间:** 2026-03-24  
**来源:** E2E测试 FLOW-7

#### 问题描述

HR访问发票列表页面时，未找到发票审批按钮，无法完成发票审批操作。

#### E2E测试预期结果

```
场景: HR审批发票
步骤:
  1. HR登录系统
  2. 访问发票列表页面
  3. 查看待审核发票

预期结果:
  - 发票列表显示待审核发票
  - 每条发票有"通过"和"驳回"按钮
  - 点击通过后发票状态变为"已审核"
  - 可上传付款凭证

实际结果:
  - 发票列表可显示
  - 无审批按钮
  - 无法进行审批操作
```

#### 任务目标

- [ ] 发票列表显示审批按钮
- [ ] 审批功能正常工作
- [ ] 添加国际化支持

#### 验收标准

1. 发票列表显示审批按钮
2. 审批功能正常工作
3. E2E测试 `FLOW-7` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/InvoicesPage.tsx`
- 前端: `JobPortal/client/src/pages/InvoiceReviewPage.tsx`
- 后端: `JobPortal/server/src/controllers/invoice.controller.ts`

---

### TASK-P1-012: 添加付款确认按钮

**状态:** 🔴 待处理  
**问题ID:** ISSUE-P1-004  
**PRD章节:** 4.6.7 付款确认  
**创建时间:** 2026-03-24  
**来源:** E2E测试 FLOW-8

#### 问题描述

顾问访问付款页面时，未找到确认收款按钮，无法确认收款。

#### E2E测试预期结果

```
场景: 顾问确认收款
步骤:
  1. 顾问登录系统
  2. 访问 /payments 页面
  3. 查看待确认付款

预期结果:
  - 付款列表显示待确认付款
  - 每条付款有"确认收款"按钮
  - 点击确认后状态更新
  - 显示付款凭证

实际结果:
  - 付款列表可显示
  - 无确认收款按钮
```

#### 任务目标

- [ ] 付款列表显示确认收款按钮
- [ ] 确认功能正常工作
- [ ] 添加国际化支持

#### 验收标准

1. 付款列表显示确认收款按钮
2. 确认功能正常工作
3. E2E测试 `FLOW-8` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/PaymentsPage.tsx`
- 后端: `JobPortal/server/src/controllers/invoice.controller.ts`

---

## P1 任务清单

### TASK-P1-001: 企业注册流程完善

**状态:** 🟢 已完成  
**PRD章节:** AUTH-002 (新增)  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** PRD补充需求

#### 需求描述

完善企业注册流程，用户注册为HR后，自动跳转到企业设置页面，填写企业信息并上传营业执照，等待管理员审核。

#### 任务目标

- [ ] HR注册后自动跳转企业设置页面
- [ ] 创建企业信息填写表单
- [ ] 添加营业执照上传功能
- [ ] 创建管理员企业审核页面
- [ ] 审核通过后企业状态更新
- [ ] 添加国际化支持

#### 验收标准

1. HR注册后跳转到企业设置页面
2. 企业信息表单验证正确
3. 营业执照上传成功
4. 管理员可审核企业
5. 审核后状态正确更新
6. E2E测试通过

#### 技术实现要点

**前端：**
- 创建 `CompanySetupPage.tsx`
- 创建 `AdminCompanyReviewPage.tsx`（如不存在）
- 注册后路由跳转

**后端：**
- 企业认证审核API
- 文件上传处理

**国际化：**
```json
{
  "company.setup.title": "Company Setup",
  "company.setup.companyName": "Company Name",
  "company.setup.businessLicense": "Business License",
  "company.setup.submit": "Submit for Review",
  "admin.companyReview.title": "Company Review"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/CompanySetupPage.tsx`（新建）
- 前端: `JobPortal/client/src/pages/RegisterPage.tsx`
- 后端: `JobPortal/server/src/controllers/companies.controller.ts`

---

### TASK-P1-002: 消息偏好设置

**状态:** 🟢 已完成  
**PRD章节:** 4.7.3 消息设置  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** PRD-Feature-Checklist (MSG-003)

#### 需求描述

用户可以设置消息接收偏好，包括站内消息、邮件通知、短信通知的开关设置。

#### 任务目标

- [ ] 创建消息偏好设置页面
- [ ] 实现各类通知开关
- [ ] 保存用户偏好设置
- [ ] 发送通知时检查用户偏好
- [ ] 添加国际化支持

#### 验收标准

1. 用户可访问消息设置页面
2. 各类通知开关可切换
3. 设置保存成功
4. 发送通知时遵循用户设置
5. E2E测试通过

#### 技术实现要点

**前端：**
- 创建 `NotificationSettingsPage.tsx`
- 实现开关组件

**后端：**
- 用户模型添加 notificationPreferences 字段
- 通知发送时检查偏好

**国际化：**
```json
{
  "settings.notifications.title": "Notification Settings",
  "settings.notifications.inApp": "In-App Notifications",
  "settings.notifications.email": "Email Notifications",
  "settings.notifications.sms": "SMS Notifications"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/NotificationSettingsPage.tsx`（新建）
- 后端: `JobPortal/server/src/models/user.model.ts`
- 后端: `JobPortal/server/src/services/notification-helper.service.ts`

---

### TASK-P1-003: 邮件通知集成

**状态:** 🟢 已完成  
**PRD章节:** 4.7.4 邮件通知  
**创建时间:** 2026-03-24  
**完成时间:** 2026-03-24
**来源:** PRD-Feature-Checklist (MSG-004)

#### 需求描述

集成邮件发送服务，支持重要事件的邮件通知，包括项目申请、工时审核、发票审核、付款确认等场景。

#### 任务目标

- [ ] 集成邮件发送服务（Nodemailer或第三方）
- [ ] 创建邮件模板
- [ ] 实现邮件发送队列
- [ ] 发送邮件时检查用户偏好
- [ ] 记录邮件发送日志
- [ ] 添加国际化支持

#### 验收标准

1. 邮件发送服务配置正确
2. 各场景邮件模板存在
3. 邮件发送成功
4. 用户可控制是否接收邮件
5. E2E测试通过

#### 技术实现要点

**后端：**
- 创建 `email.service.ts`
- 创建邮件模板目录
- 实现邮件队列

**邮件模板：**
- 项目申请通知
- 申请结果通知
- 工时审核通知
- 发票审核通知
- 付款确认通知

**国际化：**
```json
{
  "email.subject.applicationSubmitted": "New Project Application",
  "email.subject.applicationApproved": "Application Approved",
  "email.subject.workLogConfirmed": "Work Log Confirmed",
  "email.subject.invoiceApproved": "Invoice Approved"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/services/email.service.ts`（新建）
- 后端: `JobPortal/server/src/templates/emails/`（新建目录）

---

### TASK-P1-004: 项目收藏功能

**状态:** 🔴 待处理  
**PRD章节:** 4.4.9 项目收藏  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (PROJ-009)

#### 需求描述

用户可以收藏感兴趣的项目，并在收藏列表中查看所有已收藏的项目。

#### 任务目标

- [ ] 项目详情页添加收藏按钮
- [ ] 实现收藏/取消收藏功能
- [ ] 创建收藏项目列表页面
- [ ] 收藏状态持久化
- [ ] 添加国际化支持

#### 验收标准

1. 项目详情页显示收藏按钮
2. 点击收藏后状态正确更新
3. 收藏列表显示所有已收藏项目
4. 可取消收藏
5. E2E测试通过

#### 技术实现要点

**前端：**
- 项目详情页添加收藏按钮
- 更新 `SavedJobsPage.tsx`

**后端：**
- 用户模型添加 favorites 字段
- 添加收藏API

**国际化：**
```json
{
  "jobs.favorite": "Favorite",
  "jobs.unfavorite": "Unfavorite",
  "jobs.favorited": "Favorited",
  "jobs.savedJobs": "Saved Jobs"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/JobDetailPage.tsx`
- 前端: `JobPortal/client/src/pages/SavedJobsPage.tsx`
- 后端: `JobPortal/server/src/controllers/jobs.controller.ts`

---

### TASK-P1-005: 项目高级搜索

**状态:** 🔴 待处理  
**PRD章节:** 4.4.10 项目搜索  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (PROJ-010)

#### 需求描述

支持多条件组合搜索项目，包括技能、地域、费率范围、项目周期等筛选条件，以及关键词全文搜索。

#### 任务目标

- [ ] 创建高级搜索组件
- [ ] 实现技能筛选
- [ ] 实现地域筛选
- [ ] 实现费率范围筛选
- [ ] 实现项目周期筛选
- [ ] 实现关键词搜索
- [ ] 添加国际化支持

#### 验收标准

1. 高级搜索面板显示正确
2. 各筛选条件可组合使用
3. 搜索结果正确
4. 支持重置筛选条件
5. E2E测试通过

#### 技术实现要点

**前端：**
- 创建 `AdvancedSearch.tsx` 组件
- 集成到项目列表页

**后端：**
- 扩展项目列表API支持多条件筛选
- 实现全文搜索

**国际化：**
```json
{
  "search.advanced": "Advanced Search",
  "search.skills": "Skills",
  "search.location": "Location",
  "search.rateRange": "Rate Range",
  "search.projectCycle": "Project Cycle",
  "search.keywords": "Keywords",
  "search.reset": "Reset Filters"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/components/AdvancedSearch.tsx`（新建）
- 前端: `JobPortal/client/src/pages/JobsListPage.tsx`
- 后端: `JobPortal/server/src/controllers/jobs.controller.ts`

---

### TASK-P1-006: 可用性日历

**状态:** 🔴 待处理  
**PRD章节:** 4.3.6 可用性日历  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (PROFILE-006)

#### 需求描述

顾问可以设置可用性日历，标记可接单日期范围和忙碌日期，用于项目匹配计算。

#### 任务目标

- [ ] 创建可用性日历组件
- [ ] 实现可用时间段设置
- [ ] 实现不可用时间段设置
- [ ] 在档案页面集成日历
- [ ] 匹配算法考虑可用性
- [ ] 添加国际化支持

#### 验收标准

1. 日历组件正确显示
2. 可标记可用/不可用日期
3. 设置保存成功
4. 匹配度计算考虑可用性
5. E2E测试通过

#### 技术实现要点

**前端：**
- 创建 `AvailabilityCalendar.tsx` 组件
- 集成到档案页面

**后端：**
- 用户模型添加 availability 字段
- 匹配算法更新

**国际化：**
```json
{
  "profile.availability.title": "Availability Calendar",
  "profile.availability.available": "Available",
  "profile.availability.unavailable": "Unavailable",
  "profile.availability.setRange": "Set Date Range"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/components/AvailabilityCalendar.tsx`（新建）
- 前端: `JobPortal/client/src/pages/ProfilePage.tsx`
- 后端: `JobPortal/server/src/services/match-score.service.ts`

---

### TASK-P1-007: 档案完整度计算

**状态:** 🔴 待处理  
**PRD章节:** 4.3.8 档案完整度  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (PROFILE-008)

#### 需求描述

系统自动计算顾问档案完整度，显示完整度百分比，并提示需要完善的信息项。

#### 任务目标

- [ ] 创建档案完整度计算服务
- [ ] 定义各字段权重
- [ ] 在档案页面显示完整度进度条
- [ ] 显示缺失项提示
- [ ] 保存后自动更新完整度
- [ ] 添加国际化支持

#### 验收标准

1. 完整度计算正确
2. 进度条显示正确
3. 缺失项提示清晰
4. 保存后完整度更新
5. E2E测试通过

#### 技术实现要点

**前端：**
- 创建完整度进度条组件
- 显示缺失项列表

**后端：**
- 创建 `profile-completion.service.ts`
- 定义计算规则

**完整度计算规则：**
| 字段 | 权重 |
|------|------|
| 基本信息 | 20% |
| 技能标签 | 25% |
| 项目经历 | 20% |
| 资质证书 | 15% |
| 费率设置 | 10% |
| 头像 | 10% |

**国际化：**
```json
{
  "profile.completion.title": "Profile Completion",
  "profile.completion.incomplete": "Complete your profile to get more opportunities",
  "profile.completion.missingItems": "Missing Items"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/components/ProfileCompletion.tsx`（新建）
- 前端: `JobPortal/client/src/pages/ProfilePage.tsx`
- 后端: `JobPortal/server/src/services/profile-completion.service.ts`（新建）

---

### TASK-P1-008: 内容审核功能

**状态:** 🔴 待处理  
**PRD章节:** 4.10.7 内容审核  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (ADMIN-007)

#### 需求描述

管理员可以审核平台内容，包括项目内容、评价内容等，支持通过、驳回、删除操作。

#### 任务目标

- [ ] 创建内容审核列表页面
- [ ] 实现项目内容审核
- [ ] 实现评价内容审核
- [ ] 支持批量审核
- [ ] 添加国际化支持

#### 验收标准

1. 审核列表显示待审核内容
2. 可查看内容详情
3. 可通过/驳回/删除
4. 批量审核功能正常
5. E2E测试通过

#### 技术实现要点

**前端：**
- 创建 `AdminContentReviewPage.tsx`
- 实现审核操作

**后端：**
- 创建审核API
- 记录审核日志

**国际化：**
```json
{
  "admin.contentReview.title": "Content Review",
  "admin.contentReview.pending": "Pending Review",
  "admin.contentReview.approve": "Approve",
  "admin.contentReview.reject": "Reject",
  "admin.contentReview.delete": "Delete"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/admin/AdminContentReviewPage.tsx`（新建）
- 后端: `JobPortal/server/src/controllers/admin.controller.ts`

---

## P2 任务清单

### TASK-P2-001: 登录日志功能

**状态:** 🔴 待处理  
**PRD章节:** 4.2.6 登录日志  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (AUTH-006)

#### 需求描述

记录用户登录日志，包括登录时间、IP地址、设备信息等，用于安全审计。

#### 任务目标

- [ ] 创建登录日志数据模型
- [ ] 登录时记录日志
- [ ] 创建登录日志查询页面
- [ ] 支持按时间、用户筛选
- [ ] 添加国际化支持

#### 验收标准

1. 登录时自动记录日志
2. 日志包含时间、IP、设备信息
3. 管理员可查询日志
4. 筛选功能正常
5. E2E测试通过

#### 技术实现要点

**后端：**
- 创建 `LoginLog` 模型
- 登录中间件记录日志

**前端：**
- 创建登录日志查看页面

**国际化：**
```json
{
  "admin.loginLog.title": "Login Logs",
  "admin.loginLog.loginTime": "Login Time",
  "admin.loginLog.ipAddress": "IP Address",
  "admin.loginLog.device": "Device"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/models/login-log.model.ts`（新建）
- 后端: `JobPortal/server/src/middleware/login-log.middleware.ts`（新建）
- 前端: `JobPortal/client/src/pages/admin/LoginLogPage.tsx`（新建）

---

### TASK-P2-002: 工时导出功能

**状态:** 🔴 待处理  
**PRD章节:** 4.5.10 工时导出  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (WORKLOG-010)

#### 需求描述

支持导出工时数据为Excel格式，包括工时明细、统计汇总等。

#### 任务目标

- [ ] 集成Excel导出库
- [ ] 实现工时导出API
- [ ] 在工时列表页添加导出按钮
- [ ] 支持筛选条件导出
- [ ] 添加国际化支持

#### 验收标准

1. 导出按钮显示正确
2. 导出文件格式正确
3. 数据完整准确
4. 支持筛选导出
5. E2E测试通过

#### 技术实现要点

**后端：**
- 集成 exceljs 库
- 创建导出API

**前端：**
- 添加导出按钮
- 处理文件下载

**国际化：**
```json
{
  "workLog.export": "Export",
  "workLog.exportExcel": "Export to Excel",
  "workLog.exporting": "Exporting..."
}
```

#### 相关文件

- 后端: `JobPortal/server/src/controllers/work-log.controller.ts`
- 后端: `JobPortal/server/src/services/export.service.ts`（新建）
- 前端: `JobPortal/client/src/pages/WorkLogsPage.tsx`

---

### TASK-P2-003: 发票导出功能

**状态:** 🔴 待处理  
**PRD章节:** 4.6.10 发票导出  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (INV-010)

#### 需求描述

支持导出发票数据为PDF格式，包括发票详情、明细等。

#### 任务目标

- [ ] 集成PDF导出库
- [ ] 实现发票导出API
- [ ] 在发票详情页添加导出按钮
- [ ] PDF格式符合发票模板
- [ ] 添加国际化支持

#### 验收标准

1. 导出按钮显示正确
2. PDF格式正确
3. 发票信息完整
4. 可打印
5. E2E测试通过

#### 技术实现要点

**后端：**
- 集成 pdfkit 库
- 创建发票PDF模板

**前端：**
- 添加导出按钮
- 处理文件下载

**国际化：**
```json
{
  "invoice.export": "Export",
  "invoice.exportPDF": "Export to PDF",
  "invoice.print": "Print Invoice"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/controllers/invoice.controller.ts`
- 后端: `JobPortal/server/src/services/pdf.service.ts`（新建）
- 前端: `JobPortal/client/src/pages/InvoiceDetailPage.tsx`

---

### TASK-P2-004: 短信通知集成

**状态:** 🔴 待处理  
**PRD章节:** 4.7.5 短信通知  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (MSG-005)

#### 需求描述

集成短信发送服务，支持关键事件的短信通知，如付款确认、账号安全等。

#### 任务目标

- [ ] 集成短信发送服务
- [ ] 创建短信模板
- [ ] 实现短信发送功能
- [ ] 发送时检查用户偏好
- [ ] 记录短信发送日志
- [ ] 添加国际化支持

#### 验收标准

1. 短信服务配置正确
2. 关键事件触发短信
3. 用户可控制是否接收
4. 发送日志记录正确
5. E2E测试通过

#### 技术实现要点

**后端：**
- 集成阿里云/腾讯云短信服务
- 创建短信模板

**短信场景：**
- 付款确认
- 账号安全提醒
- 重要审核结果

**国际化：**
```json
{
  "sms.paymentConfirmed": "Payment confirmed. Amount: {amount}",
  "sms.securityAlert": "Security alert: New login detected"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/services/sms.service.ts`（新建）
- 后端: `JobPortal/server/src/services/notification-helper.service.ts`

---

### TASK-P2-005: 评价管理功能

**状态:** 🔴 待处理  
**PRD章节:** 4.8.5 评价管理  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (RATE-005)

#### 需求描述

管理员可以管理违规评价，支持查看、删除等操作。

#### 任务目标

- [ ] 创建评价管理页面
- [ ] 实现评价列表查看
- [ ] 实现评价删除功能
- [ ] 记录操作日志
- [ ] 添加国际化支持

#### 验收标准

1. 评价列表显示正确
2. 可查看评价详情
3. 可删除违规评价
4. 操作日志记录正确
5. E2E测试通过

#### 技术实现要点

**前端：**
- 创建 `AdminRatingsPage.tsx`

**后端：**
- 添加评价管理API
- 软删除评价

**国际化：**
```json
{
  "admin.ratings.title": "Rating Management",
  "admin.ratings.delete": "Delete Rating",
  "admin.ratings.deleteConfirm": "Are you sure to delete this rating?"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/admin/AdminRatingsPage.tsx`（新建）
- 后端: `JobPortal/server/src/controllers/rating.controller.ts`

---

### TASK-P2-006: 财务报表功能

**状态:** 🔴 待处理  
**PRD章节:** 4.9.6 财务报表  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (STAT-006)

#### 需求描述

提供财务报表功能，包括收入、支出、利润等数据的统计和图表展示。

#### 任务目标

- [ ] 创建财务报表服务
- [ ] 实现收入统计
- [ ] 实现支出统计
- [ ] 实现利润分析
- [ ] 创建报表页面
- [ ] 添加国际化支持

#### 验收标准

1. 收入数据统计正确
2. 支出数据统计正确
3. 利润计算正确
4. 图表展示清晰
5. E2E测试通过

#### 技术实现要点

**前端：**
- 创建 `FinancialReportsPage.tsx`
- 使用 ECharts 绘制图表

**后端：**
- 创建财务报表API
- 数据聚合计算

**国际化：**
```json
{
  "reports.financial.title": "Financial Reports",
  "reports.financial.income": "Income",
  "reports.financial.expense": "Expense",
  "reports.financial.profit": "Profit"
}
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/FinancialReportsPage.tsx`（新建）
- 后端: `JobPortal/server/src/services/financial-report.service.ts`（新建）

---

### TASK-P2-007: 数据导出功能

**状态:** 🔴 待处理  
**PRD章节:** 4.9.7 数据导出  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (STAT-007)

#### 需求描述

支持导出统计报表数据，包括Excel和PDF格式。

#### 任务目标

- [ ] 实现报表导出API
- [ ] 支持Excel格式导出
- [ ] 支持PDF格式导出
- [ ] 在报表页面添加导出按钮
- [ ] 添加国际化支持

#### 验收标准

1. 导出按钮显示正确
2. Excel格式正确
3. PDF格式正确
4. 数据完整
5. E2E测试通过

#### 技术实现要点

**后端：**
- 扩展导出服务
- 支持多种格式

**前端：**
- 添加导出按钮组

**国际化：**
```json
{
  "reports.export": "Export",
  "reports.exportExcel": "Export Excel",
  "reports.exportPDF": "Export PDF"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/services/export.service.ts`
- 前端: `JobPortal/client/src/pages/ReportsPage.tsx`

---

### TASK-P2-008: 操作日志功能

**状态:** 🔴 待处理  
**PRD章节:** 4.10.9 操作日志  
**创建时间:** 2026-03-24  
**来源:** PRD-Feature-Checklist (ADMIN-009)

#### 需求描述

记录管理员操作日志，包括操作时间、操作人、操作内容等，用于审计追踪。

#### 任务目标

- [ ] 创建操作日志数据模型
- [ ] 创建操作日志中间件
- [ ] 实现日志记录功能
- [ ] 创建日志查询页面
- [ ] 添加国际化支持

#### 验收标准

1. 管理员操作自动记录
2. 日志包含完整信息
3. 可查询和筛选
4. 日志不可删除
5. E2E测试通过

#### 技术实现要点

**后端：**
- 创建 `AuditLog` 模型
- 创建审计中间件

**前端：**
- 创建日志查看页面

**国际化：**
```json
{
  "admin.auditLog.title": "Audit Logs",
  "admin.auditLog.operation": "Operation",
  "admin.auditLog.operator": "Operator",
  "admin.auditLog.time": "Time"
}
```

#### 相关文件

- 后端: `JobPortal/server/src/models/audit-log.model.ts`（新建）
- 后端: `JobPortal/server/src/middleware/audit.middleware.ts`（新建）
- 前端: `JobPortal/client/src/pages/admin/AuditLogPage.tsx`（新建）

---

## 国际化文案文件结构

### 文件位置

```
JobPortal/client/src/i18n/
├── index.ts          # i18n配置
└── locales/
    ├── en.json       # 英文文案
    └── zh.json       # 中文文案
```

### 文案模块划分

```json
{
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "search": "Search",
    "filter": "Filter",
    "reset": "Reset",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error"
  },
  "auth": {
    "login": "Sign In",
    "register": "Sign Up",
    "logout": "Sign Out",
    "forgotPassword": "Forgot Password"
  },
  "dashboard": {
    "welcome": "Welcome back",
    "overview": "Overview"
  },
  "jobs": {
    "title": "Projects",
    "postJob": "Post Project",
    "myJobs": "My Projects",
    "savedJobs": "Saved Projects"
  },
  "workLog": {
    "title": "Work Logs",
    "create": "New Work Log",
    "submit": "Submit",
    "approve": "Approve",
    "reject": "Reject"
  },
  "invoice": {
    "title": "Invoices",
    "create": "New Invoice",
    "submit": "Submit",
    "approve": "Approve",
    "reject": "Reject"
  },
  "profile": {
    "title": "Profile",
    "edit": "Edit Profile",
    "skills": "Skills",
    "experience": "Experience"
  },
  "admin": {
    "dashboard": "Admin Dashboard",
    "users": "User Management",
    "companies": "Company Management",
    "settings": "System Settings"
  },
  "notifications": {
    "title": "Notifications",
    "markAllRead": "Mark All as Read"
  }
}
```

---

## 任务更新日志

| 日期 | 任务ID | 操作 | 说明 |
|------|--------|------|------|
| 2026-03-24 | - | 创建 | 初始化任务清单 |
| 2026-03-24 | TASK-P0-006~008 | 新增 | 添加E2E测试P0问题修复任务 |
| 2026-03-24 | TASK-P1-009~012 | 新增 | 添加E2E测试P1问题修复任务 |

---

**文档维护者:** AI Assistant  
**下次更新:** 任务状态变更时
