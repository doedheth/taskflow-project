#!/bin/bash

# ==========================================
# KONFIGURASI PIPELINE LOKAL
# ==========================================
MAIN_DIR="D:/Taskflow_main"    # Folder target produksi Anda
BRANCH_DEV="master"            # Branch saat ini (sebagai dev)
BRANCH_MAIN="main"            # Nama branch utama di folder target

echo "🚀 MEMULAI PIPELINE PRODUKSI LOKAL..."
echo "--------------------------------------"

# 1. Validasi Folder Target
if [ ! -d "$MAIN_DIR" ]; then
    echo "❌ Error: Folder $MAIN_DIR tidak ditemukan!"
    echo "Pastikan folder Taskflow_main berada di lokasi D:/Taskflow_main"
    exit 1
fi

# 2. Sinkronisasi Kode ke Folder Main
echo "📥 1/5: Menyamakan kode dengan branch $BRANCH_DEV..."
# Opsional: Kita bisa paksa push dari folder dev ini jika diinginkan
# git push origin $BRANCH_DEV

cd "$MAIN_DIR" || exit
git checkout $BRANCH_MAIN
git pull origin $BRANCH_MAIN # Pastikan main di lokal sama dengan di cloud
git fetch origin
git merge origin/$BRANCH_DEV --no-edit
git submodule update --init --recursive

# 3. Build Backend
echo "⚙️  2/5: Building Backend (Server)..."
cd task-manager-server
npm install
npm run build

# 4. Build Frontend
echo "📦 3/5: Building Frontend (Client)..."
cd ../task-manager-client
npm install
npm run build

# 5. Restart Service dengan PM2
echo "🔄 4/5: Me-restart Layanan di PM2..."
cd ..

# Restart Backend
pm2 restart taskflow-server-prod || pm2 start task-manager-server/dist/index.js --name taskflow-server-prod

# Restart Frontend (Hasil build)
pm2 restart taskflow-client-prod || pm2 start "npm --name taskflow-client-prod -- run preview"

# 6. Selesai
echo "--------------------------------------"
echo "✅ PIPELINE BERHASIL!"
echo "Aplikasi di Taskflow_main telah diperbarui dan dijalankan."
pm2 list
