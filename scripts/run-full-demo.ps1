# JobPortal 全角色业务流程演示脚本
# 用法：.\run-full-demo.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        JobPortal 全角色业务流程演示                            ║" -ForegroundColor Cyan
Write-Host "║        Full Role Business Flow Demo                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
Set-Location $PSScriptRoot\..

Write-Host "📂 工作目录：$(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# 检查 Node.js
Write-Host "🔍 检查环境..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js 未安装或未在 PATH 中" -ForegroundColor Red
    exit 1
}

# 检查 Playwright
$playwrightVersion = npx playwright --version 2>$null
if ($playwrightVersion) {
    Write-Host "  ✅ Playwright: $playwrightVersion" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Playwright 未安装，正在安装..." -ForegroundColor Yellow
    npm init playwright@latest --yes
}

Write-Host ""

# 检查服务状态
Write-Host "🔍 检查服务状态..." -ForegroundColor Cyan

$frontendPort = 5137
$backendPort = 5555

$frontendRunning = netstat -ano | findstr ":$frontendPort" | findstr "LISTENING"
$backendRunning = netstat -ano | findstr ":$backendPort" | findstr "LISTENING"

if ($frontendRunning) {
    Write-Host "  ✅ 前端服务运行中 (端口 $frontendPort)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  前端服务未运行 (端口 $frontendPort)" -ForegroundColor Yellow
}

if ($backendRunning) {
    Write-Host "  ✅ 后端服务运行中 (端口 $backendPort)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  后端服务未运行 (端口 $backendPort)" -ForegroundColor Yellow
}

Write-Host ""

# 如果没有服务运行，提示用户
if (-not $frontendRunning -or -not $backendRunning) {
    Write-Host "⚠️  部分服务未运行，请先启动服务：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  终端 1: cd JobPortal\server && npm run dev" -ForegroundColor White
    Write-Host "  终端 2: cd JobPortal\client && npm run dev" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "是否继续运行演示？(y/n)"
    if ($continue -ne 'y') {
        Write-Host "演示已取消" -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
}

# 创建测试输出目录
$testResultsDir = Join-Path $PSScriptRoot "..\test-results"
if (-not (Test-Path $testResultsDir)) {
    Write-Host "📁 创建测试输出目录..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $testResultsDir | Out-Null
}

# 选择演示模式
Write-Host "🎯 选择演示模式:" -ForegroundColor Cyan
Write-Host "  1. 完整演示 (所有场景)" -ForegroundColor White
Write-Host "  2. 自由顾问场景" -ForegroundColor White
Write-Host "  3. HR 招聘官场景" -ForegroundColor White
Write-Host "  4. 系统管理员场景" -ForegroundColor White
Write-Host "  5. 导航一致性验证" -ForegroundColor White
Write-Host "  6. 菜单功能演示" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选项 (1-6)"
Write-Host ""

# 构建测试命令
$testCommand = "npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --headed"

switch ($choice) {
    "1" {
        Write-Host "🎬 运行完整演示..." -ForegroundColor Cyan
    }
    "2" {
        $testCommand = "npx playwright test -g 'DEMO-FREELANCER-001' --headed"
        Write-Host "🎬 运行自由顾问场景演示..." -ForegroundColor Cyan
    }
    "3" {
        $testCommand = "npx playwright test -g 'DEMO-HR-001' --headed"
        Write-Host "🎬 运行 HR 招聘官场景演示..." -ForegroundColor Cyan
    }
    "4" {
        $testCommand = "npx playwright test -g 'DEMO-ADMIN-001' --headed"
        Write-Host "🎬 运行系统管理员场景演示..." -ForegroundColor Cyan
    }
    "5" {
        $testCommand = "npx playwright test -g 'DEMO-CONSISTENCY-001' --headed"
        Write-Host "🎬 运行导航一致性验证演示..." -ForegroundColor Cyan
    }
    "6" {
        $testCommand = "npx playwright test -g 'DEMO-MENU-001' --headed"
        Write-Host "🎬 运行菜单功能演示..." -ForegroundColor Cyan
    }
    default {
        Write-Host "❌ 无效选项，运行完整演示" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 测试命令：$testCommand" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 运行测试
$startTime = Get-Date
Invoke-Expression $testCommand
$exitCode = $LASTEXITCODE
$endTime = Get-Date

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 计算运行时间
$duration = $endTime - $startTime
Write-Host "⏱️  演示运行时间：$($duration.Minutes)分$($duration.Seconds)秒" -ForegroundColor Yellow
Write-Host ""

# 检查测试结果
if ($exitCode -eq 0) {
    Write-Host "✅ 演示成功完成！" -ForegroundColor Green
} else {
    Write-Host "❌ 演示运行失败，请检查错误信息" -ForegroundColor Red
}

# 显示截图文件
$screenshotCount = (Get-ChildItem -Path $testResultsDir -Filter "demo-*.png").Count
if ($screenshotCount -gt 0) {
    Write-Host ""
    Write-Host "📸 已生成 $screenshotCount 张截图:" -ForegroundColor Cyan
    Get-ChildItem -Path $testResultsDir -Filter "demo-*.png" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 10 | 
        ForEach-Object {
            Write-Host "  • $($_.Name)" -ForegroundColor Gray
        }
    
    if ($screenshotCount -gt 10) {
        Write-Host "  ... 还有 $($screenshotCount - 10) 张截图" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📂 截图目录：$testResultsDir" -ForegroundColor Cyan
Write-Host ""

# 询问是否查看报告
$showReport = Read-Host "是否查看 HTML 测试报告？(y/n)"
if ($showReport -eq 'y') {
    Write-Host ""
    Write-Host "📊 生成 HTML 报告..." -ForegroundColor Cyan
    
    # 运行测试生成报告
    npx playwright test e2e-tests/full-role-business-flow-demo.spec.ts --reporter=html
    
    # 打开报告
    npx playwright show-report
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "演示结束，感谢使用！" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
