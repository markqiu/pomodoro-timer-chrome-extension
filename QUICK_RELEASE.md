# 快速发布指南

由于 Cursor 的 PowerShell 集成层问题，请使用以下方法之一：

## 🚀 方法 1: 使用批处理脚本（最简单）

1. **在文件资源管理器中**，导航到项目目录：`D:\work\极简番茄钟`
2. **双击运行** `commit-and-release.bat`
3. 按照提示操作（输入 `y` 确认推送）

## 📝 方法 2: 使用 Git Bash（推荐，最可靠）

1. **右键点击项目文件夹** → 选择 "Git Bash Here"
2. **执行以下命令**：

```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "fix: 移除 PowerShell 脚本，解决 Cursor PowerShell 集成层编码问题"

# 创建标签（当前版本：1.0.3）
git tag -a "v1.0.3" -m "Release version 1.0.3"

# 推送代码和标签
git push origin main
git push origin v1.0.3
```

如果您的分支是 `master` 而不是 `main`，请使用：
```bash
git push origin master
git push origin v1.0.3
```

## 💻 方法 3: 使用 CMD（Windows 命令提示符）

1. 按 `Win + R`，输入 `cmd`，按回车
2. 切换到项目目录：
   ```cmd
   cd /d D:\work\极简番茄钟
   ```
3. 执行：
   ```cmd
   commit-and-release.bat
   ```

## ✅ 执行后的结果

执行成功后：
- ✅ 代码已提交到本地仓库
- ✅ 创建了版本标签 `v1.0.3`
- ✅ 代码和标签已推送到 GitHub
- ✅ GitHub Actions 会自动创建 Release（如果已配置）

## 📋 当前版本信息

- **版本号**: 1.0.3
- **标签**: v1.0.3
- **提交信息**: fix: 移除 PowerShell 脚本，解决 Cursor PowerShell 集成层编码问题

## 🔍 验证发布

1. 访问 GitHub 仓库
2. 检查 **Releases** 页面，应该看到新的 Release
3. 检查 **Actions** 页面，应该看到构建工作流正在运行或已完成




