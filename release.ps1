# 极简番茄钟 - 自动发布脚本
# 自动打包、提交、创建标签并推送到GitHub

param(
    [string]$Version = "",
    [string]$Message = "",
    [switch]$SkipBuild = $false,
    [switch]$SkipPush = $false,
    [switch]$CreateRelease = $false,
    [string]$ReleaseNotes = ""
)

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 检查Git是否可用
function Test-GitAvailable {
    try {
        $null = git --version
        return $true
    } catch {
        return $false
    }
}

# 从manifest.json读取版本号
function Get-VersionFromManifest {
    $manifestPath = "manifest.json"
    if (-not (Test-Path $manifestPath)) {
        throw "manifest.json 文件不存在"
    }
    
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    return $manifest.version
}

# 检查是否有未提交的更改
function Test-UncommittedChanges {
    $status = git status --porcelain
    return $status.Count -gt 0
}

# 检查远程仓库是否配置
function Test-RemoteConfigured {
    $remotes = git remote
    return $remotes.Count -gt 0
}

# 获取远程仓库URL
function Get-RemoteUrl {
    $remoteUrl = git remote get-url origin 2>$null
    if ($remoteUrl) {
        return $remoteUrl
    }
    return $null
}

Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "  极简番茄钟 - 自动发布脚本" "Green"
Write-ColorOutput "========================================" "Cyan"
Write-Host ""

# 检查Git
if (-not (Test-GitAvailable)) {
    Write-ColorOutput "错误: 未检测到Git，请先安装Git" "Red"
    exit 1
}

# 获取版本号
if ([string]::IsNullOrEmpty($Version)) {
    $Version = Get-VersionFromManifest
    Write-ColorOutput "从 manifest.json 读取版本号: $Version" "Yellow"
} else {
    Write-ColorOutput "使用指定版本号: $Version" "Yellow"
    
    # 更新manifest.json中的版本号
    $manifestPath = "manifest.json"
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $manifest.version = $Version
    $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath -Encoding UTF8
    Write-ColorOutput "已更新 manifest.json 中的版本号为: $Version" "Green"
}

# 检查未提交的更改
if (Test-UncommittedChanges) {
    Write-ColorOutput "`n检测到未提交的更改：" "Yellow"
    git status --short
    Write-Host ""
    $confirm = Read-Host "是否继续？未提交的更改将被包含在发布中 (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-ColorOutput "已取消发布" "Yellow"
        exit 0
    }
}

# 检查远程仓库
$remoteUrl = Get-RemoteUrl
if (-not $remoteUrl) {
    Write-ColorOutput "`n警告: 未检测到远程仓库配置" "Yellow"
    Write-ColorOutput "请先配置远程仓库：" "Yellow"
    Write-Host "  git remote add origin https://github.com/USERNAME/REPO.git"
    $confirm = Read-Host "`n是否继续（仅本地操作）？(y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        exit 0
    }
    $SkipPush = $true
} else {
    Write-ColorOutput "远程仓库: $remoteUrl" "Cyan"
}

Write-Host ""

# 步骤1: 打包
if (-not $SkipBuild) {
    Write-ColorOutput "[1/5] 开始打包..." "Green"
    try {
        & .\build.ps1 -Version $Version
        if ($LASTEXITCODE -ne 0) {
            throw "打包失败"
        }
        Write-ColorOutput "✓ 打包完成" "Green"
    } catch {
        Write-ColorOutput "✗ 打包失败: $_" "Red"
        exit 1
    }
    Write-Host ""
} else {
    Write-ColorOutput "[1/5] 跳过打包步骤" "Yellow"
    Write-Host ""
}

# 步骤2: 提交更改
Write-ColorOutput "[2/5] 提交更改到Git..." "Green"
try {
    $packageName = "极简番茄钟-v$Version"
    $zipFile = "$packageName.zip"
    
    # 添加所有更改
    git add .
    
    # 生成提交消息
    if ([string]::IsNullOrEmpty($Message)) {
        $Message = "chore: 发布版本 v$Version"
    }
    
    # 提交
    git commit -m $Message
    Write-ColorOutput "✓ 已提交更改" "Green"
} catch {
    Write-ColorOutput "✗ 提交失败: $_" "Red"
    Write-ColorOutput "提示: 如果没有更改，可以跳过提交" "Yellow"
}
Write-Host ""

# 步骤3: 创建标签
Write-ColorOutput "[3/5] 创建Git标签 v$Version..." "Green"
try {
    # 检查标签是否已存在
    $tagExists = git tag -l "v$Version"
    if ($tagExists) {
        Write-ColorOutput "警告: 标签 v$Version 已存在" "Yellow"
        $confirm = Read-Host "是否删除并重新创建？(y/n)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            git tag -d "v$Version"
            if (-not $SkipPush) {
                git push origin ":refs/tags/v$Version" 2>$null
            }
        } else {
            Write-ColorOutput "跳过标签创建" "Yellow"
            $skipTag = $true
        }
    }
    
    if (-not $skipTag) {
        $tagMessage = if ($ReleaseNotes) { $ReleaseNotes } else { "Release version $Version" }
        git tag -a "v$Version" -m $tagMessage
        Write-ColorOutput "✓ 已创建标签 v$Version" "Green"
    }
} catch {
    Write-ColorOutput "✗ 创建标签失败: $_" "Red"
    exit 1
}
Write-Host ""

# 步骤4: 推送到GitHub
if (-not $SkipPush) {
    Write-ColorOutput "[4/5] 推送到GitHub..." "Green"
    try {
        # 获取当前分支名
        $branch = git branch --show-current
        if (-not $branch) {
            $branch = "master"
        }
        
        Write-ColorOutput "推送分支: $branch" "Cyan"
        git push origin $branch
        
        Write-ColorOutput "推送标签: v$Version" "Cyan"
        git push origin "v$Version"
        
        Write-ColorOutput "✓ 推送完成" "Green"
    } catch {
        Write-ColorOutput "✗ 推送失败: $_" "Red"
        Write-ColorOutput "提示: 请检查网络连接和Git认证" "Yellow"
        exit 1
    }
    Write-Host ""
} else {
    Write-ColorOutput "[4/5] 跳过推送步骤" "Yellow"
    Write-Host ""
}

# 步骤5: 创建GitHub Release（可选）
if ($CreateRelease -and -not $SkipPush) {
    Write-ColorOutput "[5/5] 创建GitHub Release..." "Green"
    
    # 检查是否安装了gh CLI
    $ghAvailable = $false
    try {
        $null = gh --version
        $ghAvailable = $true
    } catch {
        $ghAvailable = $false
    }
    
    if ($ghAvailable) {
        try {
            $packageName = "极简番茄钟-v$Version"
            $zipFile = "$packageName.zip"
            
            if (-not (Test-Path $zipFile)) {
                Write-ColorOutput "警告: 发布包 $zipFile 不存在，跳过上传" "Yellow"
            } else {
                $releaseBody = if ($ReleaseNotes) { $ReleaseNotes } else { "极简番茄钟 v$Version 发布" }
                
                Write-ColorOutput "使用 GitHub CLI 创建 Release..." "Cyan"
                gh release create "v$Version" `
                    --title "极简番茄钟 v$Version" `
                    --notes $releaseBody `
                    "$zipFile"
                
                Write-ColorOutput "✓ GitHub Release 创建成功" "Green"
            }
        } catch {
            Write-ColorOutput "✗ 创建GitHub Release失败: $_" "Red"
            Write-ColorOutput "提示: 请确保已安装 GitHub CLI (gh) 并已登录" "Yellow"
        }
    } else {
        Write-ColorOutput "未检测到 GitHub CLI (gh)" "Yellow"
        Write-ColorOutput "请手动在GitHub上创建Release：" "Yellow"
        Write-Host "  1. 访问仓库的 Releases 页面"
        Write-Host "  2. 点击 'Create a new release'"
        Write-Host "  3. 选择标签 v$Version"
        Write-Host "  4. 上传文件: $zipFile"
    }
    Write-Host ""
}

# 完成
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "  发布完成！" "Green"
Write-ColorOutput "========================================" "Cyan"
Write-Host ""
Write-ColorOutput "版本: v$Version" "Cyan"
Write-ColorOutput "发布包: 极简番茄钟-v$Version.zip" "Cyan"
Write-Host ""
Write-ColorOutput "下一步：" "Yellow"
Write-Host "  1. 在Chrome中测试 build 目录"
Write-Host "  2. 上传到Chrome Web Store"
if ($remoteUrl) {
    $repoName = ($remoteUrl -split '/')[-1] -replace '\.git$', ''
    $userName = ($remoteUrl -split '/')[-2] -replace '.*:', ''
    Write-Host "  3. 查看GitHub Release: https://github.com/$userName/$repoName/releases/tag/v$Version"
}
Write-Host ""

