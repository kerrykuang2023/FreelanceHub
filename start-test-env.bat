@echo off
REM ========================================
REM JobPortal E2E 测试快速启动脚本
REM 版本：v1.0
REM 用途：一键启动所有测试所需服务
REM ========================================

echo.
echo ========================================
echo JobPortal E2E 测试环境启动
echo ========================================
echo.

REM 设置工作目录
cd /d "%~dp0JobPortal"

REM 步骤 1: 检查 MongoDB
echo [1/5] 检查 MongoDB 服务...
sc query MongoDB | findstr "RUNNING" >nul
if %errorlevel% neq 0 (
    echo MongoDB 未运行，正在启动...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo.
        echo 错误：无法启动 MongoDB
        echo 请手动启动 MongoDB 或安装 Docker
        echo.
        echo Docker 启动命令:
        echo docker run -d -p 27017:27017 --name jobportal-mongo mongo
        echo.
        pause
        exit /b 1
    )
)
echo ✓ MongoDB 运行正常
echo.

REM 步骤 2: 等待 MongoDB 就绪
echo [2/5] 等待 MongoDB 就绪...
timeout /t 3 /nobreak >nul
echo ✓ MongoDB 已就绪
echo.

REM 步骤 3: 检查依赖
echo [3/5] 检查项目依赖...
if not exist "node_modules" (
    echo 安装项目依赖...
    npm install
)
if not exist "client\node_modules" (
    echo 安装前端依赖...
    cd client
    npm install
    cd ..
)
if not exist "server\node_modules" (
    echo 安装后端依赖...
    cd server
    npm install
    cd ..
)
echo ✓ 依赖检查完成
echo.

REM 步骤 4: 创建测试账号
echo [4/5] 创建测试账号...
cd server
node src/seeders/create-e2e-test-users.js
cd ..
if %errorlevel% neq 0 (
    echo.
    echo 警告：测试账号创建失败
    echo 请手动运行：node server/src/seeders/create-e2e-test-users.js
    echo.
)
echo.

REM 步骤 5: 启动应用服务
echo [5/5] 启动应用服务...
echo.
echo 正在启动前后端服务...
echo 前端：http://localhost:5137
echo 后端：http://localhost:5555
echo.
echo 按 Ctrl+C 停止服务
echo.

REM 启动服务
npm run dev

pause
