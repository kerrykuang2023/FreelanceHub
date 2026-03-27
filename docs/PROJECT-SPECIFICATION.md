# 项目规范文档

**版本:** v1.0  
**创建日期:** 2026-03-21  
**适用范围:** 自由顾问平台项目  

---

## 1. 代码规范

### 1.1 通用规范

#### 1.1.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | 小写kebab-case | `work-log.controller.ts`, `freelancer-profile.model.ts` |
| 类名 | PascalCase | `WorkLogController`, `FreelancerProfile` |
| 接口名 | PascalCase，以I开头 | `IWorkLog`, `IFreelancerProfile` |
| 函数名 | camelCase | `getWorkLogs()`, `createInvoice()` |
| 变量名 | camelCase | `workLogList`, `totalAmount` |
| 常量名 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE` |
| 数据库集合名 | snake_case | `work_log`, `freelancer_profile` |
| API路由 | kebab-case | `/api/v1/work-logs`, `/api/v1/freelancer-profiles` |

#### 1.1.2 代码注释规范

```typescript
/**
 * 函数/类的详细说明
 * @param paramName 参数说明
 * @returns 返回值说明
 * @throws 可能抛出的异常
 * @example
 * // 使用示例
 * const result = functionName(param);
 */

// 单行注释：说明复杂逻辑

/*
 * 多行注释：
 * 用于说明复杂的业务逻辑
 * 或算法实现
 */
```

#### 1.1.3 TypeScript规范

```typescript
// ✅ 正确：明确类型定义
interface IWorkLog {
  _id: string;
  freelancer_id: string;
  work_date: Date;
  hours_worked: number;
  status: WorkLogStatus;
}

// ✅ 正确：使用枚举
enum WorkLogStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  INVOICED = 'invoiced',
  PAID = 'paid'
}

// ✅ 正确：异步函数返回类型
async function getWorkLogs(query: WorkLogQuery): Promise<IWorkLog[]> {
  // ...
}

// ❌ 错误：使用any类型
function processData(data: any) { // 禁止使用any
  // ...
}
```

### 1.2 前端规范

#### 1.2.1 组件结构规范

```typescript
// 组件文件结构
// src/pages/WorkLogsPage/WorkLogsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workLogService } from '@/services/work-log.service';
import { IWorkLog, WorkLogStatus } from '@/interfaces/models/worklog';
import './WorkLogsPage.css';

interface WorkLogsPageProps {
  projectId?: string;
}

const WorkLogsPage: React.FC<WorkLogsPageProps> = ({ projectId }) => {
  const [workLogs, setWorkLogs] = useState<IWorkLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkLogs();
  }, [projectId]);

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const data = await workLogService.getWorkLogs({ project_id: projectId });
      setWorkLogs(data);
    } catch (err) {
      setError('获取工时列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkLog = () => {
    navigate('/work-logs/create');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="work-logs-page">
      <header className="page-header">
        <h1>工时管理</h1>
        <button onClick={handleCreateWorkLog}>新建工时</button>
      </header>
      <main className="page-content">
        {/* 内容 */}
      </main>
    </div>
  );
};

export default WorkLogsPage;
```

#### 1.2.2 CSS规范

```css
/* 使用BEM命名规范 */
.work-logs-page { }
.work-logs-page__header { }
.work-logs-page__content { }
.work-logs-page__item { }
.work-logs-page__item--active { }

/* 使用CSS变量 */
:root {
  --primary-color: #3B82F6;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
  --text-color: #1F2937;
  --border-color: #E5E7EB;
  --background-color: #F9FAFB;
}
```

### 1.3 后端规范

#### 1.3.1 Controller规范

```typescript
// src/controllers/work-log.controller.ts

import { Request, Response } from 'express';
import workLogService from '../services/work-log.service';
import { asyncWrapper } from '../helpers/async-wrapper';

class WorkLogController {
  /**
   * 获取工时列表
   * GET /api/v1/work-logs
   */
  public getWorkLogs = asyncWrapper(async (req: Request, res: Response) => {
    const { page = 1, pageSize = 20, status, project_id, start_date, end_date } = req.query;
    
    const result = await workLogService.getWorkLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status as string,
      project_id: project_id as string,
      start_date: start_date as string,
      end_date: end_date as string,
      user_id: req.user?.id,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * 创建工时
   * POST /api/v1/work-logs
   */
  public createWorkLog = asyncWrapper(async (req: Request, res: Response) => {
    const workLogData = {
      ...req.body,
      freelancer_id: req.user?.id,
    };

    const workLog = await workLogService.createWorkLog(workLogData);

    res.status(201).json({
      success: true,
      data: workLog,
      message: '工时创建成功',
    });
  });
}

export default new WorkLogController();
```

#### 1.3.2 Service规范

```typescript
// src/services/work-log.service.ts

import WorkLog from '../models/freelancer/work_log.model';
import { IWorkLog, WorkLogStatus } from '../interfaces/models/worklog';

class WorkLogService {
  /**
   * 获取工时列表
   */
  async getWorkLogs(query: WorkLogQuery): Promise<PaginatedResult<IWorkLog>> {
    const { page, pageSize, status, project_id, start_date, end_date, user_id } = query;
    
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (project_id) {
      filter.project_requirement_id = project_id;
    }
    
    if (user_id) {
      filter.freelancer_id = user_id;
    }
    
    if (start_date && end_date) {
      filter.work_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    const total = await WorkLog.countDocuments(filter);
    const items = await WorkLog.find(filter)
      .populate('project_requirement_id')
      .populate('company_id')
      .sort({ work_date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 创建工时
   */
  async createWorkLog(data: CreateWorkLogDTO): Promise<IWorkLog> {
    // 验证：同一天同一项目只能有一条工时
    const existing = await WorkLog.findOne({
      freelancer_id: data.freelancer_id,
      project_requirement_id: data.project_requirement_id,
      work_date: data.work_date,
    });

    if (existing) {
      throw new Error('该日期已存在工时记录');
    }

    // 验证：工作时长不能超过24小时
    if (data.hours_worked > 24) {
      throw new Error('工作时长不能超过24小时');
    }

    // 验证：不能是未来日期
    if (new Date(data.work_date) > new Date()) {
      throw new Error('工作日期不能是未来日期');
    }

    const workLog = await WorkLog.create({
      ...data,
      status: WorkLogStatus.DRAFT,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return workLog;
  }
}

export default new WorkLogService();
```

#### 1.3.3 错误处理规范

```typescript
// src/middlewares/error.middleware.ts

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
  });
};
```

---

## 2. 任务执行规范

### 2.1 任务执行流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           任务执行标准流程                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. 需求理解  │───▶│  2. 设计方案  │───▶│  3. 编码实现  │───▶│  4. 单元测试  │
│  阅读PRD     │    │  技术设计    │    │  编写代码    │    │  编写测试    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  8. 文档更新  │◀───│  7. Issue处理 │◀───│  6. 问题记录  │◀───│  5. E2E测试   │
│  更新文档    │    │  修复问题    │    │  记录Issue   │    │  完整测试    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2.2 任务执行检查清单

每个任务执行时必须完成以下检查：

#### 2.2.1 编码前检查

- [ ] 已阅读并理解PRD中相关功能需求
- [ ] 已确认技术方案和实现路径
- [ ] 已确认数据模型和API接口设计
- [ ] 已确认UI/UX设计要求

#### 2.2.2 编码中检查

- [ ] 代码符合命名规范
- [ ] 代码有适当的注释
- [ ] 代码有适当的错误处理
- [ ] 代码有适当的日志记录

#### 2.2.3 编码后检查

- [ ] 单元测试覆盖核心逻辑
- [ ] E2E测试覆盖用户场景
- [ ] UI测试覆盖页面交互
- [ ] 代码通过lint检查
- [ ] 代码通过类型检查

#### 2.2.4 测试检查

- [ ] 功能测试：功能按预期工作
- [ ] 边界测试：边界条件处理正确
- [ ] 异常测试：异常情况处理正确
- [ ] 性能测试：响应时间符合要求
- [ ] 安全测试：无安全漏洞

### 2.3 测试规范

#### 2.3.1 单元测试规范

```typescript
// tests/unit/work-log.service.test.ts

import workLogService from '@/services/work-log.service';
import WorkLog from '@/models/freelancer/work_log.model';

jest.mock('@/models/freelancer/work_log.model');

describe('WorkLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkLog', () => {
    it('should create a work log successfully', async () => {
      const mockData = {
        freelancer_id: 'freelancer123',
        project_requirement_id: 'project123',
        work_date: new Date('2024-01-15'),
        hours_worked: 8,
        work_type: 'remote',
        work_description: 'Test work',
      };

      (WorkLog.findOne as jest.Mock).mockResolvedValue(null);
      (WorkLog.create as jest.Mock).mockResolvedValue({
        ...mockData,
        _id: 'worklog123',
        status: 'draft',
      });

      const result = await workLogService.createWorkLog(mockData);

      expect(result).toBeDefined();
      expect(result.status).toBe('draft');
    });

    it('should throw error when work log exists for same date and project', async () => {
      const mockData = {
        freelancer_id: 'freelancer123',
        project_requirement_id: 'project123',
        work_date: new Date('2024-01-15'),
        hours_worked: 8,
      };

      (WorkLog.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      await expect(workLogService.createWorkLog(mockData))
        .rejects.toThrow('该日期已存在工时记录');
    });

    it('should throw error when hours exceed 24', async () => {
      const mockData = {
        freelancer_id: 'freelancer123',
        project_requirement_id: 'project123',
        work_date: new Date('2024-01-15'),
        hours_worked: 25,
      };

      await expect(workLogService.createWorkLog(mockData))
        .rejects.toThrow('工作时长不能超过24小时');
    });
  });
});
```

#### 2.3.2 E2E测试规范

```javascript
// e2e/work-log-flow.spec.js

const { chromium } = require('playwright');

describe('Work Log Flow E2E Test', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Freelancer can create and submit work log', async () => {
    // 1. 登录
    await page.goto('http://localhost:5137/login');
    await page.fill('input[name="email"]', 'freelancer@test.com');
    await page.fill('input[name="password"]', 'Test123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 2. 进入工时页面
    await page.click('text=工时管理');
    await page.waitForURL('**/work-logs');

    // 3. 创建工时
    await page.click('text=新建工时');
    await page.waitForURL('**/work-logs/create');

    // 4. 填写工时信息
    await page.selectOption('select[name="project"]', 'project123');
    await page.fill('input[name="work_date"]', '2024-01-15');
    await page.fill('input[name="hours_worked"]', '8');
    await page.selectOption('select[name="work_type"]', 'remote');
    await page.fill('textarea[name="work_description"]', '完成模块开发');

    // 5. 保存草稿
    await page.click('button:has-text("保存草稿")');
    await page.waitForSelector('text=保存成功');

    // 6. 验证工时已创建
    const workLogItem = await page.waitForSelector('.work-log-item');
    expect(workLogItem).toBeTruthy();
  });

  test('Company can approve work log', async () => {
    // 1. 企业登录
    await page.goto('http://localhost:5137/login');
    await page.fill('input[name="email"]', 'company@test.com');
    await page.fill('input[name="password"]', 'Test123456');
    await page.click('button[type="submit"]');

    // 2. 进入工时审核页面
    await page.click('text=工时审核');
    await page.waitForURL('**/hr/work-logs');

    // 3. 查看工时详情
    await page.click('.work-log-item:first-child');
    await page.waitForSelector('.work-log-detail');

    // 4. 确认工时
    await page.click('button:has-text("确认")');
    await page.waitForSelector('text=确认成功');

    // 5. 验证状态变更
    const status = await page.textContent('.work-log-status');
    expect(status).toBe('已确认');
  });
});
```

#### 2.3.3 UI测试规范

```javascript
// e2e/work-log-ui.spec.js

const { chromium } = require('playwright');

describe('Work Log UI Test', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Work log form validation', async () => {
    await page.goto('http://localhost:5137/work-logs/create');

    // 测试必填字段验证
    await page.click('button:has-text("保存草稿")');
    
    const projectError = await page.textContent('.error-message:has-text("项目")');
    expect(projectError).toBeTruthy();

    const dateError = await page.textContent('.error-message:has-text("日期")');
    expect(dateError).toBeTruthy();

    // 测试工作时长验证
    await page.fill('input[name="hours_worked"]', '25');
    const hoursError = await page.textContent('.error-message:has-text("24")');
    expect(hoursError).toBeTruthy();
  });

  test('Work log form responsive design', async () => {
    // 桌面端
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5137/work-logs/create');
    const desktopLayout = await page.screenshot();
    
    // 平板端
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletLayout = await page.screenshot();
    
    // 移动端
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileLayout = await page.screenshot();

    // 验证布局是否正确
    expect(desktopLayout).toBeDefined();
    expect(tabletLayout).toBeDefined();
    expect(mobileLayout).toBeDefined();
  });
});
```

### 2.4 Issue管理规范

#### 2.4.1 Issue模板

```markdown
# Issue: [Issue标题]

## Issue信息
- **Issue ID**: ISSUE-XXX
- **发现时间**: YYYY-MM-DD HH:mm
- **发现阶段**: [编码/单元测试/E2E测试/UI测试/生产环境]
- **严重程度**: [Critical/High/Medium/Low]
- **优先级**: [P0/P1/P2]

## 问题描述
[详细描述问题现象]

## 复现步骤
1. 步骤1
2. 步骤2
3. 步骤3

## 期望结果
[描述期望的正确行为]

## 实际结果
[描述实际的错误行为]

## 环境信息
- 操作系统: [Windows/Mac/Linux]
- 浏览器: [Chrome/Firefox/Safari]
- 版本: [版本号]

## 截图/日志
[附上相关截图或日志]

## 相关任务
- 关联任务ID: TASK-XXX

## 解决方案
[问题修复后填写]

## 验证结果
- [ ] 问题已修复
- [ ] 单元测试通过
- [ ] E2E测试通过
- [ ] UI测试通过
```

#### 2.4.2 Issue处理流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Issue处理流程                                       │
└─────────────────────────────────────────────────────────────────────────────┘

发现Issue
    │
    ▼
创建Issue记录 ─────────────────────────────┐
    │                                      │
    ▼                                      ▼
评估严重程度                          更新任务清单
    │                                      │
    ├─ Critical/P0 ──▶ 立即处理              │
    ├─ High/P1     ──▶ 当日处理              │
    ├─ Medium/P2   ──▶ 本周处理              │
    └─ Low/P3      ──▶ 排期处理              │
    │                                      │
    ▼                                      │
分析问题原因                              │
    │                                      │
    ▼                                      │
制定解决方案                              │
    │                                      │
    ▼                                      │
实施修复                                  │
    │                                      │
    ▼                                      │
验证修复                                  │
    │                                      │
    ├─ 通过 ──▶ 关闭Issue                   │
    │               │                       │
    │               ▼                       │
    │          更新任务状态                   │
    │                                      │
    └─ 未通过 ──▶ 重新分析                   │
```

---

## 3. 文档规范

### 3.1 文档目录结构

```
docs/
├── PRD-Freelancer-Platform.md    # 产品需求文档
├── PROJECT-SPECIFICATION.md       # 项目规范文档
├── TASK-BREAKDOWN.md              # 任务拆解文档
├── API-DOCUMENTATION.md           # API接口文档
├── DATABASE-DESIGN.md             # 数据库设计文档
├── DEPLOYMENT-GUIDE.md            # 部署指南
└── issues/                        # Issue记录目录
    ├── ISSUE-001.md
    ├── ISSUE-002.md
    └── ...
```

### 3.2 文档更新规范

- 每次功能变更必须更新相关文档
- 文档更新必须包含变更记录
- 文档版本号遵循语义化版本规范

---

## 4. Git提交规范

### 4.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 4.2 提交类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复Bug |
| docs | 文档更新 |
| style | 代码格式调整 |
| refactor | 代码重构 |
| test | 测试相关 |
| chore | 构建/工具相关 |

### 4.3 提交示例

```
feat(work-log): 实现工时批量提交功能

- 添加批量选择工时的UI组件
- 实现批量提交的API接口
- 添加工时汇总预览功能
- 添加单元测试和E2E测试

Closes #123
```

---

## 5. 质量标准

### 5.1 代码质量标准

| 指标 | 标准 |
|------|------|
| 单元测试覆盖率 | ≥ 80% |
| E2E测试覆盖率 | ≥ 90%核心流程 |
| TypeScript严格模式 | 开启 |
| ESLint错误数 | 0 |
| 代码重复率 | ≤ 5% |

### 5.2 性能标准

| 指标 | 标准 |
|------|------|
| 页面加载时间 | < 2秒 |
| API响应时间 | < 500ms (95%) |
| 数据库查询时间 | < 100ms |
| 文件上传时间 | < 10秒 (10MB) |

### 5.3 安全标准

- 所有API必须有身份认证
- 敏感数据必须加密存储
- 密码必须使用BCrypt加密
- 所有用户输入必须验证
- 所有SQL查询必须参数化

---

**文档结束**
