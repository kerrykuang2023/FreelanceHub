# 🎬 全角色业务流程演示指南

## 概述

本演示通过 Playwright 模拟真实用户操作，展示 JobPortal 系统中三个角色（自由顾问、HR 招聘官、系统管理员）的完整工作流程。

---

## 🎯 演示场景

### 场景 1: 自由顾问 (Freelancer) 完整工作流
- ✅ 登录系统
- ✅ 查看工作台 Dashboard
- ✅ 浏览可接项目
- ✅ 查看申请状态
- ✅ 工时管理
- ✅ 查看个人档案

### 场景 2: HR 招聘官完整工作流
- ✅ 登录系统
- ✅ 查看 HR 工作台
- ✅ 发布新项目（演示表单）
- ✅ 查看已发布项目
- ✅ 管理候选人申请
- ✅ 审核工时

### 场景 3: 系统管理员完整工作流
- ✅ 登录系统
- ✅ 查看管理后台
- ✅ 用户管理
- ✅ 公司管理
- ✅ 项目管理
- ✅ 工时管理
- ✅ 发票管理
- ✅ 系统管理子菜单展开

### 场景 4: 跨角色导航一致性验证
- ✅ 验证所有角色的顶部导航栏
- ✅ 验证面包屑导航
- ✅ 测量导航间距
- ✅ 截图对比

### 场景 5: 统一菜单组件功能演示
- ✅ 菜单项悬停效果
- ✅ 面包屑导航点击
- ✅ 响应式设计检查
- ✅ 角色标识显示
- ✅ 用户下拉菜单

---

## 🚀 运行演示

### 前置条件

确保服务已启动：

```powershell
# 终端 1 - 后端
cd d:\claudesapce\JobPortal\JobPortal\server
npm run dev

# 终端 2 - 前端
cd d:\claudesapce\JobPortal\JobPortal\client
npm run dev
```

### 运行完整演示

```powershell
cd d:\claudesapce\JobPortal

# 可视化模式运行（推荐）
npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --headed

# 慢速演示模式（便于观察）
npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --headed --timeout=60000
```

### 运行特定场景

```powershell
# 只运行自由顾问场景
npx playwright test -g "DEMO-FREELANCER-001" --headed

# 只运行 HR 场景
npx playwright test -g "DEMO-HR-001" --headed

# 只运行管理员场景
npx playwright test -g "DEMO-ADMIN-001" --headed

# 只运行导航一致性验证
npx playwright test -g "DEMO-CONSISTENCY-001" --headed

# 只运行菜单功能演示
npx playwright test -g "DEMO-MENU-001" --headed
```

### 生成并查看报告

```powershell
# 运行测试并生成 HTML 报告
npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --reporter=html

# 查看报告
npx playwright show-report
```

---

## 📸 演示输出

### 控制台输出示例

```
================================================================================
 场景：自由顾问日常工作流程
================================================================================

👤 登录为：自由顾问
  ✨ 操作：输入邮箱
  ✨ 操作：输入密码
  ✨ 操作：点击登录按钮
  📸 截图：login-自由顾问
  ✅ 登录成功

📊 步骤 2: 查看工作台
  📋 验证菜单项...
    ✅ 首页
    ✅ 我的项目
    ✅ 浏览项目
    ✅ 我的申请
    ✅ 工时管理
    ✅ 发票管理
  🍞 验证面包屑：首页 > Dashboard
  📸 截图：freelancer-dashboard

... (更多输出)

🎉 全角色业务流程演示完成！
```

### 截图文件

所有截图保存在 `test-results/` 目录：

```
test-results/
├── demo-login-自由顾问 -1711456789012.png
├── demo-freelancer-dashboard-1711456790123.png
├── demo-freelancer-browse-jobs-1711456791234.png
├── demo-freelancer-applications-1711456792345.png
├── demo-freelancer-worklogs-1711456793456.png
├── demo-freelancer-profile-1711456794567.png
├── demo-login-HR 招聘官 -1711456795678.png
├── demo-hr-dashboard-1711456796789.png
├── demo-hr-post-job-form-1711456797890.png
├── demo-hr-my-projects-1711456798901.png
├── demo-hr-applications-1711456799012.png
├── demo-hr-pending-worklogs-1711456800123.png
├── demo-login-系统管理员 -1711456801234.png
├── demo-admin-dashboard-1711456802345.png
├── demo-admin-users-1711456803456.png
├── demo-admin-companies-1711456804567.png
├── demo-admin-projects-1711456805678.png
├── demo-admin-worklogs-1711456806789.png
├── demo-admin-invoices-1711456807890.png
├── demo-admin-system-menu-1711456808901.png
├── demo-consistency-自由顾问-dashboard-1711456809012.png
├── demo-consistency-HR 招聘官-dashboard-1711456810123.png
├── demo-consistency-系统管理员-dashboard-1711456811234.png
└── demo-menu-features-demo-1711456812345.png
```

---

## 🎭 测试用户凭据

演示中使用的测试账号：

| 角色 | 邮箱 | 密码 | 用途 |
|------|------|------|------|
| 自由顾问 | freelancer@test.com | Test123456! | 演示求职者工作流程 |
| HR 招聘官 | hr@test.com | Test123456! | 演示招聘官工作流程 |
| 系统管理员 | admin@test.com | Test123456! | 演示管理员工作流程 |

---

## 📊 演示亮点

### 1. 真实用户操作模拟
- ✨ 高亮显示操作的元素
- 📸 每个关键步骤自动截图
- 🐢 适当的延迟便于观察

### 2. 完整的业务流程
- 🔄 从登录到登出
- 📋 所有主要功能模块
- 🎯 三个角色的完整工作流

### 3. 视觉验证
- 🎨 菜单项验证
- 🍞 面包屑路径验证
- 📏 间距测量
- ✨ 悬停效果展示

### 4. 详细日志
- 📝 控制台输出每个步骤
- ✅ 验证结果清晰显示
- ⚠️ 问题即时提示

---

## 🔍 演示验证点

### 统一菜单组件验证

**每个角色都会验证**:
- ✅ 顶部导航栏正确显示
- ✅ 菜单项根据角色动态显示
- ✅ 面包屑导航自动生成
- ✅ 导航栏到面包屑间距合理 (< 50px)
- ✅ 响应式设计正常

**菜单项一致性**:
- ✅ 与 QuickActionsMenu 保持一致
- ✅ 角色权限正确过滤
- ✅ 子菜单展开正常
- ✅ 用户下拉菜单功能完整

---

## 🛠️ 故障排查

### 问题 1: 登录失败

**症状**: 演示在登录步骤失败

**解决**:
```powershell
# 检查测试用户是否存在
# 查看后端日志，确认 seeder 运行成功

# 手动验证登录
# 访问 http://localhost:5137/login
# 使用 freelancer@test.com / Test123456! 测试
```

### 问题 2: 页面加载超时

**症状**: 页面加载超时错误

**解决**:
```powershell
# 检查服务是否运行
netstat -ano | findstr "5137"  # 前端
netstat -ano | findstr "5555"  # 后端

# 重启服务
cd d:\claudesapce\JobPortal\JobPortal\server
npm run dev

cd d:\claudesapce\JobPortal\JobPortal\client
npm run dev
```

### 问题 3: 菜单项验证失败

**症状**: 某些菜单项显示为 ❌

**解决**:
```powershell
# 检查 UnifiedHeader 组件中的菜单配置
# 确保角色权限正确
# 更新测试中的 expectedMenuItems
```

### 问题 4: 截图失败

**症状**: 截图文件未生成

**解决**:
```powershell
# 确保 test-results 目录存在
mkdir test-results

# 检查磁盘空间
# 检查文件权限
```

---

## 📈 演示统计

| 指标 | 数值 |
|------|------|
| 测试场景数 | 5 |
| 测试用例数 | 5 |
| 预期截图数 | ~20 |
| 覆盖角色 | 3 |
| 覆盖页面 | 15+ |
| 预计运行时间 | 5-10 分钟 |

---

## 🎓 学习要点

通过观看此演示，您可以：

1. **了解系统全貌**: 一次性了解三个角色的所有主要功能
2. **验证 UI 一致性**: 看到统一的导航体验
3. **发现潜在问题**: 详细日志帮助发现问题
4. **学习 Playwright**: 了解如何编写 E2E 测试
5. **演示给客户**: 可用于客户演示或培训

---

## 📹 录制演示视频（可选）

如果需要录制演示视频：

```powershell
# 使用 Playwright 的录像功能
npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --headed --video=on

# 视频保存在 test-results/ 目录
```

或使用屏幕录制软件：
- OBS Studio (免费)
- Windows Game Bar (Win + G)
- Camtasia

---

## 📞 支持

如有问题，请检查：
1. 控制台日志输出
2. Playwright HTML 报告
3. 截图文件
4. 后端和前端的日志

---

**文档版本**: v1.0  
**最后更新**: 2026-03-26  
**维护者**: AI Assistant
