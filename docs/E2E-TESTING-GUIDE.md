# JobPortal E2E 测试完整指南

**最后更新:** 2026-03-22  
**文档版本:** v1.0  

---

## 📚 文档概述

本指南汇总了 JobPortal 项目 E2E 测试的所有相关内容，包括测试标准操作程序、检查清单、工具脚本和最佳实践。

---

## 📖 核心文档

### 1. 测试标准操作程序 (SOP)

**文件:** [`docs/TESTING-SOP.md`](docs/TESTING-SOP.md)

**内容:**
- 测试环境准备
- 基础服务启动流程
- 测试账号管理
- 测试执行流程
- 测试结果验证
- 文档更新规范
- 故障排查指南

**适用场景:** 
- 首次执行 E2E 测试
- 建立标准化测试流程
- 培训新测试人员
- 故障排查参考

**关键章节:**
- 第 2 章：基础服务启动 (MongoDB、应用服务)
- 第 3 章：测试账号管理 (创建、验证)
- 第 4 章：测试执行流程 (完整步骤)
- 第 7 章：故障排查指南 (常见问题解决)

---

### 2. 测试检查清单

**文件:** [`docs/TESTING-CHECKLIST.md`](docs/TESTING-CHECKLIST.md)

**内容:**
- 测试前准备清单
- 测试执行清单
- 测试结果验证清单
- 文档更新清单
- 清理工作清单
- 总结汇报模板

**适用场景:**
- 每次测试执行时使用
- 确保测试流程完整性
- 测试质量把控
- 测试报告生成

**使用方法:**
1. 打印或打开检查清单
2. 按顺序勾选每个步骤
3. 记录测试结果
4. 签名确认

---

### 3. PRD 功能检查清单

**文件:** [`docs/PRD-Feature-Checklist.md`](docs/PRD-Feature-Checklist.md)

**内容:**
- 所有 PRD 功能列表
- 功能实现状态
- 测试验证状态
- 完成率统计

**适用场景:**
- 验证 PRD 功能完整性
- 跟踪功能实现进度
- 测试覆盖率检查

---

## 🛠️ 工具脚本

### 1. 环境启动脚本

**文件:** [`start-test-env.bat`](start-test-env.bat)

**功能:**
- 自动检查并启动 MongoDB
- 检查项目依赖
- 创建测试账号
- 启动前后端服务

**使用方法:**
```bash
# Windows
双击运行 start-test-env.bat

# 或命令行
.\start-test-env.bat
```

**执行流程:**
```
1. 检查 MongoDB → 2. 等待就绪 → 3. 检查依赖 → 4. 创建账号 → 5. 启动服务
```

**预期输出:**
```
========================================
JobPortal E2E 测试环境启动
========================================

[1/5] 检查 MongoDB 服务...
✓ MongoDB 运行正常

[2/5] 等待 MongoDB 就绪...
✓ MongoDB 已就绪

[3/5] 检查项目依赖...
✓ 依赖检查完成

[4/5] 创建测试账号...
✓ 创建测试用户：admin@test.com
✓ 创建测试用户：freelancer@test.com
✓ 创建测试用户：company@test.com

[5/5] 启动应用服务...
前端：http://localhost:5137
后端：http://localhost:5555
```

---

### 2. 测试执行脚本

**文件:** [`run-tests.bat`](run-tests.bat)

**功能:**
- 执行指定类型的测试
- 查看测试报告
- 清理测试结果

**使用方法:**
```bash
# 交互式菜单
.\run-tests.bat

# 执行特定测试
.\run-tests.bat full    # 完整用户旅程
.\run-tests.bat ui      # UI 验证
.\run-tests.bat prd     # PRD 验证
.\run-tests.bat all     # 所有测试

# 查看报告
.\run-tests.bat report

# 清理结果
.\run-tests.bat clean
```

**测试类型说明:**

| 类型 | 测试文件 | 测试数 | 预计时间 | 用途 |
|------|----------|--------|----------|------|
| full | reports-full-test.spec.ts | 3 | ~15s | 验证完整用户旅程 |
| ui | reports-ui-validation.spec.ts | 8 | ~30s | 验证 UI 组件 |
| prd | worklog-invoice-stats-prd.spec.ts | 10 | ~45s | 验证 PRD 功能 |
| all | 所有测试 | 21 | ~90s | 完整测试套件 |

---

## 📊 测试文件结构

```
JobPortal/
├── docs/                          # 文档目录
│   ├── TESTING-SOP.md            # 标准操作程序
│   ├── TESTING-CHECKLIST.md      # 检查清单
│   ├── PRD-Feature-Checklist.md  # PRD 功能清单
│   └── E2E-TESTING-GUIDE.md      # 本文件
│
├── start-test-env.bat            # 环境启动脚本
├── run-tests.bat                 # 测试执行脚本
│
└── JobPortal/
    └── e2e/                       # E2E 测试目录
        ├── tests/
        │   ├── utils/            # 测试工具
        │   │   ├── mock-user.ts      # Mock 用户工具
        │   │   └── test-auth.ts      # 登录工具
        │   │
        │   ├── reports-full-test.spec.ts           # 完整用户旅程测试
        │   ├── reports-ui-validation.spec.ts       # UI 组件验证
        │   └── worklog-invoice-stats-prd.spec.ts   # PRD 功能验证
        │
        └── test-reports/         # 测试报告
            └── [日期]-test-report.md
```

---

## 🎯 快速开始

### 方式 A: 自动化一键启动（推荐）

```bash
# 1. 启动所有服务
.\start-test-env.bat

# 2. 执行测试
.\run-tests.bat all

# 3. 查看报告
.\run-tests.bat report
```

### 方式 B: 手动分步启动

```bash
# 1. 启动 MongoDB
net start MongoDB

# 2. 创建测试账号
cd JobPortal/JobPortal/server
node src/seeders/create-e2e-test-users.js

# 3. 启动应用服务
cd ../
npm run dev

# 4. 新窗口执行测试
npx playwright test e2e/tests/ --headed

# 5. 查看报告
npx playwright show-report
```

---

## 📋 标准测试流程

### 步骤 1: 准备环境 (5 分钟)

```bash
# 使用自动化脚本
.\start-test-env.bat

# 或手动执行
net start MongoDB
cd JobPortal/JobPortal
npm run dev
```

**验证清单:**
- [ ] MongoDB 运行正常
- [ ] 前端服务：http://localhost:5137 ✓
- [ ] 后端服务：http://localhost:5555 ✓

---

### 步骤 2: 创建测试账号 (2 分钟)

```bash
cd JobPortal/JobPortal/server
node src/seeders/create-e2e-test-users.js
```

**预期输出:**
```
✓ 创建测试用户：admin@test.com
✓ 创建测试用户：freelancer@test.com
✓ 创建测试用户：company@test.com
```

---

### 步骤 3: 执行测试 (2-5 分钟)

```bash
# 选择测试类型
.\run-tests.bat full    # 快速验证 (推荐)
.\run-tests.bat prd     # PRD 验证
.\run-tests.bat all     # 完整测试
```

**观察要点:**
- 浏览器自动打开
- 登录流程执行
- 页面跳转正常
- 测试结果显示

---

### 步骤 4: 查看结果 (3 分钟)

```bash
# 查看测试报告
.\run-tests.bat report

# 或手动打开
start playwright-report\index.html

# 查看截图
cd e2e-test-results\screenshots
```

**验证清单:**
- [ ] 所有 P0 测试通过
- [ ] 通过率 >= 80%
- [ ] 截图证据完整
- [ ] 无阻塞性问题

---

### 步骤 5: 记录结果 (5 分钟)

**填写检查清单:**
- [ ] 打开 `docs/TESTING-CHECKLIST.md`
- [ ] 填写测试结果
- [ ] 记录发现问题
- [ ] 签名确认

**生成测试报告:**
- [ ] 创建 `e2e/test-reports/YYYY-MM-DD-test-report.md`
- [ ] 复制测试结果
- [ ] 附上截图路径
- [ ] 记录问题分析

---

### 步骤 6: 更新文档 (3 分钟)

**更新 PRD 检查清单:**
```bash
# 编辑 docs/PRD-Feature-Checklist.md
# 更新以下列：
- 实现状态 (✅/❌)
- 验证结果 (通过/失败)
- 最后验证时间
```

**更新任务跟踪:**
```bash
# 编辑 .claude/superpower-loop-task-001.local.md
# 标记已完成任务
# 记录遗留问题
```

---

### 步骤 7: 清理环境 (2 分钟)

```bash
# 清理测试结果（可选）
.\run-tests.bat clean

# 停止服务（可选）
Ctrl+C  # 停止开发服务器
net stop MongoDB  # 停止 MongoDB
```

---

## 🔍 故障排查

### 问题 1: MongoDB 无法启动

**症状:**
```
Error: connect ECONNREFUSED ::1:27017
```

**解决方案:**

```bash
# 方式 1: 重启 Windows 服务
net stop MongoDB
net start MongoDB

# 方式 2: 使用 Docker
docker run -d -p 27017:27017 --name jobportal-mongo mongo
```

---

### 问题 2: 测试全部失败（重定向到登录页）

**症状:**
```
所有测试失败，错误：Page redirected to /login
```

**原因:** 测试账号未创建或失效

**解决方案:**

```bash
# 重新创建测试账号
cd JobPortal/JobPortal/server
node src/seeders/create-e2e-test-users.js

# 验证账号
node src/seeders/verify-test-users.js
```

---

### 问题 3: 元素找不到

**症状:**
```
Error: element(s) not found
```

**解决方案:**

1. 检查服务是否完全启动（等待 15 秒）
2. 检查选择器是否正确
3. 添加等待时间
   ```typescript
   await page.waitForLoadState('networkidle');
   await page.waitForTimeout(2000);
   ```

---

### 问题 4: 测试超时

**症状:**
```
Error: Timeout 30000ms exceeded
```

**解决方案:**

1. 增加超时时间
   ```typescript
   // playwright.config.ts
   timeout: 60000
   ```

2. 优化等待策略
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

---

## 📊 测试覆盖率

### 当前测试覆盖

| 功能模块 | 测试文件 | 测试数 | 覆盖率 |
|----------|----------|--------|--------|
| 报表统计 | reports-full-test.spec.ts | 3 | 用户旅程 |
| 报表统计 | reports-ui-validation.spec.ts | 8 | UI 组件 |
| 报表统计 | worklog-invoice-stats-prd.spec.ts | 10 | PRD 功能 |
| **总计** | **3 个文件** | **21 个测试** | **完整覆盖** |

### PRD 功能对照

| 功能 ID | 功能名称 | 测试覆盖 | 状态 |
|---------|----------|----------|------|
| WORKLOG-009 | 工时统计图表 | ✅ 10 个测试 | 已覆盖 |
| INV-009 | 发票统计图表 | ✅ 4 个测试 | 已覆盖 |
| REPORT-001 | 完整报表页面 | ✅ 3 个测试 | 已覆盖 |

---

## 🎓 最佳实践

### 测试编写规范

1. **使用 data-testid**
   ```typescript
   // ✅ 推荐
   page.locator('[data-testid="submit-btn"]')
   
   // ❌ 不推荐
   page.locator('button[type="submit"]')
   ```

2. **智能等待**
   ```typescript
   // ✅ 推荐
   await page.waitForLoadState('networkidle');
   await expect(locator).toBeVisible();
   
   // ❌ 不推荐
   await page.waitForTimeout(5000);
   ```

3. **有意义的测试名称**
   ```typescript
   // ✅ 推荐
   test('WORKLOG-009-001: 【PRD 验证】访问报表页面')
   
   // ❌ 不推荐
   test('test 1')
   ```

4. **截图证据**
   ```typescript
   // 关键步骤都要截图
   await page.screenshot({ 
     path: 'e2e-test-results/screenshots/step-name.png',
     fullPage: true 
   });
   ```

---

### 测试执行规范

1. **执行前检查**
   - 使用 `TESTING-CHECKLIST.md`
   - 确保所有前置条件满足

2. **执行中观察**
   - 观察浏览器行为
   - 记录异常情况
   - 截图关键错误

3. **执行后验证**
   - 检查测试通过率
   - 验证截图完整性
   - 更新相关文档

---

## 📈 持续改进

### 测试优化方向

1. **增加测试覆盖**
   - [ ] 项目搜索功能测试
   - [ ] 消息通知测试
   - [ ] 支付流程测试

2. **提高测试稳定性**
   - [ ] 优化等待策略
   - [ ] 增加重试机制
   - [ ] 改进错误处理

3. **提升执行效率**
   - [ ] 并行执行测试
   - [ ] 优化测试数据
   - [ ] 减少冗余步骤

---

## 🔗 相关资源

### 内部文档

- [测试标准操作程序](docs/TESTING-SOP.md)
- [测试检查清单](docs/TESTING-CHECKLIST.md)
- [PRD 功能清单](docs/PRD-Feature-Checklist.md)
- [工作规范](.trae/rules/feature-development-workflow.md)

### 外部资源

- [Playwright 官方文档](https://playwright.dev)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [TypeScript 测试指南](https://www.typescriptlang.org/docs/handbook/testing.html)

---

## 📞 支持与反馈

### 获取帮助

1. **查看文档:** `docs/TESTING-SOP.md` 第 7 章
2. **检查清单:** `docs/TESTING-CHECKLIST.md` 故障排查部分
3. **查看示例:** `e2e/tests/` 中的测试文件

### 反馈问题

发现文档问题或改进建议：
1. 记录问题描述
2. 提出改进建议
3. 提交文档更新

---

**文档维护:** AI Assistant  
**审查周期:** 每月一次  
**下次审查:** 2026-04-22

---

## 附录：快速参考卡片

```
┌─────────────────────────────────────────────────────────────┐
│              JobPortal E2E 测试快速参考                       │
├─────────────────────────────────────────────────────────────┤
│ 启动环境：.\start-test-env.bat                               │
│ 执行测试：.\run-tests.bat [full|ui|prd|all]                  │
│ 查看报告：.\run-tests.bat report                             │
│ 清理结果：.\run-tests.bat clean                              │
├─────────────────────────────────────────────────────────────┤
│ 测试账号:                                                    │
│ 管理员：admin@test.com / Test1234!                           │
│ 自由顾问：freelancer@test.com / Test1234!                    │
│ 企业用户：company@test.com / Test1234!                       │
├─────────────────────────────────────────────────────────────┤
│ 服务 URL:                                                    │
│ 前端：http://localhost:5137                                  │
│ 后端：http://localhost:5555                                  │
│ MongoDB: localhost:27017                                     │
├─────────────────────────────────────────────────────────────┤
│ 关键文档:                                                    │
│ SOP: docs/TESTING-SOP.md                                     │
│ 清单：docs/TESTING-CHECKLIST.md                              │
│ 指南：docs/E2E-TESTING-GUIDE.md (本文件)                     │
└─────────────────────────────────────────────────────────────┘
```
