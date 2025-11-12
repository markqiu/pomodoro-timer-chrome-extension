# 简单的 ICO 文件生成脚本
# 使用 .NET 从 PNG 创建 ICO

$pngPath = "dist\icons\icon128.png"
$icoPath = "dist\icons\icon.ico"

# 检查 PNG 文件是否存在
if (-not (Test-Path $pngPath)) {
    Write-Host "PNG file not found: $pngPath"
    exit 1
}

# 使用 PowerShell 和 .NET 创建 ICO
Add-Type -AssemblyName System.Drawing

try {
    $pngImage = [System.Drawing.Image]::FromFile((Resolve-Path $pngPath))
    $icoStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    
    # 创建 ICO 文件头
    $icoStream.WriteByte(0)  # Reserved
    $icoStream.WriteByte(0)  # Reserved
    $icoStream.WriteByte(1)  # Image type (1 = ICO)
    $icoStream.WriteByte(0)  # Number of images
    
    # 写入图像数据
    $pngImage.Save($icoStream, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $icoStream.Close()
    $pngImage.Dispose()
    
    Write-Host "ICO file created: $icoPath"
} catch {
    Write-Host "Error creating ICO file: $_"
    exit 1
}

