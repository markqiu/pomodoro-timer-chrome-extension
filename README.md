# Minimal Pomodoro Timer

A minimal Chrome extension pomodoro timer to help you improve work efficiency.

[中文说明](#中文说明) | [English](#english)

---

## English

### Features

- ✅ Classic Pomodoro Technique (25 minutes focus + 5 minutes break)
- ✅ Customizable duration settings (Pomodoro, Short Break, Long Break)
- ✅ Cycle counting feature
- ✅ Icon badge showing remaining time
- ✅ Status color coding (Red=Work, Green=Short Break, Blue=Long Break)
- ✅ Sound alerts
- ✅ Desktop notifications
- ✅ Background operation, continues counting when popup is closed
- ✅ State persistence

### Installation

#### From Chrome Web Store (Recommended)

1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Minimal Pomodoro Timer"
3. Click "Add to Chrome"

#### Developer Mode Installation

1. Download and extract the project files
2. Open Chrome browser, navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the project folder

### Usage

1. Click the extension icon in the browser toolbar
2. Choose the mode to start:
   - **Start Pomodoro**: Start 25-minute focused work
   - **Start Short Break**: Start 5-minute short break
   - **Start Long Break**: Start 15-minute long break
3. After the timer starts, you can:
   - **Pause**: Pause current timer
   - **Reset**: Reset to initial state
   - **Settings**: Customize duration and alert options

### Settings

- **Pomodoro Duration**: Focus work time (default: 25 minutes)
- **Short Break Duration**: Short break time (default: 5 minutes)
- **Long Break Duration**: Long break time (default: 15 minutes)
- **Cycles**: How many pomodoros before long break (default: 4)
- **Sound Alert**: Play alert sound when phase ends
- **Notification Alert**: Show desktop notification when phase ends

### Icon Status Guide

The badge on the extension icon shows the current status:

- **Number**: Shows remaining minutes
- **Red Background**: Pomodoro (focus work) in progress
- **Green Background**: Short break in progress
- **Blue Background**: Long break in progress
- **Gray Background**: Paused
- **No Badge**: Not running

### Tech Stack

- Pure JavaScript (no framework)
- Chrome Extension Manifest V3
- Chrome Storage API
- Chrome Notifications API

### Development

#### Project Structure

```
minimal-pomodoro/
├── manifest.json      # Extension config file
├── popup.html         # Popup interface
├── css/
│   └── style.css     # Stylesheet
├── js/
│   ├── background.js # Background service (timer logic)
│   ├── pomodoro.js   # UI logic
│   ├── settings.js   # Settings management
│   └── storage.js    # Storage management
└── icons/            # Icon files
```

#### Build & Release

##### Manual Build

**Windows (PowerShell):**
```powershell
.\build.ps1
```

**Linux/macOS (Bash):**
```bash
chmod +x build.sh
./build.sh [version]
```

This creates a zip file that can be uploaded directly to Chrome Web Store.

##### Automatic Release (Recommended)

**Using GitHub Actions (CI/CD):**

1. Create a new tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. GitHub Actions will automatically:
   - Build the extension
   - Create a GitHub Release
   - Upload the zip file

**Using Local Script:**

```powershell
# Windows (PowerShell)
.\release.ps1 -Version "1.0.1" -CreateRelease
```

```bash
# Linux/macOS
# See release.ps1 for PowerShell or use GitHub Actions
```

### Version History

#### v1.0.0
- Initial release
- Basic pomodoro timer features
- Icon badge display
- State persistence

### License

MIT License

### Contributing

Issues and Pull Requests are welcome!

### Contact

For questions or suggestions, please submit via GitHub Issues.

---

## 中文说明

### 功能特性

- ✅ 经典的番茄工作法（25分钟专注 + 5分钟休息）
- ✅ 自定义时长设置（番茄钟、小休、大休）
- ✅ 循环计数功能
- ✅ 图标Badge显示剩余时间
- ✅ 状态颜色区分（红色=工作，绿色=小休，蓝色=大休）
- ✅ 声音提醒
- ✅ 桌面通知
- ✅ 后台运行，关闭弹窗继续计时
- ✅ 状态持久化保存

### 安装方法

#### 从Chrome Web Store安装（推荐）

1. 访问 [Chrome Web Store](https://chrome.google.com/webstore)
2. 搜索"极简番茄钟"
3. 点击"添加到Chrome"

#### 开发者模式安装

1. 下载并解压项目文件
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

### 使用方法

1. 点击浏览器工具栏中的扩展图标
2. 选择要开始的模式：
   - **开始番茄钟**：开始25分钟专注工作
   - **开始小休**：开始5分钟短休息
   - **开始大休**：开始15分钟长休息
3. 计时器开始后可以：
   - **暂停**：暂停当前计时
   - **重置**：重置到初始状态
   - **设置**：自定义时长和提醒选项

### 设置选项

- **番茄钟时长**：专注工作时间（默认25分钟）
- **小休时长**：短休息时间（默认5分钟）
- **大休时长**：长休息时间（默认15分钟）
- **持续次数**：多少个番茄钟后进入大休（默认4次）
- **声音提醒**：阶段结束时播放提醒音
- **通知提醒**：阶段结束时显示桌面通知

### 图标状态说明

扩展图标上的Badge会显示当前状态：

- **数字**：显示剩余分钟数
- **红色背景**：番茄钟（专注工作）进行中
- **绿色背景**：小休进行中
- **蓝色背景**：大休进行中
- **灰色背景**：已暂停
- **无Badge**：未运行

### 打包发布

#### 手动打包

**Windows (PowerShell):**
```powershell
.\build.ps1
```

**Linux/macOS (Bash):**
```bash
chmod +x build.sh
./build.sh [version]
```

#### 自动发布（推荐）

**使用 GitHub Actions (CI/CD):**

1. 创建新标签：
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. GitHub Actions 会自动：
   - 打包扩展
   - 创建 GitHub Release
   - 上传 zip 文件

**使用本地脚本：**

```powershell
.\release.ps1 -Version "1.0.1" -CreateRelease
```

### 版本历史

#### v1.0.0
- 初始发布
- 基础番茄钟功能
- 图标Badge显示
- 状态持久化

### 许可证

MIT License

### 贡献

欢迎提交Issue和Pull Request！

### 联系方式

如有问题或建议，请通过GitHub Issues反馈。
