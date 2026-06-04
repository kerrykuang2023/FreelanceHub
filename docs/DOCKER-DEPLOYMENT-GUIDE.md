# FreelanceHub Docker Deployment Guide

更新日期：2026-06-03

本文档记录当前已验证可用的 Docker 部署方式。旧文档中“Docker 启动有问题，建议只用 Docker 跑 MongoDB，前后端本地启动”的经验已经过期。

## 当前结论

推荐使用完整 Docker Compose 启动：

```powershell
docker compose up --build -d
```

已验证服务：

| 服务 | 容器 | 访问地址 | 预期状态 |
| --- | --- | --- | --- |
| 前端 | `job-portal-client` | http://localhost:5137 | healthy |
| 后端 | `job-portal-server` | http://localhost:5555/health | healthy |
| MongoDB | `job-portal-mongo` | `mongodb://localhost:27017/jobportal` | healthy |

后端 API 地址：

```text
http://localhost:5555/api/v1
```

## 启动步骤

1. 确认 Docker Desktop 已启动。
2. 在项目根目录执行：

```powershell
docker compose up --build -d
```

3. 查看容器状态：

```powershell
docker compose ps
```

4. 验证服务：

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5137
Invoke-WebRequest -UseBasicParsing http://localhost:5555/health
```

5. 验证登录：

```powershell
$body = @{ email = "admin@test.com"; password = "Test123456!" } | ConvertTo-Json
Invoke-WebRequest -UseBasicParsing `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  http://localhost:5555/api/v1/auth/login
```

## 测试账号

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | `admin@test.com` | `Test123456!` |
| 超级管理员 | `admin@jobportal.com` | `Admin@123` |
| 自由顾问 | `freelancer@test.com` | `Test123456!` |
| HR | `hr@test.com` | `Test123456!` |

## 配置说明

`docker-compose.yml` 会提供本地开发所需的默认配置：

| 变量 | Docker 默认值 | 说明 |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://mongo:27017/jobportal` | 容器内连接 MongoDB |
| `PORT` | `5555` | 后端端口 |
| `CORS_ORIGIN` | `http://localhost:5137` | 允许前端访问后端 |
| `VITE_API_URL` | `http://localhost:5555/api/v1` | 浏览器访问后端 API |
| `JWT_SECRET` | `local_dev_secret_change_me` | 仅适合本地开发 |

生产或共享环境必须显式设置强随机 `JWT_SECRET`：

```powershell
$env:JWT_SECRET = "replace-with-a-long-random-secret"
docker compose up --build -d
```

## 这次修复的关键点

1. 前端容器的 `VITE_API_URL` 改为浏览器可访问的 `http://localhost:5555/api/v1`，避免浏览器请求容器内服务名。
2. 后端容器补齐 `JWT_SECRET`、`CORS_ORIGIN`、`PORT` 等必要环境变量。
3. MongoDB、后端、前端都增加 healthcheck，并按依赖顺序启动。
4. Dockerfile 改用 `npm ci`，让依赖安装与 lockfile 保持一致。
5. `server/.env.example` 移除真实云数据库连接串，改为本地安全占位配置。
6. 由于本地环境拉取 Docker Hub `node:20` 镜像元数据不稳定，当前 Dockerfile 基于已可拉取的 `mongo:latest` 镜像安装 Node 20 tarball，绕开 `node:20` 拉取失败问题。

## 常见问题

### Docker Hub 拉取 `node:20` 超时

当前配置不再依赖 `node:20` 镜像，因此这个问题不会阻塞构建。构建时仍需要访问 `https://nodejs.org` 下载 Node 20 tarball；如果该地址也无法访问，需要检查 Docker Desktop 代理或网络策略。

### 容器状态不是 healthy

先查看状态和日志：

```powershell
docker compose ps
docker compose logs server
docker compose logs client
docker compose logs mongo
```

常见原因：

| 现象 | 处理 |
| --- | --- |
| `5555` 或 `5137` 端口被占用 | 停掉占用端口的本地进程，或临时修改 compose 端口映射 |
| 后端无法连接数据库 | 确认 `mongo` 容器 healthy，再重启 `server` |
| 前端无法登录 | 确认 `VITE_API_URL` 是 `http://localhost:5555/api/v1` |
| 登录 token 异常 | 确认 `JWT_SECRET` 已设置且后端已重启 |

### 需要回退到本地开发

如果只想用 Docker 跑数据库，前后端本地开发，可以使用：

```powershell
docker compose up -d mongo

cd server
npm ci
npm run dev

cd ..\client
npm ci
npm run dev
```

本地开发时后端使用：

```text
MONGODB_URI=mongodb://localhost:27017/jobportal
```

## 关闭服务

```powershell
docker compose down
```

如果需要清空数据库卷：

```powershell
docker compose down -v
```
