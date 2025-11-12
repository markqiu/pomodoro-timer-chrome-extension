# Tauri 桌面应用打包指南

本项目已配置为使用 **Tauri** 打包成桌面应用。Tauri 是目前最流行的 Electron 替代方案，具有以下优势：

- ✅ **体积小**：打包后的应用体积比 Electron 小 10-20 倍
- ✅ **性能好**：使用系统原生 WebView，内存占用低
- ✅ **安全性高**：使用 Rust 后端，安全性更强
- ✅ **跨平台**：支持 Windows、macOS、Linux

## 前置要求

### 1. 安装 Rust

访问 [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install) 安装 Rust。

Windows 用户需要安装：
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 或
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

### 2. 安装 Node.js

确保已安装 Node.js (推荐 v18 或更高版本)。

### 3. 安装 Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

或者使用项目本地安装：

```bash
npm install
```

## 开发模式

运行开发模式（支持热重载）：

```bash
npm run tauri:dev
```

或者：

```bash
npx tauri dev
```

## 构建生产版本

构建生产版本：

```bash
npm run tauri:build
```

或者：

```bash
npx tauri build
```

构建完成后，可执行文件位于：
- **Windows**: `src-tauri/target/release/bundle/msi/` 或 `src-tauri/target/release/bundle/nsis/`
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Linux**: `src-tauri/target/release/bundle/`

## 配置说明

### 应用配置

主要配置文件：`src-tauri/tauri.conf.json`

- **窗口大小**：默认 500x600，最小 400x500
- **应用名称**：Minimal Pomodoro Timer
- **版本号**：1.0.1

### 权限配置

已启用的 Tauri API：
- `notification`：桌面通知
- `window`：窗口控制（最小化、最大化、关闭等）

## 项目结构

```
项目根目录/
├── src-tauri/          # Tauri 后端配置
│   ├── Cargo.toml      # Rust 依赖配置
│   ├── tauri.conf.json # Tauri 应用配置
│   ├── main.rs         # Rust 入口文件
│   └── build.rs        # 构建脚本
├── js/
│   ├── desktop-timer.js # 桌面应用计时器（新增）
│   ├── pomodoro.js     # 主逻辑（已适配桌面模式）
│   ├── storage.js      # 存储管理（已支持桌面模式）
│   └── ...
├── index.html          # 桌面应用入口（已添加 desktop-timer.js）
├── popup.html          # 浏览器扩展入口
└── package.json        # Node.js 配置
```

## 代码适配说明

项目已自动适配桌面和浏览器扩展两种模式：

1. **自动检测环境**：代码会自动检测是否在 Chrome Extension 环境中运行
2. **桌面模式**：使用 `DesktopTimer` 管理计时器
3. **扩展模式**：使用 `background.js` 管理计时器
4. **存储**：桌面模式使用 `localStorage`，扩展模式使用 `chrome.storage`

## 常见问题

### 1. 构建失败：找不到 Rust 工具链

确保已正确安装 Rust，运行：
```bash
rustc --version
```

### 2. Windows 构建失败：缺少 C++ 工具

安装 Visual Studio C++ Build Tools 或 Microsoft C++ Build Tools。

### 3. 通知不工作

确保在 `tauri.conf.json` 中启用了 `notification` 权限，并且应用已请求通知权限。

### 4. 图标显示不正确

确保 `src-tauri/tauri.conf.json` 中的图标路径正确，并且图标文件存在。

## 更多资源

- [Tauri 官方文档](https://tauri.app/)
- [Tauri API 文档](https://tauri.app/api/)
- [Rust 官方文档](https://www.rust-lang.org/)

