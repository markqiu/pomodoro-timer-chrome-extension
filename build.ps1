# 极简番茄钟 - 打包脚本
# 用于创建Chrome扩展的发布包

param(
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

Write-Host "开始打包极简番茄钟扩展..." -ForegroundColor Green

# 定义文件和目录
$packageName = "极简番茄钟-v$Version"
$zipFile = "$packageName.zip"
$buildDir = "build"

# 清理旧的构建文件
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
    Write-Host "已清理旧的构建目录" -ForegroundColor Yellow
}

if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
    Write-Host "已删除旧的zip文件" -ForegroundColor Yellow
}

# 创建构建目录
New-Item -ItemType Directory -Path $buildDir | Out-Null

# 需要包含的文件列表
$filesToInclude = @(
    "manifest.json",
    "popup.html",
    "css",
    "js",
    "icons"
)

# 复制文件
foreach ($item in $filesToInclude) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $buildDir -Recurse -Force
        Write-Host "已复制: $item" -ForegroundColor Cyan
    } else {
        Write-Warning "文件或目录不存在: $item"
    }
}

# 创建zip文件
Write-Host ""
Write-Host "正在创建zip文件..." -ForegroundColor Green

# 使用PowerShell 5.0+的Compress-Archive
Compress-Archive -Path "$buildDir\*" -DestinationPath $zipFile -Force

Write-Host ""
Write-Host "打包完成！" -ForegroundColor Green
Write-Host "发布包: $zipFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 检查 build 目录中的文件是否完整" -ForegroundColor White
Write-Host "2. 在Chrome中加载 build 目录进行测试" -ForegroundColor White
Write-Host "3. 确认无误后，使用 $zipFile 上传到Chrome Web Store" -ForegroundColor White

