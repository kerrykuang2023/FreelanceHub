# E2E测试问题修复任务计划

**创建日期:** 2026-03-24  
**来源:** 全链路E2E测试报告  
**测试通过率:** 83% (48/58)

---

## 一、问题汇总

### 1.1 问题统计

| 优先级 | 问题数量 | 影响范围 |
|--------|----------|----------|
| P0 (阻塞) | 3 | 核心业务流程受阻 |
| P1 (严重) | 4 | 用户体验受损 |
| P2 (一般) | 3 | 功能不完整 |
| **总计** | **10** | - |

### 1.2 问题分布

| 模块 | 问题数 | 占比 |
|------|--------|------|
| 项目管理 (PROJ) | 3 | 30% |
| 工时管理 (WORKLOG) | 2 | 20% |
| 发票管理 (INV) | 2 | 20% |
| 技能管理 (SKILL) | 1 | 10% |
| 付款管理 (PAY) | 1 | 10% |
| 举报管理 (REPORT) | 1 | 10% |

---

## 二、P0 高优先级问题

### ISSUE-P0-001: 项目列表为空

**问题ID:** FL-001  
**发现时间:** 2026-03-24  
**E2E测试用例:** FLOW-2: Freelancer browses and applies for project  
**严重程度:** 🔴 HIGH (阻塞)

#### 问题描述

顾问访问项目列表页面 (`/jobs`) 时，项目列表显示为空，无法浏览和申请项目。

#### E2E测试预期结果

```
场景: 顾问浏览项目列表
步骤:
  1. HR发布项目成功
  2. 顾问登录系统
  3. 顾问访问 /jobs 页面
  4. 页面应显示已发布的项目列表

预期结果:
  - 项目列表显示至少1个项目卡片
  - 项目卡片包含: 标题、描述、技能要求、费率信息
  - 项目卡片可点击查看详情
  - 有"申请"按钮可见

实际结果:
  - 项目列表为空
  - 显示"暂无项目"或空白
```

#### 根本原因分析

1. **数据同步问题**: 项目发布后状态未正确更新为"已发布"
2. **查询条件问题**: 项目列表API可能过滤掉了某些状态的项目
3. **权限问题**: 顾问可能无法查看某些企业发布的项目

#### 修复方案

**方案A: 检查项目发布状态**
```typescript
// 后端: jobs.controller.ts
// 确保项目发布后状态正确
async publishJob(req, res) {
  const job = await Job.findByIdAndUpdate(id, {
    status: 'published',  // 确保状态正确
    is_active: true
  });
  // ...
}

// 前端: 确保发布时传递正确状态
const publishProject = async (data) => {
  await api.post('/jobs', {
    ...data,
    status: 'published',
    is_active: true
  });
};
```

**方案B: 检查列表查询条件**
```typescript
// 后端: 确保查询条件正确
async getJobs(req, res) {
  const jobs = await Job.find({
    is_active: true,
    status: { $in: ['published', 'in_progress'] }  // 包含已发布状态
  });
  // ...
}
```

#### 验收标准

- [ ] HR发布项目后，项目状态为"已发布"
- [ ] 顾问访问项目列表，能看到已发布的项目
- [ ] 项目卡片显示完整信息
- [ ] E2E测试 `FLOW-2` 通过

#### 相关文件

- 后端: `JobPortal/server/src/controllers/jobs.controller.ts`
- 后端: `JobPortal/server/src/models/job.model.ts`
- 前端: `JobPortal/client/src/pages/JobsListPage.tsx`
- 测试: `JobPortal/e2e/tests/complete-cross-role-flow.spec.ts`

---

### ISSUE-P0-002: 项目创建后未正确跳转

**问题ID:** HR-001  
**发现时间:** 2026-03-24  
**E2E测试用例:** FLOW-1: HR creates a project with skill selection  
**严重程度:** 🔴 HIGH (阻塞)

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

#### 根本原因分析

1. **缺少跳转逻辑**: 提交成功后未执行路由跳转
2. **缺少成功提示**: 未添加Toast或Alert提示
3. **API响应处理**: 可能未正确处理API响应

#### 修复方案

```typescript
// 前端: PostJobPage.tsx
const handleSubmit = async (data) => {
  try {
    const response = await api.post('/jobs', data);
    
    // 方案1: 跳转到我的项目页面
    navigate('/my-jobs');
    
    // 方案2: 显示成功提示
    toast.success(t('jobs.createSuccess'));
    
    // 方案3: 跳转到项目详情页
    navigate(`/jobs/${response.data._id}`);
  } catch (error) {
    toast.error(t('jobs.createFailed'));
  }
};
```

#### 验收标准

- [ ] 项目提交成功后跳转到 /my-jobs 页面
- [ ] 或显示成功提示Toast
- [ ] 新项目出现在项目列表中
- [ ] E2E测试 `FLOW-1` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/PostJobPage.tsx`
- 前端: `JobPortal/client/src/pages/MyJobsPage.tsx`

---

### ISSUE-P0-003: 工时表单缺少项目选择器

**问题ID:** FL-002  
**发现时间:** 2026-03-24  
**E2E测试用例:** FLOW-4: Freelancer fills work log  
**严重程度:** 🔴 HIGH (阻塞)

#### 问题描述

顾问在工时填报页面无法选择关联项目，工时表单缺少项目选择下拉框，导致无法正确关联工时到项目。

#### E2E测试预期结果

```
场景: 顾问填报工时
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

#### 根本原因分析

1. **组件缺失**: 工时表单未渲染项目选择组件
2. **数据未加载**: 项目列表API未正确调用
3. **条件判断**: 可能因某些条件未满足而不显示

#### 修复方案

```typescript
// 前端: CreateWorkLogPage.tsx
const CreateWorkLogPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    // 加载顾问关联的项目
    const fetchProjects = async () => {
      const response = await api.get('/users/me/projects');
      setProjects(response.data);
    };
    fetchProjects();
  }, []);

  return (
    <form>
      {/* 添加项目选择器 */}
      <div className="form-group">
        <label>{t('workLog.project')}</label>
        <select 
          name="project_requirement_id"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          required
        >
          <option value="">{t('workLog.selectProject')}</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.project_title}</option>
          ))}
        </select>
      </div>
      {/* 其他字段... */}
    </form>
  );
};
```

#### 验收标准

- [ ] 工时表单显示项目选择下拉框
- [ ] 下拉框包含顾问已关联的项目
- [ ] 选择项目后可正常提交
- [ ] 工时记录正确关联项目
- [ ] E2E测试 `FLOW-4` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/CreateWorkLogPage.tsx`
- 后端: `JobPortal/server/src/controllers/work-log.controller.ts`
- 后端: `JobPortal/server/src/controllers/jobs.controller.ts` (获取用户项目API)

---

## 三、P1 严重问题

### ISSUE-P1-001: 技能小类按钮未加载

**问题ID:** FL-003  
**发现时间:** 2026-03-24  
**E2E测试用例:** FLOW-1: HR creates a project with skill selection  
**严重程度:** 🟠 MEDIUM

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

#### 根本原因分析

1. **数据关联问题**: 大类和小类数据未正确关联
2. **前端渲染问题**: 小类组件条件渲染逻辑错误
3. **API响应问题**: 小类数据未正确返回

#### 修复方案

```typescript
// 前端: PostJobPage.tsx
const [selectedMajorCategories, setSelectedMajorCategories] = useState([]);
const [subCategories, setSubCategories] = useState([]);

// 监听大类变化，加载小类
useEffect(() => {
  if (selectedMajorCategories.length > 0) {
    const fetchSubCategories = async () => {
      const response = await api.get('/skill-categories/sub', {
        params: { majorIds: selectedMajorCategories }
      });
      setSubCategories(response.data);
    };
    fetchSubCategories();
  }
}, [selectedMajorCategories]);
```

#### 验收标准

- [ ] 选择大类后小类正确显示
- [ ] 小类按钮可点击
- [ ] 选中的技能正确保存
- [ ] E2E测试验证通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/PostJobPage.tsx`
- 后端: `JobPortal/server/src/controllers/skill-categories.controller.ts`

---

### ISSUE-P1-002: 未找到工时确认按钮

**问题ID:** HR-003  
**发现时间:** 2026-03-24  
**E2E测试用例:** FLOW-5: HR approves work log  
**严重程度:** 🟠 MEDIUM

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

#### 修复方案

```typescript
// 前端: HRWorkLogsPage.tsx
const WorkLogItem = ({ workLog, onConfirm, onReject }) => {
  return (
    <div className="worklog-item">
      {/* 工时信息显示 */}
      <div className="worklog-info">
        <span>{workLog.freelancer_name}</span>
        <span>{workLog.hours_worked}h</span>
        <span>{workLog.work_date}</span>
      </div>
      
      {/* 添加操作按钮 */}
      <div className="worklog-actions">
        <button 
          className="btn-confirm"
          onClick={() => onConfirm(workLog._id)}
        >
          {t('workLog.confirm')}
        </button>
        <button 
          className="btn-reject"
          onClick={() => onReject(workLog._id)}
        >
          {t('workLog.reject')}
        </button>
      </div>
    </div>
  );
};
```

#### 验收标准

- [ ] 工时列表显示确认/驳回按钮
- [ ] 确认按钮可点击并更新状态
- [ ] 驳回按钮可点击并弹出原因输入框
- [ ] E2E测试 `FLOW-5` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/HRWorkLogsPage.tsx`
- 后端: `JobPortal/server/src/controllers/work-log.controller.ts`

---

### ISSUE-P1-003: 未找到发票审批按钮

**问题ID:** HR-004  
**发现时间:** 2026-03-24  
**E2E测试用例:** FLOW-7: HR approves invoice  
**严重程度:** 🟠 MEDIUM

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

#### 修复方案

参考 ISSUE-P1-002 工时审批按钮的实现。

#### 验收标准

- [ ] 发票列表显示审批按钮
- [ ] 审批功能正常工作
- [ ] E2E测试 `FLOW-7` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/InvoicesPage.tsx`
- 前端: `JobPortal/client/src/pages/InvoiceReviewPage.tsx`
- 后端: `JobPortal/server/src/controllers/invoice.controller.ts`

---

### ISSUE-P1-004: 未找到付款确认按钮

**问题ID:** PAY-001  
**发现时间:** 2026-03-24  
**E2E测试用例:** FLOW-8: Freelancer confirms payment  
**严重程度:** 🟠 MEDIUM

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

#### 修复方案

```typescript
// 前端: PaymentsPage.tsx
const PaymentItem = ({ payment, onConfirm }) => {
  return (
    <div className="payment-item">
      <div className="payment-info">
        <span>{payment.invoice_number}</span>
        <span>{payment.amount}</span>
        <span>{payment.status}</span>
      </div>
      
      {/* 添加确认按钮 */}
      {payment.status === 'paid' && (
        <button 
          className="btn-confirm"
          onClick={() => onConfirm(payment._id)}
        >
          {t('payment.confirmReceived')}
        </button>
      )}
    </div>
  );
};
```

#### 验收标准

- [ ] 付款列表显示确认收款按钮
- [ ] 确认功能正常工作
- [ ] E2E测试 `FLOW-8` 通过

#### 相关文件

- 前端: `JobPortal/client/src/pages/PaymentsPage.tsx`
- 后端: `JobPortal/server/src/controllers/invoice.controller.ts`

---

## 四、P2 一般问题

### ISSUE-P2-001: 申请列表为空

**问题ID:** HR-002  
**严重程度:** 🟡 LOW

#### 问题描述

HR访问申请管理页面时，申请列表显示为空，即使顾问已提交申请。

#### E2E测试预期结果

```
场景: HR查看申请列表
步骤:
  1. 顾问提交项目申请
  2. HR访问 /applications-management 页面

预期结果:
  - 显示顾问提交的申请
  - 可查看申请详情
  - 可进行录用/拒绝操作

实际结果:
  - 申请列表为空
```

#### 修复方案

检查申请数据创建和查询逻辑，确保申请提交后数据正确保存并可被查询。

#### 相关文件

- 前端: `JobPortal/client/src/pages/ApplicationsManagementPage.tsx`
- 后端: `JobPortal/server/src/controllers/job-applications.controller.ts`

---

### ISSUE-P2-002: 未找到举报验证按钮

**问题ID:** ADM-001  
**严重程度:** 🟡 LOW

#### 问题描述

管理员访问举报管理页面时，未找到验证/处理举报的按钮。

#### E2E测试预期结果

```
场景: 管理员处理举报
步骤:
  1. 管理员登录系统
  2. 访问 /admin/reports 页面

预期结果:
  - 显示举报列表
  - 每条举报有"验证"、"驳回"按钮
  - 可查看举报详情

实际结果:
  - 举报列表可显示
  - 无操作按钮
```

#### 相关文件

- 前端: `JobPortal/client/src/pages/admin/AdminReportManagementPage.tsx`
- 后端: `JobPortal/server/src/controllers/report.controller.ts`

---

### ISSUE-P2-003: 报表统计图表缺失

**问题ID:** STAT-001  
**严重程度:** 🟡 LOW

#### 问题描述

报表页面缺少统计图表组件，无法直观展示数据。

#### E2E测试预期结果

```
场景: 查看报表统计
步骤:
  1. 访问 /reports 页面

预期结果:
  - 显示工时趋势图表
  - 显示项目收入分布饼图
  - 显示发票统计图表
  - 可切换时间周期

实际结果:
  - 图表组件不存在
  - data-testid="worklog-chart" 找不到
```

#### 修复方案

集成 ECharts 或其他图表库，实现数据可视化。

#### 相关文件

- 前端: `JobPortal/client/src/pages/ReportsPage.tsx`
- 前端: `JobPortal/client/src/components/charts/` (新建)

---

## 五、修复优先级排序

| 顺序 | 问题ID | 问题名称 | 优先级 | 预计工时 |
|------|--------|----------|--------|----------|
| 1 | ISSUE-P0-001 | 项目列表为空 | P0 | 2h |
| 2 | ISSUE-P0-002 | 项目创建后未跳转 | P0 | 1h |
| 3 | ISSUE-P0-003 | 工时表单缺少项目选择器 | P0 | 2h |
| 4 | ISSUE-P1-001 | 技能小类未加载 | P1 | 2h |
| 5 | ISSUE-P1-002 | 工时确认按钮缺失 | P1 | 1h |
| 6 | ISSUE-P1-003 | 发票审批按钮缺失 | P1 | 1h |
| 7 | ISSUE-P1-004 | 付款确认按钮缺失 | P1 | 1h |
| 8 | ISSUE-P2-001 | 申请列表为空 | P2 | 2h |
| 9 | ISSUE-P2-002 | 举报验证按钮缺失 | P2 | 1h |
| 10 | ISSUE-P2-003 | 报表图表缺失 | P2 | 4h |

**总预计工时:** 17小时

---

## 六、修复后验证计划

### 6.1 单元测试

每个修复完成后，编写/更新对应的单元测试。

### 6.2 E2E测试验证

修复完成后，重新运行以下E2E测试用例：

```bash
# 运行跨角色业务流程测试
npx playwright test tests/complete-cross-role-flow.spec.ts --headed

# 运行PRD功能验证测试
npx playwright test tests/prd-full-verification.spec.ts --headed

# 运行完整测试套件
npx playwright test --headed
```

### 6.3 验收标准

- 所有E2E测试通过率 ≥ 95%
- P0问题修复率 100%
- P1问题修复率 100%
- 无新增阻塞性问题

---

## 七、文档更新

### 7.1 需要更新的文档

| 文档 | 更新内容 |
|------|----------|
| TASK-LIST.md | 添加E2E问题修复任务 |
| PRD-Feature-Checklist.md | 更新功能验证状态 |
| TESTING-CHECKLIST.md | 添加新测试场景 |
| E2E测试用例 | 更新预期结果 |

### 7.2 更新记录

| 日期 | 文档 | 更新内容 |
|------|------|----------|
| 2026-03-24 | 本文档 | 创建E2E问题修复计划 |

---

**文档维护者:** AI Assistant  
**下次更新:** 问题修复完成后
