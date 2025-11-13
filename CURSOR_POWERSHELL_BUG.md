# Cursor PowerShell 集成层 Bug 说明

## 问题根本原因

这是一个 **Cursor 的已知 bug**。即使在工作区设置中完全禁用了 shell 集成，当 Cursor 的工具系统（如 `run_terminal_cmd`）尝试执行命令时，它仍然会在后台生成临时的 PowerShell 脚本文件，而这些脚本文件中的格式化字符串存在语法错误。

**错误位置**：`C:\Users\qiuch\AppData\Local\Temp\ps-script-*.ps1`

**错误原因**：脚本中的格式化字符串 `'{1}''` 没有正确转义，导致 PowerShell 解析失败。

## 影响范围

- ✅ **不影响**：在 Cursor 的集成终端中手动输入命令
- ✅ **不影响**：使用外部终端（CMD、Git Bash、Windows Terminal）
- ❌ **影响**：Cursor 的 AI 工具自动执行命令（如 `run_terminal_cmd`）
- ❌ **影响**：某些自动化任务和脚本执行

## 临时解决方案

### 方案 1: 使用外部终端执行命令（推荐）

当需要执行命令时，请使用外部终端：

1. **打开外部 CMD**：
   - 按 `Win+R`
   - 输入 `cmd` 并按回车
   - 或者使用 Windows Terminal

2. **切换到项目目录**：
   ```cmd
   cd /d D:\work\极简番茄钟
   ```

3. **执行需要的命令**

### 方案 2: 在 Cursor 终端中手动执行

虽然 AI 工具无法执行命令，但您可以在 Cursor 的集成终端中手动执行：

1. 打开终端（`Ctrl+`` 或 `Terminal > New Terminal`）
2. 确保使用的是 CMD（不是 PowerShell）
3. 手动输入并执行命令

### 方案 3: 清理临时文件

定期清理有问题的临时脚本文件：

```cmd
del /F /Q "%TEMP%\ps-script-*.ps1"
```

可以创建一个批处理文件来自动清理：

**创建 `clean-temp.bat`**：
```batch
@echo off
echo 正在清理 Cursor 生成的临时 PowerShell 脚本...
del /F /Q "%TEMP%\ps-script-*.ps1" 2>nul
if %errorlevel%==0 (
    echo 清理完成！
) else (
    echo 没有找到需要清理的文件。
)
pause
```

### 方案 4: 禁用 PowerShell 扩展

如果已安装 PowerShell 扩展，尝试禁用它：

1. 打开扩展面板 (`Ctrl+Shift+X`)
2. 搜索 "PowerShell"
3. 如果已安装，点击"禁用"

## 已完成的配置

✅ 工作区设置已配置为禁用 shell 集成
✅ 已设置环境变量 `VSCODE_SHELL_INTEGRATION=0`
✅ 已配置使用 CMD 作为默认终端
✅ 已创建 PowerShell 配置文件修复脚本

## 长期解决方案

这个问题需要 Cursor 开发团队修复。建议：

1. **报告 Bug**：
   - 在 Cursor 的 GitHub 仓库或问题跟踪系统中报告此问题
   - 提供错误信息和临时脚本文件路径

2. **更新 Cursor**：
   - 定期检查 Cursor 更新
   - 新版本可能已修复此问题

3. **使用替代方案**：
   - 使用外部终端执行命令
   - 使用 Git Bash 或 Windows Terminal
   - 等待 Cursor 修复后再使用 AI 工具执行命令

## 当前状态

- ⚠️ **AI 工具无法执行命令**：`run_terminal_cmd` 工具会触发错误
- ✅ **手动终端可用**：可以在 Cursor 终端中手动执行命令
- ✅ **外部终端可用**：使用外部 CMD/Git Bash 完全正常
- ✅ **项目配置正常**：所有配置文件都已正确设置

## 建议的工作流程

1. **开发时**：使用 Cursor 的集成终端（CMD）手动执行命令
2. **构建/发布时**：使用外部终端或批处理脚本
3. **AI 辅助时**：让 AI 提供命令，您手动执行

## 相关文件

- `.vscode/settings.json` - 工作区配置
- `fix-powershell-profile.bat` - PowerShell 配置文件修复脚本
- `POWERSHELL_FIX.md` - 详细的修复指南
- `CURSOR_POWERSHELL_BUG.md` - 本文档



