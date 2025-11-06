# GitHub Actions Workflows

## Automatic Release Workflow

This repository includes a GitHub Actions workflow that automatically builds and releases the Chrome extension when you create a new version tag.

### How It Works

1. **Trigger**: The workflow runs when you push a tag matching `v*.*.*` (e.g., `v1.0.1`)
2. **Build**: Extracts version from tag, updates manifest.json, and creates the extension package
3. **Release**: Creates a GitHub Release with the zip file attached

### Usage

#### Method 1: Push a Tag (Recommended)

```bash
# Update version in manifest.json first (optional, workflow will update it)
git add .
git commit -m "chore: bump version to 1.0.1"
git push

# Create and push tag
git tag v1.0.1
git push origin v1.0.1
```

The workflow will automatically:
- Extract version `1.0.1` from the tag
- Update `manifest.json` with the version
- Build the extension package
- Create a GitHub Release
- Upload the zip file

#### Method 2: Manual Trigger

1. Go to the **Actions** tab in GitHub
2. Select **Build and Release** workflow
3. Click **Run workflow**
4. Enter the version number (e.g., `1.0.1`)
5. Click **Run workflow**

### Workflow Steps

1. **Checkout code**: Checks out the repository
2. **Setup Node.js**: Sets up Node.js for version parsing
3. **Extract version**: Extracts version from tag or uses manual input
4. **Update manifest.json**: Updates the version in manifest.json
5. **Create build directory**: Creates the build folder
6. **Copy files**: Copies all necessary files to build directory
7. **Create zip file**: Packages everything into a zip file
8. **Create release**: Creates GitHub Release with the package

### Output

After the workflow completes, you'll find:
- A new GitHub Release with the tag version
- The extension zip file attached to the release
- Updated manifest.json with the correct version

### Troubleshooting

#### Workflow fails to trigger

- Ensure the tag matches the pattern `v*.*.*` (e.g., `v1.0.1`)
- Check that GitHub Actions is enabled in repository settings

#### Build fails

- Check that all required files exist (manifest.json, popup.html, css/, js/, icons/)
- Verify file permissions

#### Release creation fails

- Ensure `GITHUB_TOKEN` has release permissions (automatically available)
- Check repository settings allow releases

### Notes

- The workflow runs on Ubuntu (Linux)
- It uses `jq` to update JSON files
- The zip file is named `minimal-pomodoro-v{version}.zip`
- Releases are created as public releases (not drafts)

