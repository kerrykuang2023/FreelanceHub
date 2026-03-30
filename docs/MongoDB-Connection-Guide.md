# MongoDB连接与启动手册

**文档版本:** v1.0  
**创建日期:** 2026-03-24  
**维护者:** AI Assistant

---

## 1. 概述

本文档描述了JobPortal项目的MongoDB数据库连接配置和启动流程，确保开发环境能够正确连接数据库。

---

## 2. 环境要求

### 2.1 必备软件

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Docker Desktop | 最新版 | 运行MongoDB容器 |
| Node.js | >= 18.x | 运行后端服务 |
| npm | >= 9.x | 包管理 |

### 2.2 Docker容器要求

确保Docker Desktop已启动，并运行以下容器：

| 容器名称 | 端口 | 用途 |
|----------|------|------|
| job-portal-mongo | 27017 | MongoDB数据库 |
| job-portal-server | 5555 | 后端API服务（可选，本地开发时可停止） |

---

## 3. 快速启动指南

### 3.1 启动Docker MongoDB

```powershell
# 1. 启动Docker Desktop（如果未运行）

# 2. 检查MongoDB容器状态
docker ps --filter "name=mongo"

# 3. 如果容器不存在，创建并启动
docker run -d --name job-portal-mongo -p 27017:27017 mongo:latest

# 4. 如果容器已存在但未运行，启动它
docker start job-portal-mongo
```

### 3.2 配置环境变量

确保 `server/.env` 文件包含正确的MongoDB连接配置：

```env
# MongoDB Configuration (Docker Local)
MONGO_URI=mongodb://localhost:27017/jobportal
MONGO_URL=mongodb://localhost:27017/jobportal
```

### 3.3 启动后端服务

```powershell
# 进入服务器目录
cd JobPortal/server

# 安装依赖（首次运行）
npm install

# 启动服务
npm start
```

### 3.4 验证连接成功

启动成功后，控制台应显示以下日志：

```
✅[Database]: MongoDB connected successfully
🌱[Server]: Running seeders...
✅[Server]: All seeders completed successfully!
⚡️[Server]: Server is running at http://localhost:5555
```

---

## 4. 测试用户凭据

系统启动时会自动创建以下测试用户：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@test.com | Test1234! |
| 顾问 | freelancer@test.com | Test1234! |
| HR | hr@test.com | Test1234! |

**注意:** 另有一个系统管理员账户：
- 邮箱: `admin@jobportal.com`
- 密码: `admin123`

---

## 5. 常见问题排查

### 5.1 MongoDB连接失败

**错误信息:**
```
❌[Database]: Failed to connect to MongoDB: Error: connect ECONNREFUSED
```

**解决方案:**
1. 检查Docker Desktop是否运行
2. 检查MongoDB容器是否启动
3. 确认端口27017未被占用

```powershell
# 检查Docker容器状态
docker ps -a | findstr mongo

# 检查端口占用
netstat -ano | findstr 27017
```

### 5.2 DNS解析失败（MongoDB Atlas）

**错误信息:**
```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.xxx.mongodb.net
```

**原因:** 网络无法访问MongoDB Atlas

**解决方案:** 使用本地Docker MongoDB代替

### 5.3 端口被占用

**错误信息:**
```
Error: listen EADDRINUSE: address already in use :::5555
```

**解决方案:**
```powershell
# 停止Docker中的服务器容器
docker stop job-portal-server

# 或查找并结束占用端口的进程
netstat -ano | findstr 5555
taskkill /PID <进程ID> /F
```

### 5.4 Seeders执行失败

**错误信息:**
```
❌[Seeder]: Error seeding test users
```

**解决方案:**
1. 检查数据库连接是否正常
2. 检查UserType集合是否有数据
3. 手动运行seeders:
```powershell
cd server
npx ts-node src/seeders/test-users.seeder.ts
```

---

## 6. 完整启动流程

### 6.1 一键启动脚本

创建 `start-dev.ps1` 文件：

```powershell
# start-dev.ps1

Write-Host "=== JobPortal 开发环境启动 ===" -ForegroundColor Green

# 1. 检查Docker
Write-Host "检查Docker状态..." -ForegroundColor Yellow
$dockerStatus = docker ps 2>&1
if ($dockerStatus -match "error") {
    Write-Host "请先启动Docker Desktop!" -ForegroundColor Red
    exit 1
}

# 2. 检查MongoDB容器
Write-Host "检查MongoDB容器..." -ForegroundColor Yellow
$mongoContainer = docker ps --filter "name=job-portal-mongo" --format "{{.Names}}"
if (-not $mongoContainer) {
    Write-Host "启动MongoDB容器..." -ForegroundColor Yellow
    docker start job-portal-mongo 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "创建新的MongoDB容器..." -ForegroundColor Yellow
        docker run -d --name job-portal-mongo -p 27017:27017 mongo:latest
    }
}

# 3. 停止可能冲突的服务器容器
Write-Host "检查端口冲突..." -ForegroundColor Yellow
docker stop job-portal-server 2>$null

# 4. 启动后端服务
Write-Host "启动后端服务..." -ForegroundColor Yellow
Set-Location server
npm start
```

### 6.2 使用方法

```powershell
# 在项目根目录执行
.\start-dev.ps1
```

---

## 7. 数据库管理

### 7.1 连接MongoDB

```powershell
# 使用Docker exec连接
docker exec -it job-portal-mongo mongosh

# 或使用MongoDB Compass连接
# 连接字符串: mongodb://localhost:27017
```

### 7.2 常用数据库操作

```javascript
// 在mongosh中执行

// 查看所有数据库
show dbs

// 切换到jobportal数据库
use jobportal

// 查看所有集合
show collections

// 查看用户
db.user_account.find().pretty()

// 查看用户类型
db.user_type.find().pretty()

// 删除测试用户（如需重新创建）
db.user_account.deleteMany({email: {$in: ["admin@test.com", "freelancer@test.com", "hr@test.com"]}})
db.user_role.deleteMany({user_id: {$exists: true}})
```

### 7.3 重置数据库

```powershell
# 停止并删除MongoDB容器
docker stop job-portal-mongo
docker rm job-portal-mongo

# 重新创建容器
docker run -d --name job-portal-mongo -p 27017:27017 mongo:latest

# 重启后端服务（会自动运行seeders）
cd server
npm start
```

---

## 8. E2E测试配置

### 8.1 测试环境要求

- MongoDB运行在 `localhost:27017`
- 后端服务运行在 `localhost:5555`
- 前端服务运行在 `localhost:5137`

### 8.2 运行E2E测试

```powershell
# 1. 确保所有服务已启动
docker ps | findstr mongo
netstat -ano | findstr 5555
netstat -ano | findstr 5137

# 2. 运行测试
cd JobPortal/e2e
npx playwright test complete-p0-p1-test.spec.ts
```

### 8.3 测试用户

E2E测试使用的用户凭据：

| 用户 | 邮箱 | 密码 |
|------|------|------|
| 顾问 | freelancer@test.com | Test1234! |
| HR | hr@test.com | Test1234! |
| 管理员 | admin@test.com | Test1234! |

---

## 9. 附录

### 9.1 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| MONGO_URI | MongoDB连接字符串 | mongodb://localhost:27017/jobportal |
| MONGO_URL | MongoDB连接字符串（备用） | mongodb://localhost:27017/jobportal |
| PORT | 后端服务端口 | 5555 |
| JWT_SECRET | JWT密钥 | jobportal_jwt_secret_key_2026 |
| CORS_ORIGIN | 允许的前端源 | http://localhost:5137 |

### 9.2 相关文件

| 文件 | 说明 |
|------|------|
| server/.env | 后端环境配置 |
| client/.env | 前端环境配置 |
| server/src/config/database.config.ts | 数据库连接配置 |
| server/src/seeders/test-users.seeder.ts | 测试用户种子数据 |

---

**文档版本:** v1.0  
**最后更新:** 2026-03-24
