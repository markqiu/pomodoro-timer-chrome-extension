#!/bin/bash
# macOS 构建脚本
# 用于在 macOS 上构建 Tauri 桌面应用

set -e

echo "🍅 Building Minimal Pomodoro Timer for macOS..."

# 检查是否在 macOS 上
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ Error: This script requires macOS"
    exit 1
fi

# 检查 Rust 是否安装
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: Rust is not installed"
    echo "   Install from: https://www.rust-lang.org/tools/install"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

# 检查 Tauri CLI 是否安装
if ! command -v tauri &> /dev/null && [ ! -f "node_modules/.bin/tauri" ]; then
    echo "⚠️  Tauri CLI not found, installing..."
    npm install
fi

# 创建 dist 目录
echo "📁 Preparing build directory..."
mkdir -p dist/icons

# 复制图标文件
echo "🖼️  Copying icons..."
cp icons/*.png dist/icons/ 2>/dev/null || true
cp icons/*.svg dist/icons/ 2>/dev/null || true

# 生成 macOS .icns 图标
if [ -f "icons/icon128.png" ]; then
    echo "🎨 Generating macOS icon (.icns)..."
    if [ -f "generate_icns.sh" ]; then
        chmod +x generate_icns.sh
        ./generate_icns.sh icons/icon128.png dist/icons
    elif [ -f "generate_icns.py" ]; then
        python3 generate_icns.py icons/icon128.png dist/icons/icon.icns
    else
        echo "⚠️  Warning: Icon generation script not found"
        echo "   You may need to generate icon.icns manually"
    fi
else
    echo "⚠️  Warning: icon128.png not found"
fi

# 安装依赖
echo "📦 Installing dependencies..."
npm install

# 构建 Tauri 应用
echo "🔨 Building Tauri application..."
if command -v tauri &> /dev/null; then
    tauri build
else
    npx tauri build
fi

echo ""
echo "✅ Build completed!"
echo "📦 Output: src-tauri/target/release/bundle/macos/"
echo ""
echo "You can find the .app and .dmg files in the bundle directory."






