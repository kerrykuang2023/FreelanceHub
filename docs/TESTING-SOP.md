# JobPortal E2E 测试标准操作程序 (SOP)

**文档版本:** v1.0  
**创建日期:** 2026-03-22  
**维护者:** AI Assistant  
**适用范围:** 所有 E2E 测试执行场景

---

## 目录

1. [测试环境准备](#1-测试环境准备)
2. [基础服务启动](#2-基础服务启动)
3. [测试账号管理](#3-测试账号管理)
4. [测试执行流程](#4-测试执行流程)
5. [测试结果验证](#5-测试结果验证)
6. [文档更新规范](#6-文档更新规范)
7. [故障排查指南](#7-故障排查指南)
8. [附录](#8-附录)

---

## 1. 测试环境准备

### 1.1 系统要求

| 组件 | 版本要求 | 检查命令 |
|------|----------|----------|
| Node.js | >= 18.x | `node --version` |
| npm | >= 9.x | `npm --version` |
| MongoDB | >= 6.0 | `mongod --version` |
| Playwright | 最新 | `npx playwright --version` |

### 1.2 环境变量配置

创建 `.env` 文件（如不存在）：

```bash
# 前端环境 (.env)
VITE_API_URL=http://localhost:5555/api
VITE_USER_NODE_ENV=development

# 后端环境 (.env)
PORT=5555
MONGO_URL=mongodb://localhost:27017/job-portal
JWT_SECRET=test-secret-key-for-e2e-testing
```

### 1.3 目录结构检查

确保以下目录存在：

```bash
JobPortal/
├── JobPortal/
│   ├── client/          # 前端项目
│   ├── server/          # 后端项目
│   └── e2e/             # E2E 测试
│       ├── tests/
│       │   ├── utils/   # 测试工具
│       │   └── *.spec.ts # 测试文件
│       └── test-reports/ # 测试报告
└── docs/                # 文档
```

---

## 2. 基础服务启动

### 2.1 MongoDB 服务启动

#### 方式 A: Windows 服务方式

```bash
# 检查 MongoDB 服务状态
sc query MongoDB

# 启动 MongoDB 服务
net start MongoDB

# 验证服务运行
sc query MongoDB | findstr "RUNNING"
```

#### 方式 B: Docker 方式（推荐）

```bash
# 启动 MongoDB 容器
docker run -d ^
  -p 27017:27017 ^
  --name jobportal-mongo ^
  -v mongo-data:/data/db ^
  mongo:latest

# 验证容器运行
docker ps | findstr mongo

# 查看 MongoDB 日志
docker logs jobportal-mongo
```

#### 方式 C: 手动启动

```bash
# 创建数据目录
mkdir C:\data\db

# 启动 MongoDB
mongod --dbpath C:\data\db --bind_ip 127.0.0.1
```

### 2.2 验证 MongoDB 连接

```bash
# 使用 mongosh 连接验证
mongosh mongodb://localhost:27017/job-portal

# 执行测试查询
db.user_account.countDocuments()
```

**预期输出:**
```
switched to db job-portal
0  # 或更多文档数
```

### 2.3 应用服务启动

#### 步骤 1: 安装依赖（首次运行）

```bash
cd JobPortal/JobPortal

# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

#### 步骤 2: 启动开发服务器

```bash
# 返回项目根目录
cd JobPortal/JobPortal

# 启动前后端服务
npm run dev
```

**验证服务启动成功:**

| 服务 | URL | 验证方式 |
|------|-----|----------|
| 前端 | http://localhost:5137 | 浏览器访问 |
| 后端 | http://localhost:5555 | `curl http://localhost:5555/api/health` |

**预期日志:**
```
[前端] VITE v5.2.9  ready in 323 ms
[前端] Local:   http://localhost:5137/
[后端] [Server]: Server is running at http://localhost:5555
[后端] [Server] Database connected successfully
```

### 2.3.1 Docker 启动方式（2026-06-03 修正版）

当前项目已验证可以完整使用 Docker Compose 启动。执行 E2E 或验收测试前，优先使用：

```powershell
docker compose up --build -d
docker compose ps
```

验证服务：

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5137
Invoke-WebRequest -UseBasicParsing http://localhost:5555/health
```

测试登录账号：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | `admin@test.com` | `Test123456!` |
| 自由顾问 | `freelancer@test.com` | `Test123456!` |
| HR | `hr@test.com` | `Test123456!` |

如果 Docker Hub 拉取 `node:20` 不稳定，当前 Dockerfile 已通过安装 Node 20 tarball 绕开该问题。完整排障说明见 `docs/DOCKER-DEPLOYMENT-GUIDE.md`。

### 2.4 服务健康检查脚本

创建 `health-check.sh`:

```bash
#!/bin/bash

echo "=== 服务健康检查 ==="

# 检查 MongoDB
echo "检查 MongoDB..."
mongosh mongodb://localhost:27017/job-portal --eval "db.runCommand('ping')" >nul 2>&1
if [ $? -eq 0 ]; then
  echo "✓ MongoDB 运行正常"
else
  echo "✗ MongoDB 未运行"
  exit 1
fi

# 检查前端服务
echo "检查前端服务..."
curl -s http://localhost:5137 >nul 2>&1
if [ $? -eq 0 ]; then
  echo "✓ 前端服务运行正常"
else
  echo "✗ 前端服务未运行"
  exit 1
fi

# 检查后端服务
echo "检查后端服务..."
curl -s http://localhost:5555/api/health >nul 2>&1
if [ $? -eq 0 ]; then
  echo "✓ 后端服务运行正常"
else
  echo "✗ 后端服务未运行"
  exit 1
fi

echo "=== 所有服务正常 ==="
```

---

## 3. 测试账号管理

### 3.1 测试账号创建

#### 首次创建测试账号

```bash
cd JobPortal/JobPortal/server

# 运行测试账号创建脚本
node src/seeders/create-e2e-test-users.js
```

**预期输出:**
```
✓ 已连接到 MongoDB
✓ 创建 admin 用户类型
✓ 创建 job_seeker 用户类型
✓ 创建 hr 用户类型
✓ 创建测试用户：admin@test.com
✓ 创建测试用户：freelancer@test.com
✓ 创建测试用户：company@test.com

========================================
测试账号创建完成！
========================================
账号列表:
管理员：admin@test.com / Test1234!
自由顾问：freelancer@test.com / Test1234!
企业用户：company@test.com / Test1234!
========================================
```

### 3.2 测试账号配置

测试账号信息记录在 `e2e/tests/utils/test-auth.ts`:

```typescript
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'admin',
  },
  freelancer: {
    email: 'freelancer@test.com',
    password: 'Test1234!',
    role: 'freelancer',
  },
  company: {
    email: 'company@test.com',
    password: 'Test1234!',
    role: 'company',
  },
};
```

### 3.3 账号验证

创建账号验证脚本 `verify-test-users.js`:

```javascript
const mongoose = require('mongoose');

async function verifyTestUsers() {
  await mongoose.connect('mongodb://localhost:27017/job-portal');
  
  const UserAccount = mongoose.model('UserAccount', 
    new mongoose.Schema({
      email: String,
      is_active: Boolean,
    }), 
    'user_account'
  );
  
  const testEmails = [
    'admin@test.com',
    'freelancer@test.com',
    'company@test.com',
  ];
  
  console.log('=== 测试账号验证 ===');
  
  for (const email of testEmails) {
    const user = await UserAccount.findOne({ email });
    if (user && user.is_active) {
      console.log(`✓ ${email} - 存在且激活`);
    } else {
      console.log(`✗ ${email} - 不存在或未激活`);
    }
  }
  
  await mongoose.disconnect();
}

verifyTestUsers();
```

---

## 4. 测试执行流程

### 4.1 测试前检查清单

执行测试前，必须完成以下检查：

- [ ] MongoDB 服务正在运行
- [ ] 前端服务正在运行 (http://localhost:5137)
- [ ] 后端服务正在运行 (http://localhost:5555)
- [ ] 测试账号已创建并激活
- [ ] Playwright 浏览器已安装
- [ ] 测试截图目录存在

**快速检查命令:**

```bash
# 运行健康检查
cd JobPortal/JobPortal/e2e
node ../server/src/seeders/verify-test-users.js

# 安装 Playwright 浏览器（首次）
npx playwright install chromium
```

### 4.2 测试执行命令

#### 执行特定测试文件

```bash
cd JobPortal/JobPortal

# 执行报表页面测试
npx playwright test e2e/tests/reports-full-test.spec.ts --headed

# 执行 UI 验证测试
npx playwright test e2e/tests/reports-ui-validation.spec.ts --headed

# 执行 PRD 验证测试
npx playwright test e2e/tests/worklog-invoice-stats-prd.spec.ts --headed
```

#### 执行特定测试用例

```bash
# 执行单个测试用例
npx playwright test e2e/tests/reports-full-test.spec.ts -g "FULL-001" --headed

# 执行匹配模式的测试
npx playwright test e2e/tests/ -g "WORKLOG" --headed
```

#### 无头模式执行（CI/CD）

```bash
# 无头模式（不显示浏览器）
npx playwright test e2e/tests/reports-full-test.spec.ts

# 生成测试报告
npx playwright test --reporter=html
```

### 4.3 测试场景分类

#### 场景 A: 功能验证测试

**目的:** 验证 PRD 定义的功能是否实现

**测试文件:** `worklog-invoice-stats-prd.spec.ts`

**测试场景:**
1. WORKLOG-009: 工时统计图表
   - 访问报表页面
   - 验证工时统计卡片
   - 验证工时趋势图表
   - 验证周期切换功能
   - 验证项目收入分布图表

2. INV-009: 发票统计图表
   - 验证发票统计图表
   - 验证发票状态卡片
   - 验证发票数据可视化
   - 验证导出功能

**执行用户:** admin

**预期结果:** 所有测试通过，截图保存成功

#### 场景 B: UI 组件验证测试

**目的:** 验证 UI 组件是否正确渲染

**测试文件:** `reports-ui-validation.spec.ts`

**测试场景:**
1. UI-001: 页面基本结构
2. UI-002: 周期选择器
3. UI-003: 统计卡片区域
4. UI-004: 图表容器存在
5. UI-005: 页面加载无错误

**执行用户:** admin

**预期结果:** UI 组件存在，无 JavaScript 错误

#### 场景 C: 完整用户旅程测试

**目的:** 模拟真实用户使用流程

**测试文件:** `reports-full-test.spec.ts`

**测试场景:**
1. FULL-001: 管理员登录并访问报表
2. FULL-002: 自由顾问登录并访问报表
3. FULL-003: 企业用户登录并访问报表

**执行用户:** admin, freelancer, company

**预期结果:** 登录成功，页面访问成功，截图保存

### 4.4 测试执行步骤

**步骤 1: 准备环境**

```bash
# 1. 启动 MongoDB
net start MongoDB

# 2. 启动应用服务
cd JobPortal/JobPortal
npm run dev

# 3. 等待服务启动完成（约 15 秒）
```

**步骤 2: 验证服务**

```bash
# 检查服务状态
curl http://localhost:5137
curl http://localhost:5555/api/health
```

**步骤 3: 执行测试**

```bash
# 执行完整测试套件
npx playwright test e2e/tests/reports-full-test.spec.ts --headed

# 或执行特定测试
npx playwright test e2e/tests/ -g "WORKLOG" --headed
```

**步骤 4: 查看结果**

```bash
# 查看测试报告
npx playwright show-report

# 查看截图
cd e2e-test-results/screenshots
```

---

## 5. 测试结果验证

### 5.1 测试结果解读

**测试输出示例:**

```
Running 10 tests using 1 worker

  ✓  1 tests/reports-full-test.spec.ts:18:7 › FULL-001: 管理员登录并访问报表页面 (5.2s)
  ✓  2 tests/reports-full-test.spec.ts:38:7 › FULL-002: 自由顾问登录并访问报表页面 (4.8s)
  ✓  3 tests/reports-full-test.spec.ts:58:7 › FULL-003: 企业用户登录并访问报表页面 (5.1s)

  3 passed (15.1s)
```

**结果判断:**

| 状态 | 标识 | 含义 | 处理 |
|------|------|------|------|
| 通过 | ✓ | 测试成功 | 继续下一个测试 |
| 失败 | ✗ | 测试失败 | 查看错误日志 |
| 跳过 | - | 跳过测试 | 检查测试条件 |
| 超时 | ⏱ | 执行超时 | 增加超时时间或优化测试 |

### 5.2 错误日志分析

**查看错误详情:**

```bash
# 查看测试输出
npx playwright test e2e/tests/reports-full-test.spec.ts --reporter=line

# 查看错误上下文
cat test-results/[test-name]/error-context.md
```

**常见错误类型:**

1. **超时错误**
   ```
   Error: expect(locator).toBeVisible() failed
   Timeout: 5000ms
   ```
   **解决:** 增加等待时间或检查元素选择器

2. **认证错误**
   ```
   Error: Page redirected to /login
   ```
   **解决:** 检查登录流程和 token 有效性

3. **网络错误**
   ```
   Error: Network request failed
   ```
   **解决:** 检查后端服务是否运行

### 5.3 截图证据验证

**截图目录结构:**

```
e2e-test-results/
└── screenshots/
    ├── login-page.png
    ├── after-login.png
    ├── full-001-reports-page.png
    ├── full-002-freelancer-reports.png
    └── full-003-company-reports.png
```

**验证清单:**

- [ ] 所有测试步骤都有截图
- [ ] 截图清晰可见
- [ ] 截图包含关键 UI 元素
- [ ] 截图命名规范
- [ ] 截图已保存到正确目录

---

## 6. 文档更新规范

### 6.1 测试完成报告模板

创建测试完成报告 `e2e/test-reports/[日期]-test-report.md`:

```markdown
# E2E 测试完成报告

## 测试信息

- **测试日期:** YYYY-MM-DD
- **测试人员:** [姓名]
- **测试范围:** [功能模块]
- **测试环境:** 
  - 前端：http://localhost:5137
  - 后端：http://localhost:5555
  - MongoDB: localhost:27017

## 测试结果

### 总体统计

- **总测试数:** X
- **通过:** X (X%)
- **失败:** X (X%)
- **跳过:** X (X%)

### 详细结果

| 测试文件 | 测试数 | 通过 | 失败 | 通过率 |
|----------|--------|------|------|--------|
| reports-full-test.spec.ts | 3 | 3 | 0 | 100% |
| reports-ui-validation.spec.ts | 8 | 6 | 2 | 75% |
| worklog-invoice-stats-prd.spec.ts | 10 | 8 | 2 | 80% |

## 问题记录

### 失败测试分析

1. **测试名称:** [测试用例名称]
   - **失败原因:** [详细描述]
   - **影响范围:** [功能模块]
   - **优先级:** P0/P1/P2
   - **建议修复:** [修复建议]

### 发现问题

1. **问题 ID:** ISS-001
   - **功能 ID:** [相关功能 ID]
   - **问题描述:** [详细描述]
   - **复现步骤:** [步骤 1, 2, 3...]
   - **预期行为:** [正确行为]
   - **实际行为:** [错误行为]
   - **严重级别:** P0/P1/P2/P3
   - **截图证据:** [截图路径]

## 功能验证状态

### PRD 功能对照表

| 功能 ID | 功能名称 | PRD 要求 | 实现状态 | 测试状态 | 验证结果 |
|---------|----------|----------|----------|----------|----------|
| WORKLOG-009 | 工时统计图表 | 详细描述 | ✅ 已实现 | ✅ 通过 | ✅ 已验证 |
| INV-009 | 发票统计图表 | 详细描述 | ✅ 已实现 | ✅ 通过 | ✅ 已验证 |

### 完成率统计

- **P0 功能:** X/X (100%)
- **P1 功能:** X/X (100%)
- **总体完成率:** X%

## 下一步行动

### 待修复问题

1. [ ] [问题描述] - 优先级：P0 - 预计完成时间：YYYY-MM-DD

### 待测试功能

1. [ ] [功能名称] - 计划测试时间：YYYY-MM-DD

## 附录

### 测试截图

- [截图 1: 描述](路径)
- [截图 2: 描述](路径)

### 测试日志

```
[粘贴关键日志]
```

---

**报告生成时间:** YYYY-MM-DD HH:mm:ss
**审核人:** [姓名]
**状态:** 已完成/部分完成
```

### 6.2 更新 PRD 检查清单

更新 `docs/PRD-Feature-Checklist.md`:

```markdown
## [模块名称] 模块检查清单

| 功能 ID | 功能名称 | 优先级 | PRD 要求 | 实现状态 | 验证结果 | 最后验证时间 | 备注 |
|---------|----------|--------|----------|----------|----------|--------------|------|
| XXX-001 | 功能名 | P0 | 详细描述 | ✅ | ✅ 通过 | YYYY-MM-DD | [备注] |

**验证证据:**
- 测试文件：`e2e/tests/[文件名].spec.ts`
- 测试报告：`e2e/test-reports/[日期]-test-report.md`
- 截图证据：`e2e-test-results/screenshots/[文件名].png`
```

### 6.3 更新任务跟踪文件

更新 `.claude/superpower-loop-task-001.local.md`:

```markdown
## 执行进度日志

### YYYY-MM-DD

- ✅ [任务 ID]: [任务名称]
  - 测试文件：`e2e/tests/[文件名].spec.ts`
  - 测试结果：X/X 通过 (X%)
  - 测试报告：`e2e/test-reports/[日期]-test-report.md`
  - 状态：已完成并验证

- ⚠️ [任务 ID]: [任务名称]
  - 测试结果：X/X 通过 (X%)
  - 失败原因：[原因]
  - 状态：待修复
```

---

## 7. 故障排查指南

### 7.1 MongoDB 问题

#### 问题：MongoDB 无法启动

**症状:**
```
Error: connect ECONNREFUSED ::1:27017
```

**排查步骤:**

1. 检查 MongoDB 服务状态
   ```bash
   sc query MongoDB
   ```

2. 检查端口占用
   ```bash
   netstat -ano | findstr :27017
   ```

3. 查看 MongoDB 日志
   ```bash
   # Windows 事件查看器
   eventvwr.msc
   # 查看 Applications and Services Logs -> MongoDB
   ```

**解决方案:**

```bash
# 重启 MongoDB 服务
net stop MongoDB
net start MongoDB

# 或使用 Docker 重启
docker restart jobportal-mongo
```

### 7.2 应用服务问题

#### 问题：前端服务无法启动

**症状:**
```
Error: Port 5137 is already in use
```

**解决方案:**

```bash
# 查找占用端口的进程
netstat -ano | findstr :5137

# 杀死占用端口的进程
taskkill /F /PID [进程 ID]

# 重启服务
npm run dev
```

#### 问题：后端服务编译错误

**症状:**
```
TSError: TypeScript compilation failed
```

**解决方案:**

```bash
# 清理缓存
cd server
npm run clean

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新编译
npm run build
```

### 7.3 测试执行问题

#### 问题：测试超时

**症状:**
```
Error: Timeout 30000ms exceeded
```

**解决方案:**

1. 增加超时时间
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     timeout: 60000, // 增加到 60 秒
   });
   ```

2. 优化等待策略
   ```typescript
   // 使用智能等待而非固定等待
   await page.waitForLoadState('networkidle');
   await expect(locator).toBeVisible({ timeout: 10000 });
   ```

#### 问题：元素找不到

**症状:**
```
Error: element(s) not found
```

**解决方案:**

1. 检查选择器
   ```typescript
   // 使用更稳定的选择器
   await page.locator('[data-testid="submit-btn"]');
   // 而非
   await page.locator('button[type="submit"]');
   ```

2. 添加等待
   ```typescript
   await page.waitForSelector('[data-testid="element"]');
   ```

3. 检查页面是否加载
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

### 7.4 认证问题

#### 问题：无法登录

**症状:**
```
Error: Login failed - Invalid credentials
```

**解决方案:**

1. 验证测试账号
   ```bash
   node src/seeders/verify-test-users.js
   ```

2. 重新创建测试账号
   ```bash
   node src/seeders/create-e2e-test-users.js
   ```

3. 检查密码是否正确
   ```typescript
   // test-auth.ts
   password: 'Test1234!' // 确保大小写正确
   ```

---

## 8. 附录

### 8.1 常用命令速查

```bash
# MongoDB 管理
net start MongoDB
net stop MongoDB
mongosh mongodb://localhost:27017/job-portal

# 应用服务
cd JobPortal/JobPortal
npm run dev
npm run build
npm run type-check

# 测试执行
npx playwright test
npx playwright test --headed
npx playwright test --reporter=html
npx playwright show-report

# 测试账号
cd JobPortal/JobPortal/server
node src/seeders/create-e2e-test-users.js
node src/seeders/verify-test-users.js
```

### 8.2 测试账号列表

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 管理员 | admin@test.com | Test1234! | 所有权限 |
| 自由顾问 | freelancer@test.com | Test1234! | 自由顾问权限 |
| 企业用户 | company@test.com | Test1234! | 企业用户权限 |

### 8.3 测试文件清单

| 文件 | 用途 | 测试数 | 执行时间 |
|------|------|--------|----------|
| reports-full-test.spec.ts | 完整用户旅程 | 3 | ~15s |
| reports-ui-validation.spec.ts | UI 组件验证 | 8 | ~30s |
| worklog-invoice-stats-prd.spec.ts | PRD 功能验证 | 10 | ~45s |

### 8.4 相关文档

- PRD 文档：`docs/PRD-Freelancer-Platform.md`
- 功能检查清单：`docs/PRD-Feature-Checklist.md`
- 工作规范：`.trae/rules/feature-development-workflow.md`
- 测试报告：`e2e/test-reports/`

### 8.5 版本历史

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-03-22 | 初始版本 | AI Assistant |

---

**文档维护说明:**

1. 每次测试流程优化后更新此文档
2. 发现新问题时更新故障排查指南
3. 新增测试场景时更新测试执行流程
4. 定期审查和更新环境要求

**文档审核周期:** 每月一次

**最后审核日期:** 2026-03-22

**下次审核日期:** 2026-04-22
