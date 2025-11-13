@echo off
REM 清理 Cursor 生成的有问题的临时 PowerShell 脚本文件
echo 正在清理 Cursor 生成的临时 PowerShell 脚本...
echo.

del /F /Q "%TEMP%\ps-script-*.ps1" 2>nul
if %errorlevel%==0 (
    echo [成功] 临时脚本文件已清理！
) else (
    echo [信息] 没有找到需要清理的文件。
)

echo.
echo 提示：如果问题仍然存在，请：
echo 1. 重启 Cursor
echo 2. 使用外部 CMD 执行命令
echo 3. 检查 Cursor 是否有更新
echo.
pause



