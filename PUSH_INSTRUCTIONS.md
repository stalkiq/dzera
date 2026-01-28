# Push to GitHub Instructions

Due to Xcode license requirements, please run these commands manually in your terminal.

## Option 1: Run the Script

```bash
cd /Users/appleid/Desktop/aws-cost-janitor
./push-to-github.sh
```

## Option 2: Manual Commands

If the script doesn't work, run these commands one by one:

```bash
cd /Users/appleid/Desktop/aws-cost-janitor

# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/stalkiq/dzera.git
# Or if remote already exists:
# git remote set-url origin https://github.com/stalkiq/dzera.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: AWS Dzera cost optimization tool"

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## If You Get Authentication Errors

If GitHub asks for authentication, you can:

1. **Use Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a token with `repo` permissions
   - Use the token as password when prompted

2. **Use SSH instead:**
   ```bash
   git remote set-url origin git@github.com:stalkiq/dzera.git
   git push -u origin main
   ```

## Xcode License Issue

If you see Xcode license errors, run:
```bash
sudo xcodebuild -license
```
Then accept the license agreement.

