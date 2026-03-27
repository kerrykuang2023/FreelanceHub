@echo off
REM ========================================
REM JobPortal E2E 测试执行脚本
REM 版本：v1.0
REM 用途：执行指定的 E2E 测试套件
REM ========================================

echo.
echo ========================================
echo JobPortal E2E 测试执行
echo ========================================
echo.

REM 设置工作目录
cd /d "%~dp0JobPortal"

REM 检查参数
if "%1"=="" goto show_menu

if "%1"=="full" goto run_full
if "%1"=="ui" goto run_ui
if "%1"=="prd" goto run_prd
if "%1"=="all" goto run_all
if "%1"=="report" goto show_report
if "%1"=="clean" goto clean_results

echo 未知参数：%1
echo.
goto usage

:show_menu
echo 请选择测试类型:
echo.
echo 1. 完整用户旅程测试 (full)
echo 2. UI 组件验证测试 (ui)
echo 3. PRD 功能验证测试 (prd)
echo 4. 执行所有测试 (all)
echo 5. 查看测试报告 (report)
echo 6. 清理测试结果 (clean)
echo 0. 退出
echo.
set /p choice=请输入选项 (0-6): 

if "%choice%"=="1" goto run_full
if "%choice%"=="2" goto run_ui
if "%choice%"=="3" goto run_prd
if "%choice%"=="4" goto run_all
if "%choice%"=="5" goto show_report
if "%choice%"=="6" goto clean_results
goto end

:run_full
echo.
echo ========================================
echo 执行完整用户旅程测试
echo ========================================
echo.
npx playwright test e2e/tests/reports-full-test.spec.ts --headed
goto end

:run_ui
echo.
echo ========================================
echo 执行 UI 组件验证测试
echo ========================================
echo.
npx playwright test e2e/tests/reports-ui-validation.spec.ts --headed
goto end

:run_prd
echo.
echo ========================================
echo 执行 PRD 功能验证测试
echo ========================================
echo.
npx playwright test e2e/tests/worklog-invoice-stats-prd.spec.ts --headed
goto end

:run_all
echo.
echo ========================================
echo 执行所有测试
echo ========================================
echo.
npx playwright test e2e/tests/ --headed
goto end

:show_report
echo.
echo ========================================
echo 查看测试报告
echo ========================================
echo.
if exist "playwright-report\index.html" (
    start playwright-report\index.html
    echo 测试报告已打开
) else (
    echo 错误：测试报告不存在
    echo 请先运行测试生成报告
)
goto end

:clean_results
echo.
echo ========================================
echo 清理测试结果
echo ========================================
echo.
echo 正在删除测试结果...
if exist "test-results" rmdir /s /q test-results
if exist "playwright-report" rmdir /s /q playwright-report
if exist "e2e-test-results\screenshots" del /q e2e-test-results\screenshots\*.png
echo ✓ 测试结果已清理
goto end

:usage
echo.
echo 用法:
echo %0 [选项]
echo.
echo 选项:
echo   full    执行完整用户旅程测试
echo   ui      执行 UI 组件验证测试
echo   prd     执行 PRD 功能验证测试
echo   all     执行所有测试
echo   report  查看测试报告
echo   clean   清理测试结果
echo   help    显示此帮助信息
echo.

:end
echo.
echo ========================================
echo 测试执行完成
echo ========================================
echo.
pause
