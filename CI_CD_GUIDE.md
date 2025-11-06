# CI/CD Guide - GitHub Actions

## Overview

This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). The workflow automatically builds and releases the Chrome extension when you create a new version tag.

## Quick Start

### Automatic Release via Tag

1. **Update your code** (if needed)
2. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push
   ```

3. **Create and push a tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **GitHub Actions will automatically**:
   - Build the extension
   - Create a GitHub Release
   - Upload the zip file

### Manual Release via Workflow Dispatch

1. Go to **Actions** tab in GitHub
2. Select **Build and Release** workflow
3. Click **Run workflow**
4. Enter version (e.g., `1.0.1`)
5. Click **Run workflow**

## Workflow Details

### File Location

Workflow file: `.github/workflows/release.yml`

### Triggers

The workflow runs on:
- **Tag push**: When you push a tag matching `v*.*.*`
- **Manual dispatch**: When you manually trigger the workflow

### Workflow Steps

```
1. Checkout code
2. Setup Node.js
3. Extract version (from tag or input)
4. Update manifest.json version
5. Create build directory
6. Copy files to build/
7. Create zip package
8. Create GitHub Release
```

### Output Files

- **Package**: `minimal-pomodoro-v{version}.zip`
- **Release**: GitHub Release with tag `v{version}`

## Version Management

### Semantic Versioning

Use semantic versioning format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

### Version Tag Format

Tags must follow the pattern: `v{version}`

Examples:
- ✅ `v1.0.0`
- ✅ `v1.0.1`
- ✅ `v2.0.0`
- ❌ `1.0.0` (missing 'v' prefix)
- ❌ `v1.0` (missing patch version)

## Common Workflows

### Release a New Version

```bash
# 1. Make changes
# ... edit files ...

# 2. Commit changes
git add .
git commit -m "feat: add new feature"
git push

# 3. Create and push tag
git tag v1.0.1
git push origin v1.0.1

# 4. Wait for CI/CD to complete (check Actions tab)
```

### Hotfix Release

```bash
# 1. Fix the bug
# ... fix code ...

# 2. Commit fix
git add .
git commit -m "fix: critical bug fix"
git push

# 3. Create patch version tag
git tag v1.0.1  # if current is v1.0.0
git push origin v1.0.1
```

### Major Version Release

```bash
# 1. Update major version
# ... make breaking changes ...

# 2. Commit
git add .
git commit -m "feat: major update with breaking changes"
git push

# 3. Create major version tag
git tag v2.0.0
git push origin v2.0.0
```

## Monitoring Workflows

### View Workflow Runs

1. Go to **Actions** tab in GitHub
2. Click on **Build and Release** workflow
3. View all runs and their status

### Check Workflow Logs

1. Click on a workflow run
2. Click on a job (e.g., "build-and-release")
3. Expand steps to view logs

### Workflow Status Badge

Add this to your README to show workflow status:

```markdown
![CI/CD](https://github.com/username/repo/workflows/Build%20and%20Release/badge.svg)
```

## Troubleshooting

### Workflow Not Triggering

**Problem**: Tag push doesn't trigger workflow

**Solutions**:
- Ensure tag format is `v*.*.*` (e.g., `v1.0.1`)
- Check GitHub Actions is enabled in repository settings
- Verify `.github/workflows/release.yml` exists

### Build Fails

**Problem**: Build step fails

**Solutions**:
- Check all required files exist (manifest.json, popup.html, css/, js/, icons/)
- Verify file paths are correct
- Check workflow logs for specific error messages

### Release Creation Fails

**Problem**: Release creation fails

**Solutions**:
- Ensure `GITHUB_TOKEN` has proper permissions (automatically available)
- Check repository allows releases
- Verify tag doesn't already exist

### Version Not Updated

**Problem**: manifest.json version not updated

**Solutions**:
- Check tag format is correct
- Verify jq is installed (workflow handles this)
- Check workflow logs for version extraction step

## Best Practices

1. **Always test locally** before creating a release tag
2. **Use semantic versioning** for version numbers
3. **Write clear commit messages** for better history
4. **Monitor workflow runs** to catch issues early
5. **Review release notes** before publishing

## Advanced Configuration

### Custom Workflow Triggers

Edit `.github/workflows/release.yml` to add:
- Push to specific branches
- Pull request events
- Scheduled runs (cron)

### Custom Build Steps

Add custom steps in the workflow file:
```yaml
- name: Custom step
  run: |
    # Your custom commands
```

### Environment Variables

Add secrets in GitHub repository settings:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add your secret (e.g., `CHROME_WEB_STORE_API_KEY`)

## Integration with Chrome Web Store

To automatically upload to Chrome Web Store, you can:

1. Add Chrome Web Store API credentials as secrets
2. Add a step to upload to Chrome Web Store
3. Use Chrome Web Store API for automated publishing

Example (add to workflow):
```yaml
- name: Upload to Chrome Web Store
  uses: mnao305/chrome-extension-upload@v1.0.0
  with:
    file: minimal-pomodoro-v${{ steps.version.outputs.version }}.zip
    extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
    client-id: ${{ secrets.CHROME_CLIENT_ID }}
    client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
    refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Semantic Versioning](https://semver.org/)

