#!/usr/bin/env python3
"""从 PNG 生成 ICO 文件"""
from PIL import Image
import os

png_path = "dist/icons/icon128.png"
ico_path = "dist/icons/icon.ico"

if not os.path.exists(png_path):
    print(f"PNG file not found: {png_path}")
    exit(1)

try:
    # 打开 PNG 图像
    img = Image.open(png_path)
    
    # 转换为 RGBA（如果需要）
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 保存为 ICO 文件
    # ICO 格式需要多个尺寸，但我们可以只使用一个
    img.save(ico_path, format='ICO', sizes=[(128, 128)])
    
    print(f"ICO file created: {ico_path}")
except Exception as e:
    print(f"Error creating ICO file: {e}")
    exit(1)

