# 快速开始 - Tauri 桌面应用

## 一键安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Rust（如果还没有安装）
# Windows: 访问 https://www.rust-lang.org/tools/install
# macOS/Linux: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 开发模式

```bash
npm run tauri:dev
```

这将启动开发模式，支持热重载。

## 构建生产版本

```bash
npm run tauri:build
```

构建完成后，可执行文件位于：
- **Windows**: `src-tauri/target/release/bundle/msi/` 或 `src-tauri/target/release/bundle/nsis/`
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Linux**: `src-tauri/target/release/bundle/`

## 项目特点

✅ **自动适配**：代码自动检测运行环境（浏览器扩展 vs 桌面应用）  
✅ **双模式支持**：同一套代码同时支持浏览器扩展和桌面应用  
✅ **轻量级**：使用 Tauri 打包，体积比 Electron 小 10-20 倍  
✅ **原生性能**：使用系统原生 WebView，内存占用低

## 更多信息

详细配置说明请查看 [TAURI_SETUP.md](./TAURI_SETUP.md)

