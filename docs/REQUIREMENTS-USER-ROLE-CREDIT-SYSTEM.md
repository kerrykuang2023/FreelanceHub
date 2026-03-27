# 用户角色管理与信用体系需求规格

**文档版本:** v1.0  
**创建日期:** 2026-03-23  
**文档状态:** 需求分析  
**需求方法:** EARS (Easy Acceptance Requirement Statement)

---

## 一、需求背景

### 1.1 业务痛点

| 痛点 | 描述 | 影响 |
|------|------|------|
| 身份信息不清晰 | 用户注册后无法清楚看到自己的身份信息 | 用户困惑，体验差 |
| 角色单一 | 一个用户只能有一个角色，无法同时作为HR和求职者 | 限制用户灵活性 |
| 角色切换无序 | 缺乏角色切换的审批机制 | 身份滥用风险 |
| 缺乏信用体系 | 无法区分真实用户和虚假用户 | 平台信任度低 |
| 虚假信息泛滥 | 缺乏有效的惩罚机制 | 平台质量下降 |

### 1.2 需求目标

| 目标 | 描述 | 衡量指标 |
|------|------|----------|
| 身份可视化 | 用户能清楚看到自己的所有身份信息 | 用户满意度 > 90% |
| 角色灵活切换 | 用户可申请多个角色并切换使用 | 角色切换成功率 > 95% |
| 审批可控 | 角色切换需管理员审批 | 审批通过率 > 80% |
| 信用可量化 | 建立积分信用体系 | 信用覆盖率 100% |
| 违规可惩罚 | 建立举报和惩罚机制 | 虚假信息率 < 5% |

---

## 二、功能模块设计

### 2.1 模块总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        用户角色管理与信用体系架构                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  1. 身份信息展示   │    │  2. 角色切换管理   │    │  3. 角色审批流程   │
│  - 身份卡片       │    │  - 角色申请       │    │  - 审批队列       │
│  - 角色标识       │    │  - 角色切换       │    │  - 审批操作       │
│  - 权限说明       │    │  - 信息补充       │    │  - 审批通知       │
└──────────────────┘    └──────────────────┘    └──────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                                   ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  4. 积分信用系统   │    │  5. 举报管理机制   │    │  6. 惩罚执行系统   │
│  - 积分获取       │    │  - 举报提交       │    │  - 权限限制       │
│  - 积分消耗       │    │  - 举报处理       │    │  - 积分扣减       │
│  - 信用评级       │    │  - 举报统计       │    │  - 警告通知       │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 三、EARS需求详述

### 3.1 用户身份信息展示需求

#### 3.1.1 通用需求 (Ubiquitous)

```markdown
REQ-ID: REQ-ID-001
类型: 通用需求
优先级: P0

THE SYSTEM SHALL ALWAYS display the user's current active role in the header section of every page.

验收标准:
- 用户头像旁显示当前角色标识
- 角色标识使用不同颜色区分
- 鼠标悬停显示角色完整名称
```

```markdown
REQ-ID: REQ-ID-002
类型: 通用需求
优先级: P0

THE SYSTEM SHALL ALWAYS display a user identity card on the user's profile page showing:
- User's registered roles
- Current active role
- Role approval status
- Credit score and level

验收标准:
- 身份卡片位于档案页面顶部
- 显示所有已注册角色及状态
- 显示当前激活角色
- 显示信用积分和等级
```

#### 3.1.2 事件驱动需求 (Event-Driven)

```markdown
REQ-ID: REQ-ID-003
类型: 事件驱动需求
优先级: P0

WHEN the user logs in successfully, THE SYSTEM SHALL display a welcome message with the user's current active role name.

验收标准:
- 登录成功后显示 "欢迎回来，[角色名称] [用户名]"
- 如果用户有多个角色，显示当前激活角色
- 消息显示3秒后自动消失
```

```markdown
REQ-ID: REQ-ID-004
类型: 事件驱动需求
优先级: P1

WHEN the user clicks on the role indicator in the header, THE SYSTEM SHALL display a dropdown menu showing all available roles for the user.

验收标准:
- 下拉菜单显示所有已注册角色
- 当前激活角色有选中标记
- 显示每个角色的审批状态
- 未审批角色显示"审批中"标签
```

#### 3.1.3 状态驱动需求 (State-Driven)

```markdown
REQ-ID: REQ-ID-005
类型: 状态驱动需求
优先级: P0

WHEN the user has multiple approved roles, THE SYSTEM SHALL display a role switcher component in the header.

验收标准:
- 角色切换器始终可见
- 显示当前激活角色图标
- 点击可展开角色列表
- 支持快速切换角色
```

```markdown
REQ-ID: REQ-ID-006
类型: 状态驱动需求
优先级: P1

WHEN the user has pending role approval requests, THE SYSTEM SHALL display a notification badge on the profile icon.

验收标准:
- 显示待审批数量
- 点击可查看审批详情
- 审批通过后自动更新状态
```

---

### 3.2 角色切换管理需求

#### 3.2.1 通用需求 (Ubiquitous)

```markdown
REQ-ID: REQ-RS-001
类型: 通用需求
优先级: P0

THE SYSTEM SHALL ALWAYS allow users to apply for additional roles beyond their initial registered role.

验收标准:
- 用户档案页面有"申请新角色"入口
- 显示可申请的角色列表
- 已申请的角色显示状态
```

```markdown
REQ-ID: REQ-RS-002
类型: 通用需求
优先级: P0

THE SYSTEM SHALL ALWAYS store user's role information separately for each role they possess.

验收标准:
- 求职者角色信息：技能、经历、期望薪资
- HR角色信息：公司信息、招聘需求
- 信息按角色隔离存储
- 切换角色时加载对应信息
```

#### 3.2.2 事件驱动需求 (Event-Driven)

```markdown
REQ-ID: REQ-RS-003
类型: 事件驱动需求
优先级: P0

WHEN the user applies for a new role, THE SYSTEM SHALL display a role-specific information form that must be completed.

验收标准:
- 申请求职者角色：显示技能信息表单
- 申请HR角色：显示公司信息表单
- 表单字段根据角色类型动态生成
- 必填字段标记星号
```

```markdown
REQ-ID: REQ-RS-004
类型: 事件驱动需求
优先级: P0

WHEN the user submits a role application, THE SYSTEM SHALL:
1. Save the application with status "pending"
2. Send notification to administrators
3. Display confirmation message to the user

验收标准:
- 申请状态保存为"pending"
- 管理员收到新申请通知
- 用户看到"申请已提交，等待审批"提示
```

```markdown
REQ-ID: REQ-RS-005
类型: 事件驱动需求
优先级: P0

WHEN the user switches to a different approved role, THE SYSTEM SHALL:
1. Update the user's active role in session
2. Redirect to the appropriate dashboard for that role
3. Update the navigation menu based on role permissions

验收标准:
- Session中更新active_role
- 跳转到对应角色的Dashboard
- 导航菜单显示该角色的功能项
- 页面内容基于新角色刷新
```

#### 3.2.3 可选需求 (Optional)

```markdown
REQ-ID: REQ-RS-006
类型: 可选需求
优先级: P1

WHERE the user has both "job_seeker" and "hr_recruiter" roles approved, THE SYSTEM SHALL allow the user to quickly switch between these roles without re-authentication.

验收标准:
- 切换角色无需重新登录
- 切换后立即生效
- 保持用户登录状态
```

```markdown
REQ-ID: REQ-RS-007
类型: 可选需求
优先级: P2

WHERE the user's role has been rejected, THE SYSTEM SHALL allow the user to re-apply after addressing the rejection reasons.

验收标准:
- 显示拒绝原因
- 提供重新申请入口
- 重新申请需等待7天冷却期
```

#### 3.2.4 禁止行为 (Unwanted Behavior)

```markdown
REQ-ID: REQ-RS-008
类型: 禁止行为
优先级: P0

THE SYSTEM SHALL NOT allow users to use features of a role that is not approved or active.

验收标准:
- 未审批角色功能不可访问
- 访问时提示"角色未审批"
- 不显示未授权功能的入口
```

```markdown
REQ-ID: REQ-RS-009
类型: 禁止行为
优先级: P0

THE SYSTEM SHALL NOT allow users to switch roles more than 5 times within 1 hour.

验收标准:
- 记录角色切换次数
- 超过限制时显示提示
- 1小时后重置计数
```

---

### 3.3 角色审批流程需求

#### 3.3.1 通用需求 (Ubiquitous)

```markdown
REQ-ID: REQ-RA-001
类型: 通用需求
优先级: P0

THE SYSTEM SHALL ALWAYS require administrator approval for any role change request.

验收标准:
- 所有角色变更需审批
- 无自动审批机制
- 审批记录可追溯
```

```markdown
REQ-ID: REQ-RA-002
类型: 通用需求
优先级: P0

THE SYSTEM SHALL ALWAYS maintain an audit log of all role approval activities including:
- Applicant information
- Submitted information
- Approver information
- Approval/rejection reason
- Timestamp

验收标准:
- 每条审批记录完整
- 记录不可删除
- 支持按时间、用户查询
```

#### 3.3.2 事件驱动需求 (Event-Driven)

```markdown
REQ-ID: REQ-RA-003
类型: 事件驱动需求
优先级: P0

WHEN a new role application is submitted, THE SYSTEM SHALL:
1. Create a pending approval record
2. Add to administrator's approval queue
3. Send notification to all administrators
4. Set application expiration to 7 days

验收标准:
- 审批记录创建成功
- 管理员队列显示新申请
- 通知发送成功
- 7天后未审批自动关闭
```

```markdown
REQ-ID: REQ-RA-004
类型: 事件驱动需求
优先级: P0

WHEN an administrator approves a role application, THE SYSTEM SHALL:
1. Update user's role list
2. Set the new role status to "approved"
3. Send approval notification to the user
4. Award initial credit points for the new role

验收标准:
- 用户角色列表更新
- 角色状态变为"approved"
- 用户收到审批通过通知
- 获得50积分奖励
```

```markdown
REQ-ID: REQ-RA-005
类型: 事件驱动需求
优先级: P0

WHEN an administrator rejects a role application, THE SYSTEM SHALL:
1. Update application status to "rejected"
2. Record the rejection reason
3. Send rejection notification with reason to the user
4. Allow user to view and address the rejection

验收标准:
- 申请状态更新为"rejected"
- 拒绝原因记录完整
- 用户收到拒绝通知
- 用户可查看拒绝详情
```

#### 3.3.3 状态驱动需求 (State-Driven)

```markdown
REQ-ID: REQ-RA-006
类型: 状态驱动需求
优先级: P0

WHEN the approval queue has pending applications, THE SYSTEM SHALL display them in chronological order with:
- Applicant name and email
- Requested role
- Submission time
- Current status
- Quick action buttons

验收标准:
- 按提交时间排序
- 显示完整申请信息
- 提供批准/拒绝按钮
- 支持批量操作
```

```markdown
REQ-ID: REQ-RA-007
类型: 状态驱动需求
优先级: P1

WHEN an application has been pending for more than 3 days, THE SYSTEM SHALL send a reminder to administrators.

验收标准:
- 3天后发送提醒
- 提醒包含申请详情
- 支持配置提醒间隔
```

---

### 3.4 积分信用系统需求

#### 3.4.1 通用需求 (Ubiquitous)

```markdown
REQ-ID: REQ-CP-001
类型: 通用需求
优先级: P1

THE SYSTEM SHALL ALWAYS maintain a credit score for each user account based on:
- Activity level
- Information completeness
- Transaction history
- User feedback
- Violation records

验收标准:
- 每个用户有独立信用分
- 信用分范围: 0-1000
- 初始分数: 500
- 实时更新信用分
```

```markdown
REQ-ID: REQ-CP-002
类型: 通用需求
优先级: P1

THE SYSTEM SHALL ALWAYS display the user's credit level with a visual indicator:
- Level 1 (0-200): Warning - Limited features
- Level 2 (201-400): Caution - Some restrictions
- Level 3 (401-600): Normal - Full features
- Level 4 (601-800): Good - Priority support
- Level 5 (801-1000): Excellent - Premium benefits

验收标准:
- 信用等级可视化显示
- 不同等级使用不同颜色
- 显示等级对应权益说明
```

#### 3.4.2 事件驱动需求 (Event-Driven)

```markdown
REQ-ID: REQ-CP-003
类型: 事件驱动需求
优先级: P1

WHEN the user completes any of the following actions, THE SYSTEM SHALL award credit points:
- Complete profile: +50 points
- Verify email: +20 points
- Verify phone: +30 points
- Complete first project: +100 points
- Receive positive feedback: +20 points per feedback
- Report verified violation: +30 points
- Role application approved: +50 points

验收标准:
- 积分实时到账
- 显示积分变动通知
- 积分记录可查询
```

```markdown
REQ-ID: REQ-CP-004
类型: 事件驱动需求
优先级: P1

WHEN the user's credit score drops below 200, THE SYSTEM SHALL:
1. Restrict user from posting new projects
2. Restrict user from applying for projects
3. Send warning notification
4. Require identity verification to restore

验收标准:
- 功能限制生效
- 用户收到警告
- 显示恢复方法
```

```markdown
REQ-ID: REQ-CP-005
类型: 事件驱动需求
优先级: P1

WHEN the user's credit score drops to 0, THE SYSTEM SHALL:
1. Suspend the user account
2. Send suspension notification
3. Require administrator review for reinstatement

验收标准:
- 账户立即冻结
- 通知发送成功
- 需管理员解封
```

#### 3.4.3 积分扣减规则

```markdown
REQ-ID: REQ-CP-006
类型: 事件驱动需求
优先级: P1

WHEN the user commits any of the following violations, THE SYSTEM SHALL deduct credit points:
- Reported for false information (verified): -100 points
- Late payment: -30 points
- Cancel project without notice: -50 points
- Receive negative feedback: -20 points
- Ignore project deadline: -40 points
- Multiple account detected: -200 points
- Spam or harassment: -150 points

验收标准:
- 违规确认后扣分
- 显示扣分原因
- 记录扣分历史
```

---

### 3.5 举报管理机制需求

#### 3.5.1 通用需求 (Ubiquitous)

```markdown
REQ-ID: REQ-RP-001
类型: 通用需求
优先级: P1

THE SYSTEM SHALL ALWAYS allow users to report:
- False project information
- False profile information
- Fraudulent behavior
- Harassment or spam
- Payment issues
- Other violations

验收标准:
- 每个用户/项目有举报入口
- 举报类型分类清晰
- 支持上传证据附件
```

```markdown
REQ-ID: REQ-RP-002
类型: 通用需求
优先级: P1

THE SYSTEM SHALL ALWAYS protect the identity of reporters from the reported user.

验收标准:
- 举报者信息加密存储
- 被举报者无法查看举报者
- 管理员可查看完整信息
```

#### 3.5.2 事件驱动需求 (Event-Driven)

```markdown
REQ-ID: REQ-RP-003
类型: 事件驱动需求
优先级: P1

WHEN a user submits a report, THE SYSTEM SHALL:
1. Create a report record with status "pending"
2. Send confirmation to the reporter
3. Notify administrators
4. Set investigation deadline to 3 days

验收标准:
- 举报记录创建成功
- 举报者收到确认
- 管理员收到通知
- 3天内必须处理
```

```markdown
REQ-ID: REQ-RP-004
类型: 事件驱动需求
优先级: P1

WHEN a report is verified as valid, THE SYSTEM SHALL:
1. Apply penalty to the reported user
2. Award points to the reporter
3. Send notification to both parties
4. Update report status to "verified"

验收标准:
- 惩罚措施执行
- 举报者获得积分
- 双方收到通知
- 状态更新完成
```

```markdown
REQ-ID: REQ-RP-005
类型: 事件驱动需求
优先级: P2

WHEN a report is determined to be false, THE SYSTEM SHALL:
1. Dismiss the report
2. Optionally penalize the reporter for false reporting
3. Send notification to both parties
4. Update report status to "dismissed"

验收标准:
- 举报被驳回
- 恶意举报者扣分
- 双方收到通知
- 状态更新完成
```

#### 3.5.3 禁止行为 (Unwanted Behavior)

```markdown
REQ-ID: REQ-RP-006
类型: 禁止行为
优先级: P1

THE SYSTEM SHALL NOT allow users to submit more than 5 reports per day to prevent abuse.

验收标准:
- 每日举报次数限制
- 超过限制显示提示
- 次日重置计数
```

```markdown
REQ-ID: REQ-RP-007
类型: 禁止行为
优先级: P1

THE SYSTEM SHALL NOT allow users to report the same target for the same reason multiple times.

验收标准:
- 检测重复举报
- 显示"已举报"状态
- 合并相同举报
```

---

### 3.6 惩罚执行系统需求

#### 3.6.1 通用需求 (Ubiquitous)

```markdown
REQ-ID: REQ-PN-001
类型: 通用需求
优先级: P1

THE SYSTEM SHALL ALWAYS maintain a punishment record for each user including:
- Violation type
- Penalty applied
- Effective period
- Current status

验收标准:
- 惩罚记录完整
- 记录不可删除
- 支持历史查询
```

#### 3.6.2 事件驱动需求 (Event-Driven)

```markdown
REQ-ID: REQ-PN-002
类型: 事件驱动需求
优先级: P1

WHEN a penalty is applied to a user, THE SYSTEM SHALL:
1. Execute the penalty immediately
2. Send notification via email and in-app message
3. Display warning banner on user's dashboard
4. Log the penalty in user's record

验收标准:
- 惩罚立即生效
- 邮件和站内信发送
- Dashboard显示警告
- 记录保存成功
```

```markdown
REQ-ID: REQ-PN-003
类型: 事件驱动需求
优先级: P1

WHEN a temporary penalty expires, THE SYSTEM SHALL:
1. Automatically restore user's permissions
2. Send restoration notification
3. Update penalty status to "expired"
4. Remove warning banner

验收标准:
- 权限自动恢复
- 通知发送成功
- 状态更新完成
- 警告横幅消失
```

#### 3.6.3 惩罚类型定义

| 惩罚类型 | 描述 | 触发条件 | 持续时间 |
|----------|------|----------|----------|
| 警告 | 仅通知，无功能限制 | 首次轻微违规 | 永久记录 |
| 积分扣减 | 扣除信用积分 | 违规行为 | 永久 |
| 功能限制 | 限制部分功能使用 | 积分低于阈值 | 至积分恢复 |
| 临时禁言 | 禁止发布内容和评论 | 骚扰或垃圾信息 | 7-30天 |
| 角色冻结 | 冻结特定角色权限 | 角色相关违规 | 30-90天 |
| 账户冻结 | 冻结所有功能 | 严重违规 | 永久或申诉后解封 |

---

## 四、数据模型设计

### 4.1 用户角色关联模型 (user_role)

```typescript
interface IUserRole {
  _id: ObjectId;
  user_id: ObjectId;                    // 用户ID
  role_type: 'job_seeker' | 'hr_recruiter' | 'admin';  // 角色类型
  status: 'pending' | 'approved' | 'rejected' | 'frozen';  // 状态
  is_active: boolean;                   // 是否当前激活角色
  role_specific_data: {                 // 角色特定数据
    // 求职者角色数据
    skills?: string[];
    experience?: IExperience[];
    expected_salary?: {
      min: number;
      max: number;
      currency: string;
    };
    // HR角色数据
    company_id?: ObjectId;
    company_name?: string;
    position?: string;
  };
  approved_by?: ObjectId;               // 审批人
  approved_at?: Date;                   // 审批时间
  rejection_reason?: string;            // 拒绝原因
  created_at: Date;
  updated_at: Date;
}
```

### 4.2 角色审批记录模型 (role_approval)

```typescript
interface IRoleApproval {
  _id: ObjectId;
  user_id: ObjectId;                    // 申请人ID
  role_type: string;                    // 申请角色类型
  status: 'pending' | 'approved' | 'rejected';  // 审批状态
  submitted_data: any;                  // 提交的数据
  reviewed_by?: ObjectId;               // 审批人
  reviewed_at?: Date;                   // 审批时间
  review_notes?: string;                // 审批备注
  rejection_reason?: string;            // 拒绝原因
  expires_at: Date;                     // 申请过期时间
  created_at: Date;
  updated_at: Date;
}
```

### 4.3 信用积分模型 (user_credit)

```typescript
interface IUserCredit {
  _id: ObjectId;
  user_id: ObjectId;                    // 用户ID
  total_score: number;                  // 总积分 (0-1000)
  level: number;                        // 信用等级 (1-5)
  points_history: IPointRecord[];       // 积分变动记录
  created_at: Date;
  updated_at: Date;
}

interface IPointRecord {
  type: 'earn' | 'deduct';              // 获取/扣减
  amount: number;                       // 积分数量
  reason: string;                       // 原因
  related_id?: ObjectId;                // 关联ID
  created_at: Date;
}
```

### 4.4 举报记录模型 (report)

```typescript
interface IReport {
  _id: ObjectId;
  reporter_id: ObjectId;                // 举报人ID
  reported_user_id?: ObjectId;          // 被举报用户ID
  reported_project_id?: ObjectId;       // 被举报项目ID
  report_type: string;                  // 举报类型
  description: string;                  // 举报描述
  attachments?: string[];               // 附件
  status: 'pending' | 'verified' | 'dismissed';  // 处理状态
  reviewed_by?: ObjectId;               // 处理人
  reviewed_at?: Date;                   // 处理时间
  review_notes?: string;                // 处理备注
  penalty_applied?: string;             // 应用的惩罚
  created_at: Date;
  updated_at: Date;
}
```

### 4.5 惩罚记录模型 (punishment)

```typescript
interface IPunishment {
  _id: ObjectId;
  user_id: ObjectId;                    // 被惩罚用户ID
  punishment_type: string;              // 惩罚类型
  reason: string;                       // 惩罚原因
  related_report_id?: ObjectId;         // 关联举报ID
  credit_deducted?: number;             // 扣除积分
  restrictions?: string[];              // 功能限制列表
  start_date: Date;                     // 开始时间
  end_date?: Date;                      // 结束时间 (null表示永久)
  status: 'active' | 'expired' | 'revoked';  // 状态
  created_by: ObjectId;                 // 创建人
  created_at: Date;
  updated_at: Date;
}
```

---

## 五、API接口设计

### 5.1 角色管理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/user/roles | 获取用户所有角色 |
| POST | /api/v1/user/roles/apply | 申请新角色 |
| PUT | /api/v1/user/roles/switch | 切换激活角色 |
| GET | /api/v1/user/roles/status | 获取角色状态 |

### 5.2 审批管理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/admin/approvals | 获取审批列表 |
| PUT | /api/v1/admin/approvals/:id/approve | 批准申请 |
| PUT | /api/v1/admin/approvals/:id/reject | 拒绝申请 |
| GET | /api/v1/admin/approvals/stats | 获取审批统计 |

### 5.3 信用积分接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/v1/user/credit | 获取用户信用信息 |
| GET | /api/v1/user/credit/history | 获取积分历史 |
| POST | /api/v1/admin/credit/adjust | 调整用户积分 |

### 5.4 举报管理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/v1/reports | 提交举报 |
| GET | /api/v1/reports | 获取举报列表 |
| PUT | /api/v1/admin/reports/:id/verify | 确认举报 |
| PUT | /api/v1/admin/reports/:id/dismiss | 驳回举报 |

---

## 六、UI/UX设计要求

### 6.1 身份信息展示

```
┌─────────────────────────────────────────────────────────────┐
│  用户头像  [求职者]  张三                    🔔  ⚙️  🚪     │
│            ▲                                                │
│            └── 角色标识徽章                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    身份卡片                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐                                               │
│  │  头像    │  张三                                          │
│  │          │  zhangsan@email.com                           │
│  └──────────┘                                               │
│                                                             │
│  已注册角色:                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 求职者 ✓    │  │ HR 审批中   │  │ + 申请新角色 │         │
│  │ [当前激活]  │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  信用积分: 650 分  [良好]  ⭐⭐⭐⭐                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 角色切换组件

```
┌─────────────────────────────────────────────────────────────┐
│  点击角色标识后展开:                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓ 求职者                          [当前]           │   │
│  │    可浏览项目、申请工作、填报工时                      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ HR招聘官                        [切换]           │   │
│  │    可发布项目、审核申请、管理候选人                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ 管理员                          [切换]           │   │
│  │    可管理用户、审批角色、配置系统                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 七、需求分类分级

### 7.1 优先级分类

| 优先级 | 模块 | 需求数量 | 说明 |
|--------|------|----------|------|
| P0 | 身份信息展示 | 5 | 核心功能，必须实现 |
| P0 | 角色切换管理 | 6 | 核心功能，必须实现 |
| P0 | 角色审批流程 | 5 | 核心功能，必须实现 |
| P1 | 积分信用系统 | 6 | 重要功能，优先实现 |
| P1 | 举报管理机制 | 5 | 重要功能，优先实现 |
| P1 | 惩罚执行系统 | 3 | 重要功能，优先实现 |
| P2 | 高级功能 | 4 | 优化功能，后续实现 |

### 7.2 复杂度评估

| 模块 | 前端复杂度 | 后端复杂度 | 数据库复杂度 | 总体评估 |
|------|------------|------------|--------------|----------|
| 身份信息展示 | 中 | 低 | 低 | 中 |
| 角色切换管理 | 高 | 高 | 中 | 高 |
| 角色审批流程 | 中 | 中 | 低 | 中 |
| 积分信用系统 | 中 | 高 | 高 | 高 |
| 举报管理机制 | 中 | 中 | 中 | 中 |
| 惩罚执行系统 | 低 | 高 | 中 | 中 |

---

## 八、开发任务待办清单

### 8.1 Phase 1: 基础架构 (P0)

- [ ] **TASK-001**: 创建user_role数据模型
- [ ] **TASK-002**: 创建role_approval数据模型
- [ ] **TASK-003**: 修改用户注册流程支持初始角色
- [ ] **TASK-004**: 实现角色申请API
- [ ] **TASK-005**: 实现角色切换API
- [ ] **TASK-006**: 创建身份信息展示组件
- [ ] **TASK-007**: 创建角色切换组件
- [ ] **TASK-008**: 修改导航菜单支持动态角色权限

### 8.2 Phase 2: 审批流程 (P0)

- [ ] **TASK-009**: 创建管理员审批队列页面
- [ ] **TASK-010**: 实现审批API (批准/拒绝)
- [ ] **TASK-011**: 实现审批通知功能
- [ ] **TASK-012**: 创建审批记录查询页面
- [ ] **TASK-013**: 实现审批超时自动关闭

### 8.3 Phase 3: 信用系统 (P1)

- [ ] **TASK-014**: 创建user_credit数据模型
- [ ] **TASK-015**: 实现积分计算服务
- [ ] **TASK-016**: 创建积分历史记录功能
- [ ] **TASK-017**: 实现信用等级计算
- [ ] **TASK-018**: 创建信用展示组件
- [ ] **TASK-019**: 实现积分奖励规则
- [ ] **TASK-020**: 实现积分扣减规则

### 8.4 Phase 4: 举报系统 (P1)

- [ ] **TASK-021**: 创建report数据模型
- [ ] **TASK-022**: 创建举报提交页面
- [ ] **TASK-023**: 实现举报处理API
- [ ] **TASK-024**: 创建管理员举报处理页面
- [ ] **TASK-025**: 实现举报统计功能

### 8.5 Phase 5: 惩罚系统 (P1)

- [ ] **TASK-026**: 创建punishment数据模型
- [ ] **TASK-027**: 实现惩罚执行服务
- [ ] **TASK-028**: 创建惩罚记录页面
- [ ] **TASK-029**: 实现自动惩罚解除
- [ ] **TASK-030**: 实现惩罚通知功能

### 8.6 Phase 6: 测试与优化 (P2)

- [ ] **TASK-031**: 编写E2E测试用例
- [ ] **TASK-032**: 性能优化
- [ ] **TASK-033**: 安全审计
- [ ] **TASK-034**: 文档完善

---

## 九、风险与应对

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 角色切换频繁导致数据混乱 | 高 | 中 | 增加切换频率限制，确保数据隔离 |
| 恶意举报影响用户体验 | 中 | 中 | 建立举报审核机制，惩罚恶意举报 |
| 积分规则不公平 | 中 | 低 | 定期评估调整，收集用户反馈 |
| 审批流程效率低 | 中 | 中 | 设置审批时限，支持批量操作 |

---

**文档维护者:** AI Assistant  
**最后更新:** 2026-03-23