# SAP顾问平台务实优化方案

**文档版本:** v2.0  
**创建日期:** 2026-03-28  
**设计原则:** 务实、简洁、聚焦核心业务

---

## 1. 核心业务场景

### 1.1 顾问视角

| 阶段 | 核心诉求 | 关键操作 |
|------|----------|----------|
| **找项目** | 快速找到匹配项目 | 更新状态、浏览项目、投递申请 |
| **做项目** | 阶段性交付、收款 | 提交工单、申请付款、确认收款 |
| **异议处理** | 解决纠纷 | 提交申诉、查看处理进度 |

### 1.2 HR视角

| 阶段 | 核心诉求 | 关键操作 |
|------|----------|----------|
| **找人** | 找到合适顾问 | 查看顾问状态、技能匹配、沟通 |
| **管项目** | 确认工作成果 | 审批工单、确认付款、上传凭证 |
| **异议处理** | 解决问题 | 处理申诉、协商解决 |

---

## 2. 顾问-HR协同流程

### 2.1 工单-付款核心流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    工单-付款协同流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【顾问操作】              【HR操作】              【状态】       │
│                                                                 │
│  提交工单 ──────────────────────────────────────→ 待审批        │
│     │                                                           │
│     │                  审批工单 ────────────────→ 已审批        │
│     │                     │                                     │
│     │                     ├─ 驳回 ─────────────→ 已驳回        │
│     │                     │                                     │
│  发起付款申请 ←────────────┴─ 通过                              │
│     │                                               待付款        │
│     │                                                           │
│     │                  付款并上传凭证 ──────────→ 已付款        │
│     │                                                           │
│  确认收款 ──────────────────────────────────────→ 已完成        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  【异议流程】                                                     │
│                                                                 │
│  提交异议 ──────────────────────────────────────→ 待处理        │
│     │                                                           │
│     │                  管理员处理 ──────────────→ 处理中        │
│     │                     │                                     │
│     │                     ├─ 达成一致 ─────────→ 已解决        │
│     │                     │                                     │
│     └─────────────────────┴─ 关闭异议 ─────────→ 已关闭        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 工单数据结构

```typescript
interface WorkOrder {
  _id: string;
  project_id: string;
  freelancer_id: string;
  hr_id: string;
  
  // 里程碑信息
  milestone: {
    name: string;           // 里程碑名称
    description: string;    // 工作内容描述
    start_date: Date;
    end_date: Date;
    deliverables: string[]; // 交付物列表
  };
  
  // 工作成果
  work_result: {
    description: string;    // 工作成果描述
    attachments: string[];  // 附件URL
    hours: number;          // 工时
  };
  
  // 状态流转
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'payment_pending' | 'paid' | 'completed' | 'disputed';
  
  // 付款信息
  payment: {
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'paid';
    voucher_url?: string;   // 付款凭证
    paid_at?: Date;
  };
  
  // 异议信息
  dispute?: {
    reason: string;
    status: 'pending' | 'processing' | 'resolved' | 'closed';
    resolution?: string;
    resolved_by?: string;
    resolved_at?: Date;
  };
  
  created_at: Date;
  updated_at: Date;
}
```

---

## 3. 顾问状态管理

### 3.1 状态类型

| 状态 | 含义 | 可见性 |
|------|------|--------|
| **可接单** | 当前无项目，可以接新项目 | HR可见 |
| **项目中** | 当前有项目进行中 | HR可见 |
| **即将空闲** | 项目即将结束，可预约 | HR可见（含预计空闲日期） |

### 3.2 状态更新界面

```tsx
// 简洁的状态更新组件
<div className="status-panel">
  <h3>我的状态</h3>
  
  <div className="status-options">
    <button className={status === 'available' ? 'active' : ''}>
      🟢 可接单
    </button>
    <button className={status === 'busy' ? 'active' : ''}>
      🟡 项目中
    </button>
    <button className={status === 'ending_soon' ? 'active' : ''}>
      🔵 即将空闲
    </button>
  </div>
  
  {status === 'ending_soon' && (
    <input type="date" placeholder="预计空闲日期" />
  )}
  
  <button className="btn-primary">更新状态</button>
</div>
```

---

## 4. 能力看板设计

### 4.1 能力标签来源

| 来源 | 权重 | 示例 |
|------|------|------|
| **项目经历** | 40% | SAP FICO实施、S/4HANA迁移 |
| **HR评价** | 30% | 交付质量高、沟通顺畅 |
| **同事评价** | 20% | 技术能力强、团队协作好 |
| **自评** | 10% | 擅长成本核算、报表开发 |

### 4.2 能力看板界面

```tsx
// 能力看板组件
<div className="skill-board">
  <h3>能力看板</h3>
  
  {/* 核心技能 */}
  <div className="skill-section">
    <h4>核心技能</h4>
    <div className="skill-tags">
      <span className="skill-tag verified">SAP FICO ⭐4.8</span>
      <span className="skill-tag verified">S/4HANA ⭐4.5</span>
      <span className="skill-tag">成本核算</span>
    </div>
  </div>
  
  {/* 项目经历 */}
  <div className="skill-section">
    <h4>项目经历</h4>
    <div className="project-list">
      <div className="project-item">
        <span>某制造企业FICO实施</span>
        <span>2025.01 - 2025.06</span>
      </div>
    </div>
  </div>
  
  {/* 评价 */}
  <div className="skill-section">
    <h4>评价</h4>
    <div className="rating-summary">
      <span>交付质量: ⭐4.8</span>
      <span>沟通能力: ⭐4.6</span>
      <span>专业水平: ⭐4.9</span>
    </div>
  </div>
</div>
```

---

## 5. 简历自动更新

### 5.1 自动生成逻辑

```typescript
// 基于项目经历自动生成简历
function generateResumeFromProjects(projects: Project[]): ResumeSection {
  return {
    // 项目经历
    projectExperience: projects.map(p => ({
      name: p.title,
      company: p.company_name,
      period: `${p.start_date} - ${p.end_date}`,
      role: p.role,
      description: p.description,
      achievements: p.milestones.map(m => m.name),
    })),
    
    // 技能标签（从项目中提取）
    skills: extractSkills(projects),
    
    // 工作时长统计
    totalHours: projects.reduce((sum, p) => sum + p.total_hours, 0),
    
    // 行业经验
    industries: [...new Set(projects.map(p => p.industry))],
  };
}
```

### 5.2 一键更新界面

```tsx
<div className="resume-auto-update">
  <h3>简历更新</h3>
  
  <div className="resume-preview">
    {/* 预览自动生成的简历内容 */}
    <div className="preview-section">
      <h4>项目经历（自动生成）</h4>
      <ul>
        <li>SAP FICO实施 - 某制造企业 (2025.01-2025.06)</li>
        <li>MM模块优化 - 某零售企业 (2024.07-2024.12)</li>
      </ul>
    </div>
  </div>
  
  <div className="resume-actions">
    <button className="btn-primary">一键更新简历</button>
    <button className="btn-secondary">手动编辑</button>
  </div>
</div>
```

---

## 6. 菜单体系优化（务实版）

### 6.1 顾问菜单

```
顾问菜单:
├── 找项目 (浏览项目 + 收藏)
├── 我的项目 ( 进行中项目 + 工单管理)
├── 收款管理 ( 付款申请 + 收款记录)
├── 个人中心 ( 状态 + 能力看板 + 简历)
└── 消息 ( 通知 + 异议处理)
```

### 6.2 HR菜单

```
HR菜单:
├── 发布职位
├── 人才库 ( 顾问列表 + 状态筛选)
├── 项目管理 ( 项目 + 工单审批)
├── 付款管理 ( 待付款 + 付款记录)
├── 公司管理
└── 消息
```

---

## 7. 实施优先级

### 7.1 P0 - 核心功能

| 功能 | 描述 | 工时 |
|------|------|------|
| 工单管理 | 提交、审批、状态流转 | 8h |
| 付款流程 | 申请、确认、凭证上传 | 6h |
| 顾问状态管理 | 状态更新、可见性 | 4h |
| 异议处理 | 提交、处理、关闭 | 4h |

### 7.2 P1 - 体验优化

| 功能 | 描述 | 工时 |
|------|------|------|
| 能力看板 | 技能标签、评价展示 | 6h |
| 简历自动更新 | 基于项目生成 | 4h |
| 人才状态筛选 | HR查看顾问状态 | 3h |

### 7.3 P2 - 增值功能

| 功能 | 描述 | 工时 |
|------|------|------|
| 合同签订 | 在线签约 | 8h |
| 简历解析 | 上传解析 | 4h |
| 技能匹配 | 自动推荐 | 6h |

---

## 8. 数据模型补充

### 8.1 顾问状态模型

```typescript
interface FreelancerStatus {
  user_id: string;
  status: 'available' | 'busy' | 'ending_soon';
  available_date?: Date;  // 预计空闲日期
  current_project?: string;
  updated_at: Date;
}
```

### 8.2 能力标签模型

```typescript
interface SkillTag {
  _id: string;
  name: string;
  category: string;  // 技能分类
  verified: boolean; // 是否已验证
  score?: number;    // 评分
  source: 'project' | 'hr_review' | 'peer_review' | 'self';
  project_id?: string;
  created_at: Date;
}
```

---

**文档版本:** v2.0  
**最后更新:** 2026-03-28  
**下一步:** 开始P0阶段工单管理功能开发
