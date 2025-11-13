@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   提交代码并发布
echo ========================================
echo.

REM 检查 git 是否可用
git --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 Git，请先安装 Git
    exit /b 1
)

REM 显示当前状态
echo [1/5] 检查 Git 状态...
git status
echo.

REM 添加所有更改
echo [2/5] 添加所有更改...
git add .
if errorlevel 1 (
    echo 错误: git add 失败
    exit /b 1
)
echo 已添加所有更改
echo.

REM 获取版本号
echo [3/5] 读取版本号...
for /f "tokens=2 delims=:," %%a in ('findstr /c:"\"version\"" manifest.json') do (
    set VERSION=%%a
    set VERSION=!VERSION: =!
    set VERSION=!VERSION:"=!
)
echo 当前版本: %VERSION%
echo.

REM 提交更改
echo [4/5] 提交更改...
set COMMIT_MSG=fix: 移除 PowerShell 脚本，解决 Cursor PowerShell 集成层编码问题
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo 警告: 提交可能失败（可能没有更改需要提交）
)
echo.

REM 检查标签是否存在
echo [5/5] 检查标签...
git tag -l "v%VERSION%" >nul 2>&1
if errorlevel 1 (
    echo 创建标签 v%VERSION%...
    git tag -a "v%VERSION%" -m "Release version %VERSION%"
    echo 已创建标签 v%VERSION%
) else (
    echo 标签 v%VERSION% 已存在，跳过创建
)
echo.

REM 检测当前分支
echo 检测当前分支...
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%b
if "%CURRENT_BRANCH%"=="" (
    for /f "tokens=2" %%b in ('git branch 2^>nul ^| findstr /C:"*"') do set CURRENT_BRANCH=%%b
    set CURRENT_BRANCH=!CURRENT_BRANCH: =!
)
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=main
echo 当前分支: %CURRENT_BRANCH%
echo.

REM 推送到远程
echo 推送到远程仓库...
set /p PUSH_CONFIRM=是否推送到远程仓库？(y/n): 
if /i "%PUSH_CONFIRM%"=="y" (
    echo 推送分支 %CURRENT_BRANCH%...
    git push origin %CURRENT_BRANCH%
    if errorlevel 1 (
        echo 推送失败，请检查网络连接和权限
    ) else (
        echo 分支推送成功
    )
    echo.
    echo 推送标签 v%VERSION%...
    git push origin "v%VERSION%"
    if errorlevel 1 (
        echo 标签推送失败，请检查网络连接和权限
    ) else (
        echo 标签推送成功
    )
    echo.
    echo 推送完成！
    echo.
    echo GitHub Actions 将自动创建 Release（如果已配置）
) else (
    echo 跳过推送
)
echo.

echo ========================================
echo   完成！
echo ========================================
echo 版本: v%VERSION%
echo.
echo 下一步：
echo   1. 检查 GitHub Actions 是否自动创建 Release
echo   2. 或手动在 GitHub 上创建 Release
echo.

pause


