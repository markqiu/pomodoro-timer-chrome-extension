#!/bin/bash
# 生成 macOS .icns 图标文件
# 仅在 macOS 上可用（使用系统自带的 iconutil 和 sips）

set -e

# 检查是否在 macOS 上
if [[ "$(uname)" != "Darwin" ]]; then
    echo "Error: This script requires macOS (iconutil and sips are macOS-only)"
    exit 1
fi

# 设置输入和输出路径
PNG_PATH=${1:-"icons/icon128.png"}
OUTPUT_DIR=${2:-"dist/icons"}
OUTPUT_PATH="${OUTPUT_DIR}/icon.icns"

# 检查源文件是否存在
if [ ! -f "$PNG_PATH" ]; then
    echo "Error: PNG file not found: $PNG_PATH"
    echo "Usage: ./generate_icns.sh [input.png] [output_dir]"
    exit 1
fi

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 创建临时 .iconset 目录
ICONSET_DIR=$(mktemp -d -t icon.iconset)

echo "Generating .icns file from $PNG_PATH..."

# macOS 需要的图标尺寸和文件名
declare -a sizes=(
    "16:icon_16x16.png"
    "32:icon_16x16@2x.png"
    "32:icon_32x32.png"
    "64:icon_32x32@2x.png"
    "128:icon_128x128.png"
    "256:icon_128x128@2x.png"
    "256:icon_256x256.png"
    "512:icon_256x256@2x.png"
    "512:icon_512x512.png"
    "1024:icon_512x512@2x.png"
)

# 使用 sips 生成各种尺寸的图标
for size_info in "${sizes[@]}"; do
    size="${size_info%%:*}"
    filename="${size_info##*:}"
    output_file="${ICONSET_DIR}/${filename}"
    
    echo "  Creating ${filename} (${size}x${size})..."
    sips -z "$size" "$size" "$PNG_PATH" --out "$output_file" > /dev/null
done

# 使用 iconutil 生成 .icns 文件
echo "  Creating .icns file..."
iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_PATH"

# 清理临时目录
rm -rf "$ICONSET_DIR"

echo "✓ ICNS file created: $OUTPUT_PATH"






