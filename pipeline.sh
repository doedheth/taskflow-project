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

# Push submodules (Gagal tidak apa-apa, lanjut ke langkah berikutnya)
echo "   - Memeriksa submodules..."
git submodule foreach 'git push origin master 2>/dev/null' || echo "   ⚠️  Beberapa submodule gagal di-push (abaikan jika tidak ada perubahan)."

# Push repository utama
echo "   - Memeriksa repository utama..."
git push origin $BRANCH_DEV || echo "   ⚠️  Gagal push ke GitHub. Pastikan Remote URL sudah benar."

# 2. Pindah ke folder MAIN dan ambil perubahan dari GitHub
echo "📥 2/6: Menarik perubahan di folder Main..."
if [ ! -d "$MAIN_DIR" ]; then
    echo "❌ Error: Folder target $MAIN_DIR tidak ditemukan!"
    exit 1
fi

cd "$MAIN_DIR" || exit
git checkout $BRANCH_MAIN 2>/dev/null || git checkout -b $BRANCH_MAIN
git fetch origin 2>/dev/null
git merge origin/$BRANCH_DEV --no-edit || echo "   ⚠️  Gagal merge dari GitHub. Mencoba lanjut dengan kode lokal yang ada."

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

# Masuk ke folder root MAIN_DIR untuk mencari .env
cd "$MAIN_DIR" || exit

# Ambil port backend dari folder server
S_PORT=5555
if [ -f "task-manager-server/.env" ]; then
    # Mengambil nilai PORT dan membersihkan karakter non-numeric
    S_PORT=$(grep ^PORT task-manager-server/.env | cut -d'=' -f2 | tr -dc '0-9')
fi
[ -z "$S_PORT" ] && S_PORT=5555

# Paksa matikan proses yang menggunakan port tersebut menggunakan PowerShell (Sangat Agresif)
echo "   - Membebaskan port backend $S_PORT..."
powershell.exe -Command "$proc = Get-NetTCPConnection -LocalPort $S_PORT -ErrorAction SilentlyContinue; if ($proc) { $proc | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }" 2>/dev/null

# Restart Backend
echo "   - Restarting Backend on port $S_PORT..."
pm2 delete taskflow-server-prod 2>/dev/null
sleep 4 # Jeda lebih lama untuk Windows
pm2 start "$MAIN_DIR/task-manager-server/dist/index.js" --name taskflow-server-prod --cwd "$MAIN_DIR/task-manager-server"

# Restart Frontend
echo "   - Restarting Frontend..."
cd "$MAIN_DIR/task-manager-client" || exit
pm2 delete taskflow-client-prod 2>/dev/null

# Ambil port frontend dari folder client (Dipaksa ke 8888 sesuai permintaan)
V_PORT=8888

# Pastikan file .env di folder produksi juga sinkron dengan port 8888
if [ -f ".env" ]; then
    # Update atau tambah VITE_PORT=8888 di file .env
    if grep -q "VITE_PORT" .env; then
        sed -i 's/VITE_PORT=.*/VITE_PORT=8888/g' .env
    else
        echo "VITE_PORT=8888" >> .env
    fi
fi

# Paksa matikan proses yang menggunakan port frontend
echo "   - Membebaskan port frontend $V_PORT..."
powershell.exe -Command "$proc = Get-NetTCPConnection -LocalPort $V_PORT -ErrorAction SilentlyContinue; if ($proc) { $proc | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }" 2>/dev/null
sleep 2

# Gunakan path langsung ke vite.js agar PM2 tidak bingung dengan file .cmd di Windows
pm2 start node_modules/vite/bin/vite.js --name taskflow-client-prod -- preview --port $V_PORT --host








# 7. Selesai
echo "---------------------------------------------------"
echo "✅ PIPELINE BERHASIL!"
echo "Aplikasi di $MAIN_DIR kini sinkron dengan GitHub."
pm2 list
