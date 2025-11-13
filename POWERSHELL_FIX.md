# PowerShell 脚本错误解决方案

## 问题描述

错误信息显示 VS Code/Cursor 的 PowerShell 集成层在生成临时脚本时，格式化字符串中的花括号没有正确转义，导致语法错误。

## 解决方案

### 方案 1: 完全禁用 Shell 集成（推荐）

已更新 `.vscode/settings.json`，添加了以下配置：

1. **环境变量禁用**：设置 `VSCODE_SHELL_INTEGRATION=0`
2. **使用直接路径**：PowerShell 配置使用直接路径而不是 `source: PowerShell`，避免包装
3. **禁用所有集成功能**：完全关闭 shell 集成相关功能

**操作步骤：**
1. 重启 Cursor/VS Code
2. 如果问题仍然存在，继续执行方案 2

### 方案 2: 创建 PowerShell 配置文件

在 PowerShell 启动时自动禁用 shell 集成：

1. 打开 PowerShell（以管理员身份）
2. 运行以下命令创建配置文件：

```powershell
# 检查配置文件路径
$PROFILE

# 如果文件不存在，创建目录
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# 添加禁用 shell 集成的代码
Add-Content -Path $PROFILE -Value @'
# 禁用 VS Code/Cursor Shell 集成
$env:VSCODE_SHELL_INTEGRATION = "0"
$env:VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH = ""
'@
```

3. 重启 Cursor/VS Code

### 方案 3: 使用 CMD 作为默认终端（最简单）

如果不需要使用 PowerShell，可以完全使用 CMD：

1. 在 Cursor 中按 `Ctrl+Shift+P`
2. 输入 "Terminal: Select Default Profile"
3. 选择 "Command Prompt"
4. 重启 Cursor

### 方案 4: 清理临时文件并禁用扩展

如果以上方案都不行：

1. **清理临时文件**：
   ```cmd
   del /F /Q "%TEMP%\ps-script-*.ps1"
   ```

2. **禁用 PowerShell 扩展**（如果已安装）：
   - 打开扩展面板 (`Ctrl+Shift+X`)
   - 搜索 "PowerShell"
   - 如果已安装，点击"禁用"

3. **检查是否有其他扩展在生成脚本**：
   - 查看扩展列表
   - 临时禁用可能相关的扩展

### 方案 5: 更新 Cursor/VS Code

确保使用最新版本：
- Cursor: 检查更新
- VS Code: 检查更新

## 验证配置

重启后，打开终端并运行：

```powershell
echo $env:VSCODE_SHELL_INTEGRATION
```

应该输出 `0`。如果输出为空或其他值，说明配置未生效。

## 立即修复步骤（如果重启后问题仍然存在）

### 步骤 1: 手动创建 PowerShell 配置文件

由于 Cursor 的 shell 集成层在生成临时脚本时有问题，我们需要在外部创建配置文件：

1. **打开外部 CMD**（不要使用 Cursor 的终端）：
   - 按 `Win+R`
   - 输入 `cmd` 并按回车

2. **运行修复脚本**：
   ```cmd
   cd /d D:\work\极简番茄钟
   fix-powershell-profile.bat
   ```

   或者手动创建配置文件：
   ```cmd
   mkdir "%USERPROFILE%\Documents\WindowsPowerShell" 2>nul
   echo # 禁用 VS Code/Cursor Shell 集成 > "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
   echo $env:VSCODE_SHELL_INTEGRATION = '0' >> "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
   echo $env:VSCODE_INJECT_NODE_MODULE_LOOKUP_PATH = '' >> "%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
   ```

3. **清理临时文件**：
   ```cmd
   del /F /Q "%TEMP%\ps-script-*.ps1"
   ```

4. **重启 Cursor**

### 步骤 2: 检查用户级别设置

可能用户级别的设置覆盖了工作区设置：

1. 按 `Ctrl+Shift+P`
2. 输入 "Preferences: Open User Settings (JSON)"
3. 检查是否有 `terminal.integrated.shellIntegration.enabled` 设置为 `true`
4. 如果有，将其设置为 `false` 或删除该设置

### 步骤 3: 如果问题仍然存在

1. **完全禁用 PowerShell 扩展**（如果已安装）：
   - 打开扩展面板 (`Ctrl+Shift+X`)
   - 搜索 "PowerShell"
   - 完全禁用或卸载

2. **使用外部终端**：
   - 使用 Windows Terminal
   - 使用 Git Bash
   - 使用独立的 CMD 窗口

3. **检查 Cursor 版本**：
   - 确保使用最新版本的 Cursor
   - 这可能是 Cursor 的已知 bug，新版本可能已修复

## 当前配置状态

✅ 已禁用 shell 集成
✅ 已设置环境变量
✅ 已使用直接路径配置 PowerShell
✅ 已设置 CMD 为默认终端

如果重启后问题仍然存在，请尝试方案 2（创建 PowerShell 配置文件）。

