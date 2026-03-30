# Unified Header 测试运行指南

## 前置条件

确保服务已经启动：

```powershell
# 终端 1 - 启动后端
cd d:\claudesapce\JobPortal\JobPortal\server
npm run dev

# 终端 2 - 启动前端
cd d:\claudesapce\JobPortal\JobPortal\client
npm run dev
```

## 运行测试

### 方式 1: 运行所有统一菜单测试

```powershell
cd d:\claudesapce\JobPortal

# 运行菜单一致性测试（有头模式，可视化）
npx playwright test e2e-tests/unified-header-menu-consistency.spec.ts --headed

# 或者无头模式（快速）
npx playwright test e2e-tests/unified-header-menu-consistency.spec.ts
```

### 方式 2: 运行页面数据分析测试

```powershell
cd d:\claudesapce\JobPortal

# 运行页面数据收集和分析测试
npx playwright test e2e-tests/page-data-collection-ux-analysis.spec.ts --headed
```

### 方式 3: 运行单个测试

```powershell
# 运行特定角色的测试
npx playwright test -g "FREELANCER-MENU-001"
npx playwright test -g "HR-MENU-001"
npx playwright test -g "ADMIN-MENU-001"

# 运行视觉一致性测试
npx playwright test -g "VISUAL"
```

### 方式 4: 生成 HTML 报告

```powershell
cd d:\claudesapce\JobPortal

# 运行测试并生成 HTML 报告
npx playwright test e2e-tests/unified-header-menu-consistency.spec.ts --reporter=html

# 查看报告
npx playwright show-report
```

## 测试输出

### 控制台输出示例

```
📋 Testing Freelancer Dashboard Menu...
  Menu Items Check: ✅
  Breadcrumbs: ✅
    Items: 首页 > Dashboard
  Nav to Breadcrumb spacing: 0px

📋 Testing Freelancer Jobs Page Menu...
  Menu Items Check: ✅
  Breadcrumbs: ✅
    Items: 首页 > 项目列表
```

### 截图保存位置

```
test-results/
├── unified-menu-freelancer-dashboard-1711456789012.png
├── unified-menu-freelancer-jobs-1711456790123.png
├── unified-menu-hr-dashboard-1711456791234.png
├── unified-menu-admin-dashboard-1711456792345.png
└── ...
```

### HTML 报告

```
playwright-report/
├── index.html
└── ...
```

## 验证检查点

### 1. 菜单项验证

**Freelancer 角色应该看到**:
- ✅ 首页
- ✅ 我的项目
- ✅ 浏览项目
- ✅ 我的申请
- ✅ 收藏职位
- ✅ 工时管理
- ✅ 发票管理
- ✅ 消息

**HR 角色应该看到**:
- ✅ 首页
- ✅ 我的项目
- ✅ 发布职位
- ✅ 申请管理
- ✅ 工时管理
- ✅ 发票管理
- ✅ 消息

**Admin 角色应该看到**:
- ✅ 首页
- ✅ 我的项目
- ✅ 发布职位
- ✅ 申请管理
- ✅ 工时管理
- ✅ 发票管理
- ✅ 消息
- ✅ 系统管理（带子菜单）

### 2. 面包屑验证

每个页面都应该显示正确的面包屑路径：
- Dashboard: `首页 > Dashboard`
- Jobs: `首页 > 项目列表`
- Post Job: `首页 > 发布项目`
- Applications: `首页 > 我的申请`

### 3. 间距验证

- 导航栏到面包屑间距：0-10px (紧凑设计)
- 面包屑到内容间距：24px
- 导航栏高度：约 64-72px

### 4. 视觉一致性验证

- 所有页面导航栏背景色一致
- 所有页面面包屑样式一致
- 所有页面字体和颜色一致

## 常见问题排查

### 问题 1: 测试失败 "Menu Items Check: ❌"

**原因**: 菜单项与预期不一致

**解决**:
1. 检查 UnifiedHeader 组件中的菜单配置
2. 确保角色权限正确
3. 更新测试中的 expectedMenuItems

### 问题 2: "Breadcrumbs: ❌"

**原因**: 面包屑组件未显示

**解决**:
1. 检查 UnifiedHeader 中的 generateBreadcrumbs 函数
2. 确保 location.pathname 正确
3. 检查 breadcrumbNav 选择器

### 问题 3: 登录失败

**原因**: 测试用户不存在或密码错误

**解决**:
```powershell
# 检查后端 seeder 是否运行
# 查看后端日志，确认测试用户已创建

# 测试用户凭据:
# Freelancer: freelancer@test.com / Test123456!
# HR: hr@test.com / Test123456!
# Admin: admin@test.com / Test123456!
```

### 问题 4: 页面加载超时

**原因**: 服务未启动或响应慢

**解决**:
```powershell
# 检查服务状态
netstat -ano | findstr "5137"  # 前端
netstat -ano | findstr "5555"  # 后端

# 重启服务
# 终端 1
cd d:\claudesapce\JobPortal\JobPortal\server
npm run dev

# 终端 2
cd d:\claudesapce\JobPortal\JobPortal\client
npm run dev
```

## 测试完成标准

所有测试通过且满足以下条件：

- [ ] 所有角色的菜单项正确显示
- [ ] 所有页面面包屑正确显示
- [ ] 间距符合设计规范 (0-50px)
- [ ] 视觉样式一致
- [ ] 截图验证通过
- [ ] 无控制台错误

## 快速验证脚本

```powershell
# 一键运行所有测试并生成报告
cd d:\claudesapce\JobPortal

Write-Host "Running Unified Header Tests..." -ForegroundColor Cyan
npx playwright test e2e-tests/unified-header-menu-consistency.spec.ts --reporter=html

Write-Host "`nOpening test report..." -ForegroundColor Cyan
npx playwright show-report

Write-Host "`nTests completed!" -ForegroundColor Green
```

---

**文档版本**: v1.0  
**最后更新**: 2026-03-26
