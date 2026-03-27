# JobPortal - 招聘门户系统

一个现代化的招聘平台，连接求职者和招聘企业。

## 🌟 功能特性

### 求职者功能
- ✅ 浏览和搜索职位
- ✅ 收藏职位
- ✅ 申请职位
- ✅ 发送消息给 HR
- ✅ 查看申请状态
- ✅ 查看收藏的职位

### HR/招聘者功能
- ✅ 发布新职位
- ✅ 管理已发布职位
- ✅ 查看求职者申请
- ✅ 接收求职者消息
- ✅ 管理申请状态（Pending/Reviewed/Accepted/Rejected）

### 通用功能
- ✅ 用户注册/登录
- ✅ 基于角色的权限管理
- ✅ 响应式设计（支持桌面和移动端）
- ✅ 实时搜索和筛选

## 🛠️ 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **React Router** - 路由管理
- **Axios** - HTTP 客户端

### 后端
- **Node.js** - 运行时
- **Express** - Web 框架
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 身份认证
- **Passport.js** - 认证中间件

### 开发工具
- **Docker & Docker Compose** - 容器化
- **Playwright** - E2E 测试

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

#### 后端
```bash
cd JobPortal/server
npm install
npm run dev
```

#### 前端
```bash
cd JobPortal/client
npm install
npm run dev
```

## 📝 测试账号

### 求职者账号
- 邮箱：`seeker@test.com`
- 密码：`Test123456`

### HR 账号
- 邮箱：`hr@test.com`
- 密码：`Test123456`

## 📊 数据库结构

### 主要集合
- `user_account` - 用户账户
- `user_type` - 用户类型（Job Seeker / HR Recruiter）
- `job` - 职位信息
- `job_type` - 职位类型（Full-time / Part-time 等）
- `company` - 公司信息
- `job_location` - 职位地址
- `application` - 求职申请
- `message` - 消息

## 🧪 测试

### E2E 测试
```bash
# 运行用户旅程测试
node e2e-user-journey.js

# 运行综合测试
node ui-test-comprehensive.js
```

### 测试结果
- HR 视角：6/6 通过
- 求职者视角：13/13 通过
- 总计：19/19 通过 (100%)

## 📁 项目结构

```
JobPortal/
├── JobPortal/
│   ├── client/          # 前端代码
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── services/
│   │       └── providers/
│   └── server/          # 后端代码
│       └── src/
│           ├── controllers/
│           ├── models/
│           ├── routes/
│           └── middlewares/
├── docker-compose.yml
├── e2e-user-journey.js
└── README.md
```

## 🔧 配置

### 环境变量
```bash
# 后端配置
MONGO_URL=mongodb://mongo:27017/job-portal
JWT_SECRET=your-secret-key
PORT=5555

# 前端配置
VITE_API_URL=http://localhost:5555/api/v1
```

## 📸 截图

![Homepage](screenshots/homepage.png)
![Post Job](screenshots/post-job.png)
![Job Detail](screenshots/job-detail.png)

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。

---

**开发时间**: 2026-03-19
**版本**: 1.0.0
