# 用户角色管理与信用系统开发任务清单

**创建日期:** 2026-03-23
**项目阶段:** Phase 2-3 进行中
**预计工期:** 4周

---

## 一、任务概览

| 阶段 | 任务数 | 已完成 | 完成率 | 优先级 |
|------|--------|--------|--------|--------|
| Phase 1: 基础架构 | 8 | 8 | 100% | P0 |
| Phase 2: 审批流程 | 5 | 4 | 80% | P0 |
| Phase 3: 信用系统 | 7 | 4 | 57% | P1 |
| Phase 4: 举报系统 | 5 | 0 | 0% | P1 |
| Phase 5: 惩罚系统 | 5 | 0 | 0% | P1 |
| Phase 6: 测试优化 | 4 | 0 | 0% | P2 |
| **总计** | **34** | **16** | **47%** | |

---

## 二、Phase 1: 基础架构 (P0) - ✅ 已完成

### TASK-001: 创建user_role数据模型 - ✅ 已完成
- **文件**: `server/src/models/user/user-role.model.ts`
- **实现内容**:
  - ✅ 支持多角色存储 (job_seeker, hr_recruiter, admin)
  - ✅ 支持角色状态管理 (pending, approved, rejected, frozen)
  - ✅ 支持角色特定数据存储 (skills, experience, company_id等)

### TASK-002: 创建role_approval数据模型 - ✅ 已完成
- **文件**: `server/src/models/user/role-approval.model.ts`
- **实现内容**:
  - ✅ 支持审批状态流转
  - ✅ 支持审批记录查询
  - ✅ 支持过期时间设置

### TASK-003: 修改用户注册流程支持初始角色 - ✅ 已完成
- **文件**: `server/src/controllers/auth.controller.ts`
- **实现内容**:
  - ✅ 注册时自动创建user_role记录
  - ✅ 初始角色状态为approved
  - ✅ 返回角色信息

### TASK-004: 实现角色申请API - ✅ 已完成
- **API**: `POST /api/v1/auth/roles/apply`
- **实现内容**:
  - ✅ 验证用户已有角色
  - ✅ 验证申请角色类型
  - ✅ 创建审批记录

### TASK-005: 实现角色切换API - ✅ 已完成
- **API**: `POST /api/v1/auth/roles/switch`
- **实现内容**:
  - ✅ 验证目标角色已审批
  - ✅ 更新active_role
  - ✅ 返回新角色的权限信息

### TASK-006: 创建身份信息展示组件 - ✅ 已完成
- **文件**: `client/src/components/user/IdentityCard.tsx`
- **实现内容**:
  - ✅ 显示用户所有角色
  - ✅ 显示当前激活角色
  - ✅ 显示角色审批状态

### TASK-007: 创建角色切换组件 - ✅ 已完成
- **文件**: `client/src/components/user/RoleSwitcher.tsx`
- **实现内容**:
  - ✅ 下拉菜单显示角色列表
  - ✅ 支持快速切换角色
  - ✅ 视觉指示当前角色

### TASK-008: 修改导航菜单支持动态角色权限 - ✅ 已完成
- **文件**: `client/src/components/layouts/portal/components/Header/Header.tsx`
- **实现内容**:
  - ✅ 根据当前角色过滤菜单项
  - ✅ 切换角色后菜单自动更新
  - ✅ 无权限菜单项隐藏

---

## 三、Phase 2: 审批流程 (P0) - 🔄 进行中

### TASK-009: 创建管理员审批队列页面 - ✅ 已完成
- **文件**: `client/src/pages/RoleApprovalsPage/RoleApprovalsPage.tsx`
- **实现内容**:
  - ✅ 显示待审批列表
  - ✅ 支持筛选和搜索
  - ✅ 显示申请详情
  - ✅ 支持批准/拒绝操作

### TASK-010: 实现审批API (批准/拒绝) - ✅ 已完成
- **API**: 
  - `PUT /api/v1/admin/role-approvals/:id/approve`
  - `PUT /api/v1/admin/role-approvals/:id/reject`
- **实现内容**:
  - ✅ 更新审批记录状态
  - ✅ 更新用户角色状态
  - ✅ 发送审批结果通知

### TASK-011: 实现审批通知功能 - ✅ 已完成
- **文件**: 
  - `server/src/services/notification.service.ts`
  - `server/src/models/notification/notification.model.ts`
- **实现内容**:
  - ✅ 审批结果通知用户
  - ✅ 通知内容包含详情

### TASK-012: 创建审批记录查询页面 - ✅ 已完成
- **文件**: `client/src/pages/MyRoleApprovalsPage/MyRoleApprovalsPage.tsx`
- **API**: `GET /api/v1/auth/my-role-approvals`
- **实现内容**:
  - ✅ 用户可查看自己的申请记录
  - ✅ 支持按状态筛选
  - ✅ 显示审批人和时间

### TASK-013: 实现审批超时自动关闭 - ⏳ 待处理
- **优先级**: P2 (可后续实现)
- **实现内容**:
  - [ ] 创建定时任务
  - [ ] 7天未审批自动关闭
  - [ ] 发送关闭通知

---

## 四、Phase 3: 信用系统 (P1) - 🔄 进行中

### TASK-014: 创建user_credit数据模型 - ✅ 已完成
- **文件**: 
  - `server/src/models/credit/user-credit.model.ts`
  - `server/src/models/credit/credit-transaction.model.ts`
- **实现内容**:
  - ✅ 支持积分存储
  - ✅ 支持积分历史记录
  - ✅ 支持信用等级 (bronze, silver, gold, platinum)

### TASK-015: 实现积分计算服务 - ✅ 已完成
- **文件**: `server/src/services/credit.service.ts`
- **实现内容**:
  - ✅ 实现积分获取规则
  - ✅ 实现积分扣减规则
  - ✅ 实现信用等级计算

### TASK-016: 创建积分历史记录功能 - ✅ 已完成
- **API**: `GET /api/v1/credits/history`
- **实现内容**:
  - ✅ 支持分页查询
  - ✅ 支持按类型筛选
  - ✅ 显示积分变动原因

### TASK-017: 实现信用等级计算 - ✅ 已完成
- **实现内容**:
  - ✅ 根据积分计算等级
  - ✅ 等级范围: bronze(0-99), silver(100-499), gold(500-999), platinum(1000+)
  - ✅ 积分变动时自动更新等级

### TASK-018: 创建信用展示组件 - ✅ 已完成
- **文件**: 
  - `client/src/components/credit/CreditCard.tsx`
  - `client/src/pages/CreditHistoryPage/CreditHistoryPage.tsx`
- **实现内容**:
  - ✅ 显示积分和等级
  - ✅ 显示等级进度条
  - ✅ 显示等级权益说明

### TASK-019: 实现积分奖励规则 - ⏳ 待处理
- **实现内容**:
  - [ ] 完善档案奖励
  - [ ] 验证邮箱/手机奖励
  - [ ] 完成项目奖励
  - [ ] 收到好评奖励
  - [ ] 举报成功奖励

### TASK-020: 实现积分扣减规则 - ⏳ 待处理
- **实现内容**:
  - [ ] 虚假信息扣分
  - [ ] 逾期付款扣分
  - [ ] 取消项目扣分
  - [ ] 收到差评扣分

---

## 五、Phase 4: 举报系统 (P1) - ⏳ 待处理

### TASK-021: 创建report数据模型
- **优先级**: P1
- **验收标准**:
  - [ ] 创建 `server/src/models/report.model.ts`
  - [ ] 支持多种举报类型
  - [ ] 支持附件存储

### TASK-022: 创建举报提交页面
- **优先级**: P1
- **验收标准**:
  - [ ] 创建 `client/src/pages/ReportPage.tsx`
  - [ ] 选择举报类型
  - [ ] 填写举报描述
  - [ ] 上传证据附件

### TASK-023: 实现举报处理API
- **优先级**: P1
- **验收标准**:
  - [ ] POST /api/v1/reports
  - [ ] PUT /api/v1/admin/reports/:id/verify
  - [ ] PUT /api/v1/admin/reports/:id/dismiss

### TASK-024: 创建管理员举报处理页面
- **优先级**: P1
- **验收标准**:
  - [ ] 创建 `client/src/pages/admin/ReportManagementPage.tsx`
  - [ ] 显示举报列表
  - [ ] 确认/驳回举报

### TASK-025: 实现举报统计功能
- **优先级**: P1
- **验收标准**:
  - [ ] GET /api/v1/admin/reports/stats
  - [ ] 按类型统计
  - [ ] 按时间段统计

---

## 六、Phase 5: 惩罚系统 (P1) - ⏳ 待处理

### TASK-026: 创建punishment数据模型
- **优先级**: P1
- **验收标准**:
  - [ ] 创建 `server/src/models/punishment.model.ts`
  - [ ] 支持多种惩罚类型
  - [ ] 支持惩罚期限

### TASK-027: 实现惩罚执行服务
- **优先级**: P1
- **验收标准**:
  - [ ] 创建 `server/src/services/punishment.service.ts`
  - [ ] 执行积分扣减
  - [ ] 执行功能限制
  - [ ] 执行账户冻结

### TASK-028: 创建惩罚记录页面
- **优先级**: P1
- **验收标准**:
  - [ ] 用户可查看自己的惩罚记录
  - [ ] 管理员可查看所有惩罚记录

### TASK-029: 实现自动惩罚解除
- **优先级**: P1
- **验收标准**:
  - [ ] 创建定时任务
  - [ ] 到期自动解除惩罚
  - [ ] 恢复用户权限

### TASK-030: 实现惩罚通知功能
- **优先级**: P1
- **验收标准**:
  - [ ] 惩罚执行时发送通知
  - [ ] 惩罚解除时发送通知

---

## 七、Phase 6: 测试与优化 (P2) - ⏳ 待处理

### TASK-031: 编写E2E测试用例
- **优先级**: P2
- **验收标准**:
  - [ ] 角色申请流程测试
  - [ ] 角色切换流程测试
  - [ ] 审批流程测试
  - [ ] 积分变动测试

### TASK-032: 性能优化
- **优先级**: P2
- **验收标准**:
  - [ ] API响应时间 < 200ms
  - [ ] 页面加载时间 < 2s
  - [ ] 数据库查询优化

### TASK-033: 安全审计
- **优先级**: P2
- **验收标准**:
  - [ ] 权限验证完整
  - [ ] 数据隔离正确
  - [ ] 无越权漏洞

### TASK-034: 文档完善
- **优先级**: P2
- **验收标准**:
  - [ ] API文档更新
  - [ ] 用户手册更新
  - [ ] 开发文档更新

---

## 八、已创建的文件清单

### 后端文件
| 文件路径 | 描述 |
|----------|------|
| `server/src/models/user/user-role.model.ts` | 用户角色数据模型 |
| `server/src/models/user/role-approval.model.ts` | 角色审批数据模型 |
| `server/src/models/notification/notification.model.ts` | 通知数据模型 |
| `server/src/models/credit/user-credit.model.ts` | 用户积分数据模型 |
| `server/src/models/credit/credit-transaction.model.ts` | 积分交易记录模型 |
| `server/src/services/notification.service.ts` | 通知服务 |
| `server/src/services/credit.service.ts` | 积分服务 |
| `server/src/controllers/credit.controller.ts` | 积分控制器 |
| `server/src/routes/credit.routes.ts` | 积分路由 |

### 前端文件
| 文件路径 | 描述 |
|----------|------|
| `client/src/components/user/IdentityCard.tsx` | 身份信息展示组件 |
| `client/src/components/user/RoleSwitcher.tsx` | 角色切换组件 |
| `client/src/components/credit/CreditCard.tsx` | 积分卡片组件 |
| `client/src/pages/RoleApprovalsPage/` | 管理员审批队列页面 |
| `client/src/pages/MyRoleApprovalsPage/` | 用户审批记录页面 |
| `client/src/pages/CreditHistoryPage/` | 积分历史页面 |

### 修改的文件
| 文件路径 | 修改内容 |
|----------|----------|
| `server/src/controllers/auth.controller.ts` | 添加角色申请、切换、查询API |
| `server/src/controllers/admin.controller.ts` | 添加审批API和通知功能 |
| `server/src/routes/auth.routes.ts` | 添加角色相关路由 |
| `server/src/routes/admin.routes.ts` | 添加审批路由 |
| `server/src/routes/index.ts` | 添加积分路由 |
| `client/src/providers/AuthProvider/AuthProvider.tsx` | 添加角色状态管理 |
| `client/src/interfaces/models/user-account/IUserAccount.ts` | 添加角色接口定义 |
| `client/src/services/auth.service.ts` | 添加角色相关API调用 |
| `client/src/components/layouts/portal/components/Header/Header.tsx` | 动态角色菜单 |
| `client/src/App.tsx` | 添加新页面路由 |

---

**文档维护者:** AI Assistant
**最后更新:** 2026-03-23
