# JobPortal - SAP顾问自由职业平台

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)](https://www.mongodb.com/)

**[🇺🇸 English Documentation](README_EN.md)**

---

一个现代化的多语言招聘平台，连接自由顾问（Freelancer）、HR招聘者和企业管理员。基于 React 18、TypeScript、Node.js 和 MongoDB 构建。

## 🌟 核心特色

### 🌐 国际化 (i18n)
- **多语言支持**: 完整支持中文、英文和日文
- **动态语言切换**: 无需刷新页面即可实时切换语言
- **完整翻译覆盖**: 所有UI元素、菜单、按钮和消息均已翻译
- **语言持久化**: 用户语言偏好保存在 localStorage 中

### 👤 自由顾问 (Freelancer) 工作台
- **工作台仪表板**: 显示本周工时、进行中项目、待收款、待审核申请
- **项目管理**: 查看进行中的项目、项目详情、工时记录
- **职位浏览**: 浏览和搜索职位、申请职位
- **申请管理**: 查看申请状态、申请历史
- **工时管理**: 提交工时记录、查看工时统计

### 👔 HR招聘者 (HR Recruiter) 工作台
- **工作台仪表板**: 显示有效职位、待审工时、收到的申请、本月支出
- **职位发布**: 发布新职位、管理已发布职位
- **申请审核**: 查看求职者申请、审核申请状态
- **工时审核**: 审核顾问提交的工时记录

### 🔧 系统管理员 (Admin) 工作台
- **工作台仪表板**: 显示总用户数、自由顾问、注册企业、待处理发票等
- **用户管理**: 管理用户账户、角色权限
- **企业管理**: 审核企业注册、管理企业信息
- **系统配置**: 管理技能分类、工时类型、税率、货币等配置
- **数据统计**: 项目需求、工时记录、发票总数等统计

### 🔐 认证与权限
- **用户认证**: 登录/注册/登出
- **角色权限**: 基于角色的访问控制 (RBAC)
- **动态菜单**: 根据用户角色显示不同菜单

## 📸 系统截图

### 🔐 登录页面 - 多语言支持

| 中文 | English | 日本語 |
|:----:|:-------:|:------:|
| [![登录中文](docs/screenshots/readme/login-zh.png)](docs/screenshots/readme/login-zh.png) | [![Login English](docs/screenshots/readme/login-en.png)](docs/screenshots/readme/login-en.png) | [![ログイン日本語](docs/screenshots/readme/login-ja.png)](docs/screenshots/readme/login-ja.png) |

> 📌 点击图片查看大图

### 📊 工作台视图

| Freelancer 工作台 | Admin 工作台 |
|:-----------------:|:------------:|
| [![Freelancer工作台](docs/screenshots/readme/freelancer-dashboard-en.png)](docs/screenshots/readme/freelancer-dashboard-en.png) | [![Admin工作台](docs/screenshots/readme/admin-dashboard-en.png)](docs/screenshots/readme/admin-dashboard-en.png) |

> 📌 点击图片查看大图

### 🎯 功能截图

#### 📋 职位列表
[![职位列表](docs/screenshots/readme/jobs-list-en.png)](docs/screenshots/readme/jobs-list-en.png)

#### 🌐 中文工作台
[![中文工作台](docs/screenshots/readme/freelancer-dashboard-zh.png)](docs/screenshots/readme/freelancer-dashboard-zh.png)

## 🛠️ 技术栈

### 前端
| 技术 | 描述 |
|------|------|
| **React 18** | 现代化UI框架，支持Hooks |
| **TypeScript** | 类型安全的JavaScript开发 |
| **Tailwind CSS** | 实用优先的CSS框架 |
| **React Router v6** | 客户端路由 |
| **React Query** | 服务端状态管理 |
| **i18next** | 国际化框架 |

### 后端
| 技术 | 描述 |
|------|------|
| **Node.js** | JavaScript运行时 |
| **Express** | Web框架 |
| **MongoDB** | NoSQL数据库 |
| **Mongoose** | MongoDB对象建模 |
| **JWT** | JSON Web Token身份认证 |
| **Passport.js** | 认证中间件 |

### 开发工具
| 工具 | 描述 |
|------|------|
| **Docker** | 容器化 |
| **Playwright** | E2E测试 |
| **Vite** | 前端构建工具 |

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MongoDB 4.4+
- Docker (可选)

### 使用 Docker（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 访问应用
# 前端：http://localhost:5137
# 后端 API: http://localhost:5555/api/v1
```

### 手动启动

```bash
# 后端
cd JobPortal/server
npm install
npm run dev

# 前端（另一个终端）
cd JobPortal/client
npm install
npm run dev
```

## 📝 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 自由顾问 | freelancer@test.com | Test123456! |
| HR招聘者 | hr@test.com | Test123456! |
| 系统管理员 | admin@test.com | Test123456! |
| 超级管理员 | admin@jobportal.com | Admin@123 |

## 🧪 测试

```bash
# 运行国际化语言切换测试
npx playwright test e2e-tests/i18n-language-switch.spec.ts --headed

# 运行跨角色E2E测试
npx playwright test e2e-tests/cross-role-e2e.spec.ts --headed

# 运行工作台数据验证
npx playwright test e2e-tests/dashboard-data.spec.ts --headed
```

## 📁 项目结构

```
JobPortal/
├── JobPortal/
│   ├── client/                    # 前端代码
│   │   └── src/
│   │       ├── components/        # React组件
│   │       ├── pages/             # 页面组件
│   │       ├── services/          # API服务
│   │       ├── hooks/             # 自定义Hooks
│   │       ├── i18n/              # 国际化
│   │       │   └── locales/       # 翻译文件
│   │       │       ├── zh/        # 中文
│   │       │       ├── en/        # 英文
│   │       │       └── ja/        # 日文
│   │       └── providers/         # Context Provider
│   └── server/                    # 后端代码
│       └── src/
│           ├── controllers/       # 路由控制器
│           ├── models/            # 数据模型
│           ├── routes/            # API路由
│           └── middlewares/       # Express中间件
├── e2e-tests/                     # E2E测试文件
├── docs/                          # 文档
└── docker-compose.yml
```

## 🔄 最近更新

### 2026-03-30
- 🌐 **重大国际化更新**: 完成所有页面的国际化改造
  - 添加中文、英文、日文翻译支持
  - 更新所有工作台页面的完整翻译覆盖
  - 添加语言切换器组件
  - 创建全面的国际化E2E测试验证

### 2026-03-28
- 🐛 修复 StorageService JSON 解析错误
- 🐛 修复 AuthProvider 数据解析错误
- ✨ 添加跨角色 E2E 测试
- ✨ 优化工作台数据加载逻辑

## 🤝 贡献

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

---

<p align="center">
  <b>创建时间</b>: 2026-03-19 &nbsp;|&nbsp; 
  <b>最后更新</b>: 2026-03-30 &nbsp;|&nbsp; 
  <b>版本</b>: 1.1.0
</p>
