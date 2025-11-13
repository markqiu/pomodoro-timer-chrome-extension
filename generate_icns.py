#!/usr/bin/env python3
"""
生成 macOS .icns 图标文件
需要安装: pip install pillow pillow-icns
或者使用 macOS 系统的 iconutil（仅在 macOS 上可用）
"""
import os
import sys
from pathlib import Path

def generate_icns_with_iconutil(png_path, output_path):
    """使用 macOS 的 iconutil 命令生成 .icns 文件"""
    if sys.platform != 'darwin':
        print("Error: iconutil is only available on macOS")
        return False
    
    try:
        import subprocess
        import tempfile
        import shutil
        
        # 创建临时目录结构
        iconset_dir = tempfile.mkdtemp(suffix='.iconset')
        
        # macOS 需要的图标尺寸
        sizes = [
            (16, 'icon_16x16.png'),
            (32, 'icon_16x16@2x.png'),
            (32, 'icon_32x32.png'),
            (64, 'icon_32x32@2x.png'),
            (128, 'icon_128x128.png'),
            (256, 'icon_128x128@2x.png'),
            (256, 'icon_256x256.png'),
            (512, 'icon_256x256@2x.png'),
            (512, 'icon_512x512.png'),
            (1024, 'icon_512x512@2x.png'),
        ]
        
        # 使用 sips 调整图片尺寸（macOS 内置工具）
        for size, filename in sizes:
            output_file = os.path.join(iconset_dir, filename)
            cmd = ['sips', '-z', str(size), str(size), png_path, '--out', output_file]
            subprocess.run(cmd, check=True, capture_output=True)
        
        # 使用 iconutil 生成 .icns
        cmd = ['iconutil', '-c', 'icns', iconset_dir, '-o', output_path]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        # 清理临时目录
        shutil.rmtree(iconset_dir)
        
        print(f"ICNS file created: {output_path}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr.decode() if e.stderr else str(e)}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def generate_icns_with_pillow(png_path, output_path):
    """使用 Python PIL/Pillow 生成 .icns 文件（需要 pillow-icns）"""
    try:
        from PIL import Image
        
        # 尝试导入 pillow-icns
        try:
            from pillow_icns import IcnsFile
        except ImportError:
            print("Error: pillow-icns not installed. Install with: pip install pillow-icns")
            return False
        
        # 打开源图片
        img = Image.open(png_path)
        
        # 创建 .icns 文件
        icns = IcnsFile()
        
        # macOS 需要的图标尺寸
        sizes = [16, 32, 64, 128, 256, 512, 1024]
        
        # 添加各种尺寸的图标
        for size in sizes:
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            icns.add_media(file=resized)
        
        # 保存 .icns 文件
        with open(output_path, 'wb') as f:
            icns.write(f)
        
        print(f"ICNS file created: {output_path}")
        return True
        
    except ImportError:
        print("Error: PIL/Pillow not installed. Install with: pip install pillow")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    # 确定输入和输出路径
    if len(sys.argv) > 1:
        png_path = sys.argv[1]
    else:
        # 默认使用 icon128.png
        png_path = "icons/icon128.png"
    
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    else:
        # 确保 dist/icons 目录存在
        os.makedirs("dist/icons", exist_ok=True)
        output_path = "dist/icons/icon.icns"
    
    # 检查源文件是否存在
    if not os.path.exists(png_path):
        print(f"Error: PNG file not found: {png_path}")
        print("Usage: python generate_icns.py [input.png] [output.icns]")
        sys.exit(1)
    
    # 尝试使用 macOS 的 iconutil（优先，更可靠）
    if sys.platform == 'darwin':
        if generate_icns_with_iconutil(png_path, output_path):
            sys.exit(0)
    
    # 回退到使用 Python PIL/pillow-icns
    if generate_icns_with_pillow(png_path, output_path):
        sys.exit(0)
    
    # 如果都失败了，给出提示
    print("\nFailed to generate .icns file.")
    print("\nOptions:")
    print("1. On macOS: Ensure iconutil and sips are available (they come with macOS)")
    print("2. Install pillow-icns: pip install pillow pillow-icns")
    print("3. Use online converter or manual method")
    sys.exit(1)

if __name__ == "__main__":
    main()






