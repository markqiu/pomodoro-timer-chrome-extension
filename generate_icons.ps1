# 生成Chrome插件图标
# 注意：需要安装System.Drawing或使用其他图像处理库

$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    # 创建简单的PNG图标（使用.NET方法）
    Add-Type -AssemblyName System.Drawing
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # 创建渐变画刷
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, "#667eea", "#764ba2", 45)
    $graphics.FillRectangle($brush, $rect)
    
    # 绘制白色圆形边框
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(1, $size * 0.03))
    $graphics.DrawEllipse($pen, $size * 0.15, $size * 0.15, $size * 0.7, $size * 0.7)
    
    # 保存
    $bitmap.Save("icons\icon$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Generated icon$size.png"
}

Write-Host "All icons generated successfully!"

