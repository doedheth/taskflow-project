#!/bin/bash
# ==========================================
# PIPELINE PRODUKSI (CLEAN GIT VERSION)
# ==========================================
MAIN_DIR="D:/Taskflow_main"
REPO_URL="${REPO_URL:-https://github.com/doedheth/taskflow-project.git}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-dev}"
SERVER_APP="taskflow-server-prod"
CLIENT_APP="taskflow-client-prod"
DB_PATH="$MAIN_DIR/task-manager-server/data/taskmanager.db"
BK_DIR="$MAIN_DIR/.deploy_cache"
BK_PATH="$BK_DIR/taskmanager.db.bak"

set -e # Stop if any command fails

echo "🚀 Starting Production Deployment..."

# 1. Ensure Production Repo Exists and Up-to-Date
if [ ! -d "$MAIN_DIR/.git" ]; then
  echo "📦 Cloning production repository to $MAIN_DIR ..."
  git clone "$REPO_URL" "$MAIN_DIR"
fi

cd "$MAIN_DIR" || exit 1

# Set/Verify remote URL
git remote set-url origin "$REPO_URL"
echo "📥 Fetching changes from Cloud Repository (GitHub)..."
git fetch origin --prune

echo "🛑 Stopping running services before cleaning workspace..."
pm2 delete $SERVER_APP $CLIENT_APP 2>/dev/null || true
powershell.exe -Command "& { @(4444, 8181, 8888, 5555) | ForEach-Object { Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } }"

echo "🗄️ Preserving production database if present..."
mkdir -p "$BK_DIR"
if [ -f "$DB_PATH" ]; then
  cp -f "$DB_PATH" "$BK_PATH"
  echo "📦 Backed up DB to $BK_PATH"
fi

echo "🧹 Cleaning any pending merge/rebase state..."
git merge --abort 2>/dev/null || true
git rebase --abort 2>/dev/null || true
git reset --merge 2>/dev/null || true
git reset --hard 2>/dev/null || true
git clean -fdx 2>/dev/null || true

echo "🔀 Updating production branch (master) to match origin/${DEPLOY_BRANCH} (clean reset)..."
# Ensure we're on master
git checkout master || git checkout -b master
# Hard reset to selected branch to avoid merge conflicts/unrelated histories
git reset --hard "origin/${DEPLOY_BRANCH}"
# Remove untracked files to ensure a clean workspace
git clean -fdx

# Ensure submodules are clean and up-to-date
git submodule foreach --recursive git reset --hard || true
git submodule foreach --recursive git clean -fd || true
git submodule update --init --recursive --force

echo "🗃️ Restoring production database if backup exists..."
if [ -f "$BK_PATH" ]; then
  mkdir -p "$(dirname "$DB_PATH")"
  cp -f "$BK_PATH" "$DB_PATH"
  echo "✅ DB restored to $DB_PATH"
fi

# 2. Build Backend
echo "⚙️ Building Backend..."
cd task-manager-server
npm install --quiet
rm -rf dist
npx tsc --skipLibCheck

# 3. Build Frontend
echo "📦 Building Frontend..."
cd ../task-manager-client
npm install --quiet
rm -rf dist
npx vite build
cd ..

# 4. Refresh PM2 & Ports
echo "🔄 Restarting Services..."
S_PORT=$(grep ^PORT task-manager-server/.env | cut -d'=' -f2 | tr -dc '0-9' || echo "4444")
V_PORT=$(grep VITE_PORT task-manager-client/.env | cut -d'=' -f2 | tr -dc '0-9' || echo "8888")

# Force kill processes on ports using PowerShell (Escaped for Bash)
powershell.exe -Command "& { @($S_PORT, $V_PORT, 5555) | ForEach-Object { Get-NetTCPConnection -LocalPort \$_ -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue } } }"

pm2 delete $SERVER_APP $CLIENT_APP 2>/dev/null || true
sleep 2

pm2 start "task-manager-server/dist/index.js" --name $SERVER_APP --cwd "$MAIN_DIR/task-manager-server"
cd task-manager-client
pm2 start node_modules/vite/bin/vite.js --name $CLIENT_APP -- preview --port $V_PORT --host

echo "---------------------------------------------------"
echo "✅ Deployment Successful!"
pm2 status
