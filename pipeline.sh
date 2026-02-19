#!/bin/bash

# ==========================================
# KONFIGURASI PIPELINE (VIA GITHUB)
# ==========================================
DEV_DIR="D:/SAP"                # Folder pengembangan
MAIN_DIR="D:/Taskflow_main"    # Folder target produksi
BRANCH_DEV="master"            # Branch asal di dev
BRANCH_MAIN="main"             # Branch tujuan di main

echo "🚀 MEMULAI PIPELINE PRODUKSI (VIA GITHUB)..."
echo "---------------------------------------------------"

# 1. Push perubahan dari folder DEV ke GitHub
echo "📤 1/6: Mengirimkan perubahan ke GitHub..."
cd "$DEV_DIR" || exit

# Push submodules dulu jika ada perubahan di dalamnya
echo "   - Memeriksa submodules..."
git submodule foreach 'git push origin master 2>/dev/null || echo "No changes in submodule or push failed"'

# Push repository utama
echo "   - Memeriksa repository utama..."
git push origin $BRANCH_DEV

# 2. Pindah ke folder MAIN dan ambil perubahan dari GitHub
echo "📥 2/6: Menarik perubahan di folder Main..."
if [ ! -d "$MAIN_DIR" ]; then
    echo "❌ Error: Folder target $MAIN_DIR tidak ditemukan!"
    exit 1
fi

cd "$MAIN_DIR" || exit
git checkout $BRANCH_MAIN 2>/dev/null || git checkout -b $BRANCH_MAIN
git fetch origin
git merge origin/$BRANCH_DEV --no-edit

# Update submodules dari GitHub
echo "🔄 3/6: Mengupdate submodules dari GitHub..."
git submodule update --init --recursive --remote

# 4. Build Backend
echo "⚙️  4/6: Building Backend (Server)..."
if [ -d "task-manager-server" ]; then
    cd task-manager-server || exit
    npm install
    npm run build
    cd ..
fi

# 5. Build Frontend
echo "📦 5/6: Building Frontend (Client)..."
if [ -d "task-manager-client" ]; then
    cd task-manager-client || exit
    npm install
    npx vite build
    cd ..
fi

# 6. Restart Service dengan PM2
echo "🔄 6/6: Me-restart Layanan di PM2..."

# Restart Backend
pm2 restart taskflow-server-prod || pm2 start "$MAIN_DIR/task-manager-server/dist/index.js" --name taskflow-server-prod

# Restart Frontend
cd "$MAIN_DIR/task-manager-client" || exit
pm2 delete taskflow-client-prod 2>/dev/null
pm2 start npm --name taskflow-client-prod -- run preview

# 7. Selesai
echo "---------------------------------------------------"
echo "✅ PIPELINE BERHASIL!"
echo "Aplikasi di $MAIN_DIR kini sinkron dengan GitHub."
pm2 list
