# GitHub发布指南

## 步骤 1: 在GitHub上创建新仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - **Repository name**: `pomodoro-timer-chrome-extension` 或 `极简番茄钟`
   - **Description**: `一个极简的Chrome扩展番茄钟工具，帮助您提高工作效率`
   - **Visibility**: 选择 Public（公开）或 Private（私有）
   - **不要**勾选 "Initialize this repository with a README"（我们已经有了）
4. 点击 "Create repository"

## 步骤 2: 连接本地仓库到GitHub

在终端中运行以下命令（将 `YOUR_USERNAME` 替换为您的GitHub用户名）：

```powershell
# 添加远程仓库（替换为您的实际仓库URL）
git remote add origin https://github.com/YOUR_USERNAME/pomodoro-timer-chrome-extension.git

# 或者使用SSH（如果您配置了SSH密钥）
# git remote add origin git@github.com:YOUR_USERNAME/pomodoro-timer-chrome-extension.git

# 查看远程仓库配置
git remote -v
```

## 步骤 3: 推送代码到GitHub

```powershell
# 推送主分支到GitHub
git branch -M main
git push -u origin main
```

如果遇到认证问题：
- 使用 Personal Access Token（推荐）
- 或配置SSH密钥

## 步骤 4: 创建Release标签

```powershell
# 创建v1.0.0标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签到GitHub
git push origin v1.0.0
```

## 步骤 5: 在GitHub上创建Release

1. 访问您的仓库页面
2. 点击右侧 "Releases" → "Create a new release"
3. 填写信息：
   - **Tag version**: `v1.0.0`
   - **Release title**: `极简番茄钟 v1.0.0`
   - **Description**: 
     ```
     ## 首次发布 🎉
     
     ### 功能特性
     - ✅ 经典的番茄工作法（25分钟专注 + 5分钟休息）
     - ✅ 自定义时长设置
     - ✅ 图标Badge显示剩余时间
     - ✅ 状态颜色区分（红色=工作，绿色=小休，蓝色=大休）
     - ✅ 声音和桌面通知提醒
     - ✅ 后台运行，状态持久化
     
     ### 下载
     - 从Chrome Web Store安装（发布后）
     - 或下载 `极简番茄钟-v1.0.0.zip` 手动安装
     ```
4. 上传 `极简番茄钟-v1.0.0.zip` 作为附件
5. 点击 "Publish release"

## 后续更新

当有新版本时：

```powershell
# 更新版本号（在manifest.json中）
# 然后：
git add .
git commit -m "feat: 更新到 v1.0.1"
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin main
git push origin v1.0.1
```

## GitHub仓库配置建议

### 添加仓库描述和标签

在GitHub仓库设置中添加：
- **Topics**: `chrome-extension`, `pomodoro`, `time-management`, `productivity`, `javascript`
- **Website**: Chrome Web Store链接（发布后）
- **Description**: 简短描述

### 添加徽章（可选）

在README.md顶部添加：

```markdown
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-发布中-orange)
![License](https://img.shields.io/badge/license-MIT-green)
```

## 常见问题

### Q: 推送时提示认证失败？
A: 使用 Personal Access Token 替代密码：
1. GitHub → Settings → Developer settings → Personal access tokens
2. 生成新token（勾选 `repo` 权限）
3. 使用token作为密码

### Q: 如何更新已存在的远程仓库？
A: 
```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Q: 如何添加许可证文件？
A: 创建 `LICENSE` 文件，GitHub会自动识别。

