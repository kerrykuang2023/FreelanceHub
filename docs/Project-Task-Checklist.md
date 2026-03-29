# JobPortal 项目改造任务清单

**文档版本:** v1.0  
**创建日期:** 2026-03-28  
**执行模式:** superpower-loop 迭代执行  
**参考文档:** [Project-Adjustment-PRD.md](./Project-Adjustment-PRD.md)

---

## 执行说明

### 执行原则

1. **按阶段顺序执行** - 必须完成上一阶段才能进入下一阶段
2. **每个任务独立验证** - 完成后立即验证，不通过不进入下一个
3. **使用 superpower-loop** - 每次读取一个任务，执行-验证-修复循环
4. **记录问题** - 遇到问题记录到问题清单，解决后继续

### 技能使用矩阵

| 阶段 | 使用技能 | 说明 |
|------|----------|------|
| 阶段0-准备 | 无（手动执行） | 环境验证和分支创建 |
| 阶段1-后端 | `superdev` | API 开发，有架构师和安全专家保障 |
| 阶段2-前端 | `superdev` | UI 开发，遵循设计规范 |
| 阶段3-E2E | `playwright` | 端到端测试验证 |
| 阶段4-质量 | `superdev` quality | 安全审计和性能检查 |
| 问题修复 | `superpower-loop` | 自动化 Red/Green 循环 |

---

## 阶段0：准备工作

### 任务 P0-001：验证现有服务运行状态

**优先级:** P0 - 高  
**技能:** 无（手动执行）  
**预计耗时:** 15分钟

**任务描述:**
验证 MongoDB、后端服务、前端服务是否正常运行。

**执行步骤:**
```powershell
# 1. 检查 MongoDB
docker ps | findstr mongo

# 2. 检查后端服务（端口 5555）
netstat -ano | findstr "5555"

# 3. 检查前端服务（端口 5137）
netstat -ano | findstr "5137"

# 4. 如果服务未运行，启动服务
# 启动 MongoDB
docker start job-portal-mongo

# 启动后端（新终端）
cd JobPortal/server && npm run dev

# 启动前端（新终端）
cd JobPortal/client && npm run dev
```

**验收标准:**
- [ ] MongoDB 运行正常（docker ps 显示 mongo 容器）
- [ ] 后端服务运行正常（http://localhost:5555 可访问）
- [ ] 前端服务运行正常（http://localhost:5137 可访问）
- [ ] 测试用户可登录（admin@test.com / Test123456!）

**输出物:**
- 服务运行状态报告

---

### 任务 P0-002：创建功能分支

**优先级:** P0 - 高  
**技能:** 无（手动执行）  
**预计耗时:** 5分钟

**任务描述:**
创建 Git 功能分支，用于隔离开发。

**执行步骤:**
```powershell
# 1. 确保在主分支
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/project-assignment

# 3. 推送到远程
git push -u origin feature/project-assignment
```

**验收标准:**
- [ ] 功能分支创建成功
- [ ] 分支已推送到远程

**输出物:**
- Git 分支: feature/project-assignment

---

## 阶段1：后端 API 开发

### 任务 P1-001：Assignment API 开发

**优先级:** P0 - 高  
**技能:** `superdev`  
**预计耗时:** 1天

**任务描述:**
开发项目子项（ProjectAssignment）的完整 API，包括 CRUD 和状态流转。

**API 端点:**
```
POST   /api/v1/assignments          - 创建项目子项
GET    /api/v1/assignments          - 获取项目子项列表
GET    /api/v1/assignments/:id      - 获取项目子项详情
PUT    /api/v1/assignments/:id      - 更新项目子项
PUT    /api/v1/assignments/:id/confirm - 顾问确认
PUT    /api/v1/assignments/:id/start - 开始项目
PUT    /api/v1/assignments/:id/complete - 完成项目
PUT    /api/v1/assignments/:id/terminate - 终止项目
```

**数据模型:** 已存在 `ProjectAssignment` 模型

**权限控制:**
- 创建: HR、企业管理员、系统管理员
- 查看: HR 可见所有，顾问仅可见自己
- 确认: 仅对应顾问
- 状态变更: HR 或管理员

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定从 backend 阶段开始
3. 提供任务描述：开发 Assignment API
4. 等待生成代码
5. 验证 API 功能

**验收标准:**
- [ ] 所有 API 端点响应正确
- [ ] 权限控制正确
- [ ] 数据验证完整
- [ ] 错误处理完善
- [ ] API 文档更新

**输出物:**
- `server/src/routes/assignment.routes.ts`
- `server/src/controllers/assignment.controller.ts`
- `server/src/services/assignment.service.ts`
- `server/src/middlewares/assignment.middleware.ts`

---

### 任务 P1-002：WorkOrder API 开发

**优先级:** P0 - 高  
**技能:** `superdev`  
**预计耗时:** 1天

**任务描述:**
开发工单（WorkOrder）的完整 API，包括 CRUD、状态流转和付款流程。

**API 端点:**
```
POST   /api/v1/work-orders          - 创建工单
GET    /api/v1/work-orders          - 获取工单列表
GET    /api/v1/work-orders/:id      - 获取工单详情
PUT    /api/v1/work-orders/:id      - 更新工单
PUT    /api/v1/work-orders/:id/submit - 提交审批
PUT    /api/v1/work-orders/:id/approve - HR审批通过
PUT    /api/v1/work-orders/:id/reject - HR审批驳回
PUT    /api/v1/work-orders/:id/request-payment - 申请付款
PUT    /api/v1/work-orders/:id/confirm-payment - 确认付款
PUT    /api/v1/work-orders/:id/complete - 确认收款
POST   /api/v1/work-orders/:id/dispute - 提交异议
PUT    /api/v1/work-orders/:id/resolve-dispute - 解决异议
```

**数据模型:** 已存在 `WorkOrder` 模型

**权限控制:**
- 创建: 仅顾问
- 查看: HR 可见所有，顾问仅可见自己
- 审批: HR、企业管理员、系统管理员
- 异议处理: 仅系统管理员

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定从 backend 阶段开始
3. 提供任务描述：开发 WorkOrder API
4. 等待生成代码
5. 验证 API 功能

**验收标准:**
- [ ] 所有 API 端点响应正确
- [ ] 状态流转正确（draft → submitted → approved → payment_pending → paid → completed）
- [ ] 权限控制正确
- [ ] 异议处理流程完整
- [ ] API 文档更新

**输出物:**
- `server/src/routes/work-order.routes.ts`
- `server/src/controllers/work-order.controller.ts`
- `server/src/services/work-order.service.ts`
- `server/src/middlewares/work-order.middleware.ts`

---

### 任务 P1-003：结算单价快照逻辑实现

**优先级:** P0 - 高  
**技能:** `superdev`  
**预计耗时:** 2小时

**任务描述:**
实现工单创建时的结算单价快照逻辑，确保付款金额准确。

**业务规则:**
1. 工单创建时，从 Assignment 读取结算信息
2. 将结算信息复制到 WorkOrder.settlement_snapshot
3. 快照信息不可修改
4. 金额计算基于快照信息

**计算逻辑:**
```typescript
// 按天数计费
if (billing_method === 'by_days') {
  amount = work_days * rate_amount;
}
// 按工时计费
else if (billing_method === 'by_hours') {
  amount = work_hours * rate_amount;
}
// 固定价格
else if (billing_method === 'fixed') {
  amount = milestone_payment_amount;
}
```

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定修改 WorkOrder service
3. 实现快照逻辑和金额计算

**验收标准:**
- [ ] 工单创建时正确复制结算信息
- [ ] 快照信息不可修改
- [ ] 金额计算正确
- [ ] Assignment 结算信息变更不影响已创建工单

**输出物:**
- 更新的 `work-order.service.ts`

---

### 任务 P1-004：API 单元测试编写

**优先级:** P0 - 高  
**技能:** `superdev`  
**预计耗时:** 4小时

**任务描述:**
为 Assignment 和 WorkOrder API 编写单元测试。

**测试覆盖:**
- Assignment CRUD 测试
- Assignment 状态流转测试
- WorkOrder CRUD 测试
- WorkOrder 状态流转测试
- 结算单价快照测试
- 权限控制测试

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定 quality 阶段
3. 生成测试用例

**验收标准:**
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试通过
- [ ] 边界条件覆盖

**输出物:**
- `server/src/__tests__/assignment.test.ts`
- `server/src/__tests__/work-order.test.ts`

---

## 阶段2：前端页面开发

### 任务 P2-001：HR项目子项管理页面

**优先级:** P0 - 高  
**技能:** `superdev`  
**预计耗时:** 1天

**任务描述:**
开发 HR 项目子项管理页面，包括创建、查看、管理项目子项。

**页面功能:**
1. 项目子项列表
   - 显示项目下所有子项
   - 显示顾问信息、结算信息、状态
   - 支持筛选和排序

2. 创建项目子项
   - 选择顾问
   - 设置结算信息（类型、单价、周期）
   - 设置里程碑
   - 设置项目时间

3. 项目子项详情
   - 显示完整信息
   - 显示里程碑进度
   - 显示工单列表
   - 显示付款记录

**路由:**
- `/hr/projects/:id/assignments` - 子项列表
- `/hr/projects/:id/assignments/create` - 创建子项
- `/hr/projects/:id/assignments/:assignmentId` - 子项详情

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定 frontend 阶段
3. 提供页面设计描述
4. 遵循现有设计规范（design-tokens.ts）

**验收标准:**
- [ ] 页面布局符合设计规范
- [ ] 表单验证完整
- [ ] API 调用正确
- [ ] 错误处理完善
- [ ] 响应式设计

**输出物:**
- `client/src/pages/hr/ProjectAssignmentsPage.tsx`
- `client/src/pages/hr/CreateAssignmentPage.tsx`
- `client/src/pages/hr/AssignmentDetailPage.tsx`
- `client/src/components/assignment/*.tsx`

---

### 任务 P2-002：顾问工单管理页面

**优先级:** P0 - 高  
**技能:** `superdev`  
**预计耗时:** 1天

**任务描述:**
开发顾问工单管理页面，包括创建、查看、管理工单。

**页面功能:**
1. 工单列表
   - 显示所有工单
   - 按状态筛选
   - 显示付款状态

2. 创建工单
   - 选择项目子项
   - 选择里程碑
   - 填写工作信息
   - 自动计算金额（只读）
   - 上传交付物

3. 工单详情
   - 显示完整信息
   - 显示审批状态
   - 显示付款信息
   - 异议处理入口

**路由:**
- `/freelancer/work-orders` - 工单列表
- `/freelancer/work-orders/create` - 创建工单
- `/freelancer/work-orders/:id` - 工单详情

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定 frontend 阶段
3. 提供页面设计描述
4. 遵循现有设计规范

**验收标准:**
- [ ] 页面布局符合设计规范
- [ ] 金额自动计算正确
- [ ] 结算单价只读
- [ ] 状态流转正确
- [ ] 响应式设计

**输出物:**
- `client/src/pages/freelancer/WorkOrdersPage.tsx`
- `client/src/pages/freelancer/CreateWorkOrderPage.tsx`
- `client/src/pages/freelancer/WorkOrderDetailPage.tsx`
- `client/src/components/work-order/*.tsx`

---

### 任务 P2-003：顾问状态管理页面

**优先级:** P1 - 中  
**技能:** `superdev`  
**预计耗时:** 4小时

**任务描述:**
开发顾问状态管理页面，允许顾问设置可接单状态。

**页面功能:**
1. 状态选择
   - 可接单
   - 项目中
   - 即将空闲（含日期）

2. 预计空闲日期设置
   - 日历选择
   - 仅"即将空闲"状态需要

**路由:**
- `/freelancer/status` - 状态管理

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定 frontend 阶段
3. 提供页面设计描述

**验收标准:**
- [ ] 状态切换正常
- [ ] 日期选择正常
- [ ] 保存成功

**输出物:**
- `client/src/pages/freelancer/StatusManagementPage.tsx`

---

### 任务 P2-004：菜单结构调整

**优先级:** P0 - 高  
**技能:** `superdev`  
**预计耗时:** 2小时

**任务描述:**
调整前端菜单结构，按新架构组织菜单。

**菜单结构:**
```
顾问菜单:
├── 工作台首页
├── 我的项目
├── 工单管理
├── 收款管理
├── 状态管理
└── 个人中心

HR菜单:
├── 工作台首页
├── 项目管理
├── 人才管理
├── 工单审批
├── 付款管理
└── 公司管理
```

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定 frontend 阶段
3. 修改菜单配置文件

**验收标准:**
- [ ] 菜单结构正确
- [ ] 权限控制正确
- [ ] 路由跳转正常

**输出物:**
- 更新的菜单配置文件
- 更新的路由配置

---

## 阶段3：E2E 测试验证

### 任务 P3-001：核心流程测试

**优先级:** P0 - 高  
**技能:** `playwright`  
**预计耗时:** 4小时

**任务描述:**
使用 Playwright 进行核心业务流程的端到端测试。

**测试场景:**
1. HR 创建项目子项流程
   - HR 登录
   - 进入项目详情
   - 创建项目子项
   - 设置结算信息
   - 设置里程碑
   - 验证创建成功

2. 顾问确认项目子项流程
   - 顾问登录
   - 查看项目子项详情
   - 确认接受
   - 验证状态变更

3. 顾问提交工单流程
   - 顾问登录
   - 创建工单
   - 填写工作信息
   - 验证金额计算
   - 提交审批

4. HR 审批工单流程
   - HR 登录
   - 查看待审批工单
   - 审批通过
   - 验证状态变更

**执行步骤（使用 playwright）:**
1. 调用 `playwright` 技能
2. 编写测试用例
3. 执行测试
4. 记录问题

**验收标准:**
- [ ] 所有测试场景通过
- [ ] 无控制台错误
- [ ] 数据验证正确

**输出物:**
- `e2e-tests/assignment-flow.spec.ts`
- `e2e-tests/work-order-flow.spec.ts`

---

### 任务 P3-002：跨角色场景测试

**优先级:** P0 - 高  
**技能:** `playwright`  
**预计耗时:** 4小时

**任务描述:**
测试跨角色的业务场景，确保角色间协作正确。

**测试场景:**
1. 完整项目流程
   - HR 创建项目
   - HR 创建项目子项
   - 顾问确认
   - 顾问提交工单
   - HR 审批
   - 顾问申请付款
   - HR 确认付款
   - 顾问确认收款
   - 项目完成

2. 异议处理流程
   - 顾问提交工单
   - HR 驳回
   - 顾问提交异议
   - 管理员处理异议
   - 流程继续

**执行步骤（使用 playwright）:**
1. 调用 `playwright` 技能
2. 编写跨角色测试
3. 执行测试
4. 验证数据一致性

**验收标准:**
- [ ] 跨角色流程完整
- [ ] 数据一致性正确
- [ ] 通知发送正确

**输出物:**
- `e2e-tests/cross-role-flow.spec.ts`

---

### 任务 P3-003：数据一致性验证

**优先级:** P0 - 高  
**技能:** `playwright`  
**预计耗时:** 2小时

**任务描述:**
验证系统数据一致性，确保三单匹配正确。

**验证点:**
1. 结算单价一致性
   - 工单单价 = Assignment 单价（创建时）

2. 金额一致性
   - 工单金额 = 工时 × 单价

3. 统计一致性
   - Assignment 总金额 = SUM(工单金额)

4. 状态一致性
   - 顾问状态 = Assignment 状态映射

**执行步骤（使用 playwright）:**
1. 调用 `playwright` 技能
2. 编写数据验证测试
3. 执行测试

**验收标准:**
- [ ] 所有验证点通过
- [ ] 数据一致性正确

**输出物:**
- `e2e-tests/data-consistency.spec.ts`

---

## 阶段4：质量保障

### 任务 P4-001：安全审计与性能检查

**优先级:** P1 - 中  
**技能:** `superdev` quality  
**预计耗时:** 4小时

**任务描述:**
进行安全审计和性能检查。

**检查项:**
1. 安全审计
   - SQL 注入检查
   - XSS 检查
   - CSRF 检查
   - 权限控制检查
   - 敏感数据保护

2. 性能检查
   - API 响应时间
   - 数据库查询优化
   - 前端加载时间

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定 quality 阶段
3. 执行检查
4. 修复问题

**验收标准:**
- [ ] 无安全漏洞
- [ ] API 响应时间 < 500ms
- [ ] 页面加载时间 < 3s

**输出物:**
- 安全审计报告
- 性能检查报告

---

### 任务 P4-002：代码审查与优化

**优先级:** P1 - 中  
**技能:** `superdev`  
**预计耗时:** 4小时

**任务描述:**
进行代码审查和优化。

**检查项:**
1. 代码质量
   - 代码规范
   - 注释完整
   - 命名规范

2. 架构检查
   - 模块划分
   - 依赖关系
   - 复用性

**执行步骤（使用 superdev）:**
1. 调用 `superdev` 技能
2. 指定 quality 阶段
3. 执行检查
4. 优化代码

**验收标准:**
- [ ] 代码质量评分 > 90
- [ ] 无重复代码
- [ ] 架构清晰

**输出物:**
- 代码审查报告
- 优化后的代码

---

## 执行流程

### superpower-loop 执行模式

```
┌─────────────────────────────────────────────────────────────────┐
│                    superpower-loop 执行流程                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 读取任务清单中的下一个待执行任务                              │
│     │                                                           │
│     ▼                                                           │
│  2. 根据任务类型调用相应技能                                     │
│     ├── 后端任务 → superdev (backend)                           │
│     ├── 前端任务 → superdev (frontend)                          │
│     └── 测试任务 → playwright                                   │
│     │                                                           │
│     ▼                                                           │
│  3. 执行任务                                                    │
│     │                                                           │
│     ▼                                                           │
│  4. 验证验收标准                                                │
│     ├── 通过 → 标记任务完成，进入下一个                          │
│     └── 失败 → 记录问题，使用 superpower-loop 修复               │
│     │                                                           │
│     ▼                                                           │
│  5. 所有任务完成 → 项目交付                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 问题处理流程

```
发现问题
    │
    ▼
记录到问题清单
    │
    ▼
使用 superpower-loop 修复
    │
    ├── Red Agent 编写失败测试
    │
    ├── Green Agent 实现修复
    │
    ▼
验证修复结果
    │
    ├── 通过 → 关闭问题，继续任务
    │
    └── 失败 → 重新修复
```

---

## 任务状态跟踪

| 任务ID | 任务名称 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|----------|------|----------|----------|------|
| P0-001 | 验证服务状态 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 服务运行正常 |
| P0-002 | 创建功能分支 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 分支已创建 |
| P1-001 | Assignment API | ✅ 已完成 | 2026-03-28 | 2026-03-28 | API开发完成 |
| P1-002 | WorkOrder API | ✅ 已完成 | 2026-03-28 | 2026-03-28 | API开发完成 |
| P1-003 | 结算单价快照 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 快照逻辑已实现 |
| P1-004 | API 单元测试 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 测试文件已创建 |
| P2-001 | HR项目子项页面 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 页面开发完成 |
| P2-002 | 顾问工单页面 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 页面开发完成 |
| P2-003 | 状态管理页面 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 页面开发完成 |
| P2-004 | 菜单结构调整 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 菜单已更新 |
| P3-001 | 核心流程测试 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | E2E测试文件已创建 |
| P3-002 | 跨角色场景测试 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 包含在E2E测试中 |
| P3-003 | 数据一致性验证 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 包含在E2E测试中 |
| P4-001 | 安全审计检查 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 安全审计报告已生成 |
| P4-002 | 代码审查优化 | ✅ 已完成 | 2026-03-28 | 2026-03-28 | 代码审查完成 |

**状态说明:**
- ⏳ 待执行
- 🔄 进行中
- ✅ 已完成
- ❌ 已阻塞
- ⏸️ 已暂停

---

## 问题清单

| 问题ID | 关联任务 | 问题描述 | 状态 | 解决方案 | 解决时间 |
|--------|----------|----------|------|----------|----------|
| - | - | - | - | - | - |

---

**文档版本:** v1.0  
**最后更新:** 2026-03-28  
**维护者:** AI Assistant
