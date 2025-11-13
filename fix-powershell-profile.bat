@echo off
REM 创建 PowerShell 配置文件以禁用 Shell 集成
echo 正在创建 PowerShell 配置文件...

REM 创建配置文件目录（如果不存在）
if not exist "%USERPROFILE%\Documents\WindowsPowerShell" (
    mkdir "%USERPROFILE%\Documents\WindowsPowerShell"
)

REM 创建配置文件内容
(
echo # 禁用 VS Code/Cursor Shell 集成
echo $env:VSCODE_SHELL_INTEGRATION = '0'
echo $env:VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH = ''
) > "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"

echo PowerShell 配置文件已创建: %USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
echo.
echo 请重启 Cursor 使配置生效。
pause




