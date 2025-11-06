#!/bin/bash
# Minimal Pomodoro Timer - Build Script
# Creates Chrome extension package

set -e

VERSION=${1:-"1.0.0"}
PACKAGE_NAME="minimal-pomodoro-v${VERSION}"
ZIP_FILE="${PACKAGE_NAME}.zip"
BUILD_DIR="build"

echo "Building Minimal Pomodoro Timer extension..."

# Clean old build files
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    echo "Cleaned old build directory"
fi

if [ -f "$ZIP_FILE" ]; then
    rm -f "$ZIP_FILE"
    echo "Removed old zip file"
fi

# Create build directory
mkdir -p "$BUILD_DIR"

# Copy files
echo "Copying files..."
cp manifest.json "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp -r css "$BUILD_DIR/"
cp -r js "$BUILD_DIR/"
cp -r icons "$BUILD_DIR/"

# Create zip file
echo "Creating zip file..."
cd "$BUILD_DIR"
zip -r "../${ZIP_FILE}" . > /dev/null
cd ..

echo ""
echo "Build completed!"
echo "Package: ${ZIP_FILE}"
echo ""
echo "Next steps:"
echo "1. Test the build directory in Chrome"
echo "2. Upload ${ZIP_FILE} to Chrome Web Store"

