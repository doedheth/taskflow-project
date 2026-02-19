#!/bin/bash
# ==========================================
# PIPELINE PRODUKSI (CLEAN GIT VERSION)
# ==========================================
MAIN_DIR="D:/Taskflow_main"
SERVER_APP="taskflow-server-prod"
CLIENT_APP="taskflow-client-prod"

set -e # Stop if any command fails

echo "🚀 Starting Production Deployment..."

# 1. Sync Production Code
cd "$MAIN_DIR" || exit
git fetch origin
git reset --hard origin/master
git submodule update --init --recursive --remote

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
