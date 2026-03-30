# 🚀 快速运行演示 - 一分钟指南

## ⚡ 最快方式（1 条命令）

```powershell
cd d:\claudesapce\JobPortal && npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --headed
```

---

## 📋 完整步骤

### 1️⃣ 确保服务运行

**终端 1** - 启动后端：
```powershell
cd d:\claudesapce\JobPortal\JobPortal\server
npm run dev
```

**终端 2** - 启动前端：
```powershell
cd d:\claudesapce\JobPortal\JobPortal\client
npm run dev
```

### 2️⃣ 运行演示

**终端 3** - 运行完整演示：
```powershell
cd d:\claudesapce\JobPortal
npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --headed
```

---

## 🎯 运行特定场景

```powershell
# 自由顾问场景
npx playwright test -g "DEMO-FREELANCER" --headed

# HR 招聘官场景
npx playwright test -g "DEMO-HR" --headed

# 系统管理员场景
npx playwright test -g "DEMO-ADMIN" --headed

# 导航一致性验证
npx playwright test -g "DEMO-CONSISTENCY" --headed

# 菜单功能演示
npx playwright test -g "DEMO-MENU" --headed
```

---

## 📊 查看结果

### 查看截图
```powershell
# 打开截图目录
explorer d:\claudesapce\JobPortal\test-results
```

### 查看 HTML 报告
```powershell
# 生成并打开报告
npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --reporter=html
npx playwright show-report
```

---

## 🎬 使用交互式脚本

```powershell
cd d:\claudesapce\JobPortal\scripts
.\run-full-demo.ps1
```

脚本提供：
- ✅ 环境检查
- ✅ 场景选择菜单
- ✅ 结果统计
- ✅ 可选查看报告

---

## 📸 输出示例

**控制台输出**：
```
👤 登录为：自由顾问
  ✨ 操作：输入邮箱
  ✨ 操作：输入密码
  📸 截图：login-自由顾问
  ✅ 登录成功

📊 步骤 2: 查看工作台
  📋 验证菜单项...
    ✅ 首页
    ✅ 我的项目
    ✅ 浏览项目
  🍞 验证面包屑：首页 > Dashboard
```

**截图文件**：
```
test-results/
├── demo-login-自由顾问.png
├── demo-freelancer-dashboard.png
├── demo-hr-dashboard.png
└── demo-admin-dashboard.png
```

---

## 🐛 常见问题

**Q: 登录失败？**
```powershell
# 检查测试用户
# freelancer@test.com / Test123456!
# hr@test.com / Test123456!
# admin@test.com / Test123456!
```

**Q: 页面加载超时？**
```powershell
# 检查服务
netstat -ano | findstr "5137"  # 前端
netstat -ano | findstr "5555"  # 后端
```

**Q: 没有截图生成？**
```powershell
# 创建目录
mkdir test-results
```

---

## 📚 完整文档

- [完整演示指南](file:///d:/claudesapce/JobPortal/docs/full-demo-guide.md)
- [改造报告](file:///d:/claudesapce/JobPortal/docs/unified-header-refactoring-report.md)

---

## 🎯 测试用户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 自由顾问 | freelancer@test.com | Test123456! |
| HR | hr@test.com | Test123456! |
| 管理员 | admin@test.com | Test123456! |

---

**开始演示，只需 1 分钟！** 🚀
