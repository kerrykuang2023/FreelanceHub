# MongoDB 诊断与修复方案

**创建日期:** 2026-03-23
**问题:** MongoDB启动失败，连接不稳定

---

## 一、诊断结果

### 1.1 根本原因分析

通过诊断发现以下问题：

| 问题 | 状态 | 说明 |
|------|------|------|
| MongoDB未安装 | ❌ | 系统未安装MongoDB |
| .env文件缺失 | ❌ | server目录缺少.env文件 |
| Atlas连接失败 | ❌ | DNS解析失败 `_mongodb._tcp.cluster0.mc54czr.mongodb.net` |
| 端口5555被占用 | ⚠️ | 旧进程未正确关闭 |

### 1.2 错误日志分析

```
❌[Server] Database connection error: Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.mc54czr.mongodb.net
```

**原因:** MongoDB Atlas云数据库的SRV记录无法解析，可能原因：
1. 网络连接问题
2. Atlas集群已暂停/删除
3. 连接凭据已过期

---

## 二、解决方案

### 方案A: 使用本地MongoDB（推荐生产环境）

#### 步骤1: 安装MongoDB Community Edition

1. 下载MongoDB Community Server:
   - 地址: https://www.mongodb.com/try/download/community
   - 选择: Version 7.0, Windows, MSI Installer

2. 安装时选择:
   - Complete 安装
   - 安装路径: `C:\Program Files\MongoDB\Server\7.0`
   - 数据目录: `C:\data\db`

3. 验证安装:
   ```powershell
   & "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --version
   ```

#### 步骤2: 创建数据目录

```powershell
New-Item -ItemType Directory -Force -Path "C:\data\db"
```

#### 步骤3: 启动MongoDB服务

```powershell
# 以服务方式启动（推荐）
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db" --bind_ip 127.0.0.1 --port 27017 --install
Start-Service MongoDB

# 或手动启动
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db" --bind_ip 127.0.0.1 --port 27017
```

#### 步骤4: 验证MongoDB

```powershell
# 检查服务状态
Get-Service MongoDB

# 测试连接
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe"
> db.adminCommand({ping:1})
```

#### 步骤5: 更新.env文件

```env
PORT=5555
MONGO_URL=mongodb://127.0.0.1:27017/job-portal
NODE_ENV=development
```

---

### 方案B: 使用MongoDB Atlas云数据库（开发环境）

#### 步骤1: 检查Atlas集群状态

1. 登录 https://cloud.mongodb.com
2. 检查集群状态（是否暂停）
3. 检查网络访问白名单

#### 步骤2: 获取标准连接字符串

不使用SRV格式，使用标准格式：

```
mongodb://<username>:<password>@cluster0-shard-00-00.mc54czr.mongodb.net:27017,cluster0-shard-00-01.mc54czr.mongodb.net:27017,cluster0-shard-00-02.mc54czr.mongodb.net:27017/?retryWrites=true&w=majority
```

#### 步骤3: 更新.env文件

```env
PORT=5555
MONGO_URL=mongodb://<username>:<password>@cluster0-shard-00-00.mc54czr.mongodb.net:27017/?retryWrites=true&w=majority
NODE_ENV=development
```

#### 步骤4: 测试连接

```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "<your_connection_string>"
> db.adminCommand({ping:1})
```

---

## 三、稳定启动检查清单

### 3.1 启动前检查

```powershell
# 1. 检查MongoDB进程
Get-Process mongod -ErrorAction SilentlyContinue

# 2. 检查MongoDB端口
netstat -ano | findstr "27017"

# 3. 检查后端端口
netstat -ano | findstr "5555"

# 4. 关闭占用端口的进程
Stop-Process -Id <PID> -Force
```

### 3.2 启动顺序

1. **启动MongoDB** (如果使用本地)
2. **启动后端服务** (端口5555)
3. **启动前端服务** (端口5137)

### 3.3 验证服务健康

```powershell
# 后端健康检查
Invoke-WebRequest -Uri http://localhost:5555/api/v1/health -Method GET

# 前端健康检查
Invoke-WebRequest -Uri http://localhost:5137 -Method GET
```

---

## 四、配置文件

### 4.1 Server .env (已创建)

位置: `JobPortal/server/.env`

```env
PORT=5555
MONGO_URL=mongodb://127.0.0.1:27017/job-portal
NODE_ENV=development
```

### 4.2 Client .env (已存在)

位置: `JobPortal/client/.env`

```env
VITE_API_URL=http://localhost:5555/api/v1
```

---

## 五、故障排除

### 5.1 常见错误

| 错误 | 解决方案 |
|------|----------|
| `address already in use` | 关闭占用端口的进程: `Stop-Process -Id <PID> -Force` |
| `ECONNREFUSED 127.0.0.1:27017` | 启动MongoDB服务 |
| `querySrv ENOTFOUND` | 检查网络连接或切换到标准连接字符串 |
| `authentication failed` | 检查用户名密码是否正确 |

### 5.2 快速修复脚本

创建 `fix-mongo.ps1`:

```powershell
# 停止所有相关进程
Get-Process -Name "node,mongod" -ErrorAction SilentlyContinue | Stop-Process -Force

# 等待5秒
Start-Sleep -Seconds 5

# 检查MongoDB状态
$port = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if (-not $port) {
    Write-Host "MongoDB not running. Starting..."
    Start-Process -FilePath "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" -ArgumentList "--dbpath C:\data\db --bind_ip 127.0.0.1 --port 27017" -NoNewWindow
}

# 等待MongoDB启动
Start-Sleep -Seconds 10

# 重启后端
Set-Location "d:\claudesapce\JobPortal\JobPortal\server"
Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow

# 等待后端启动
Start-Sleep -Seconds 15

# 重启前端
Set-Location "d:\claudesapce\JobPortal\JobPortal\client"
Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow

Write-Host "All services restarted!"
```

---

## 六、验证步骤

### 6.1 完整验证流程

1. **MongoDB验证**
   ```powershell
   & "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" --eval "db.adminCommand({ping:1})"
   ```

2. **后端验证**
   ```powershell
   Invoke-WebRequest -Uri http://localhost:5555/api/v1/auth/health -Method GET
   ```

3. **前端验证**
   ```powershell
   Start-Process "http://localhost:5137"
   ```

4. **运行E2E测试**
   ```bash
   cd JobPortal
   npx playwright test e2e/tests/stable-e2e.spec.ts --headed
   ```

---

## 七、预防措施

### 7.1 设置环境变量（永久生效）

```powershell
# 永久设置MongoDB路径
[Environment]::SetEnvironmentVariable("MONGODB_HOME", "C:\Program Files\MongoDB\Server\7.0", "User")
$env:PATH += ";C:\Program Files\MongoDB\Server\7.0\bin"
```

### 7.2 创建启动脚本

使用项目根目录的 `start-services.ps1`:

```powershell
# 以管理员身份运行
Start-Process powershell -ArgumentList "-NoExit", "-File", "d:\claudesapce\JobPortal\start-services.ps1" -Verb RunAs
```

### 7.3 定期维护

- 每周检查MongoDB磁盘空间
- 每月备份数据库
- 监控连接错误日志

---

**维护者:** AI Assistant
**最后更新:** 2026-03-23