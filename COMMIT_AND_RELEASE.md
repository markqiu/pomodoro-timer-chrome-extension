# 提交代码并发布指南

由于 Cursor 的 PowerShell 集成层存在编码问题，请按照以下步骤手动执行：

## 方法 1: 使用 Git Bash（推荐）

1. 打开 Git Bash
2. 切换到项目目录：
   ```bash
   cd /d/work/极简番茄钟
   ```

3. 执行以下命令：

```bash
# 1. 检查状态
git status

# 2. 添加所有更改
git add .

# 3. 提交更改
git commit -m "fix: 移除 PowerShell 脚本，解决 Cursor PowerShell 集成层编码问题"

# 4. 创建标签（当前版本：1.0.3）
git tag -a "v1.0.3" -m "Release version 1.0.3"

# 5. 推送到远程
git push origin main
# 如果 main 分支不存在，使用：
# git push origin master

# 6. 推送标签
git push origin v1.0.3
```

## 方法 2: 使用 CMD（Windows 命令提示符）

1. 打开 CMD（不是 PowerShell）
2. 切换到项目目录：
   ```cmd
   cd /d D:\work\极简番茄钟
   ```

3. 执行以下命令：

```cmd
git status
git add .
git commit -m "fix: 移除 PowerShell 脚本，解决 Cursor PowerShell 集成层编码问题"
git tag -a "v1.0.3" -m "Release version 1.0.3"
git push origin main
git push origin v1.0.3
```

## 方法 3: 使用批处理脚本

我已经创建了 `commit-and-release.bat` 脚本，您可以在 CMD 中直接运行：

```cmd
commit-and-release.bat
```

## 注意事项

1. **重启 Cursor**：修改 `.vscode/settings.json` 后，建议重启 Cursor 使配置生效
2. **使用 Git Bash**：如果已安装 Git Bash，这是最可靠的方法
3. **检查分支名**：确认您的默认分支是 `main` 还是 `master`
4. **GitHub Actions**：推送标签后，GitHub Actions 会自动创建 Release（如果已配置）

## 当前更改内容

- ✅ 删除了所有 PowerShell 脚本（build.ps1, release.ps1, generate_ico.ps1, generate_icons.ps1）
- ✅ 更新了 README.md，移除 PowerShell 引用
- ✅ 更新了 TAURI_SETUP.md，移除 PowerShell 引用
- ✅ 配置了 .vscode/settings.json，禁用 PowerShell 集成层
- ✅ 添加了 .vscode/ 目录到版本控制

## 版本信息

- 当前版本：**1.0.3**
- 标签：**v1.0.3**





