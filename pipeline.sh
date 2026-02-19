#!/bin/bash

# ==========================================
# KONFIGURASI PIPELINE (ULTRA STABLE V12)
# ==========================================
DEV_DIR="D:/SAP"                # Folder pengembangan
MAIN_DIR="D:/Taskflow_main"    # Folder target produksi

echo "🚀 MEMULAI PIPELINE PRODUKSI (CLEAN & FORCE)..."
echo "---------------------------------------------------"

# 1. Validasi Folder
if [ ! -d "$MAIN_DIR" ]; then
    echo "❌ Error: Folder target $MAIN_DIR tidak ditemukan!"
    exit 1
fi

# 2. Sinkronisasi File (Direct Mirror)
echo "📥 1/4: Menyalin file dari Dev ke Main..."
# Gunakan robocopy untuk mirror folder (kecuali folder build dan env)
robocopy "$DEV_DIR/task-manager-server" "$MAIN_DIR/task-manager-server" /MIR /XD node_modules .git dist /XF .env > /dev/null
robocopy "$DEV_DIR/task-manager-client" "$MAIN_DIR/task-manager-client" /MIR /XD node_modules .git dist /XF .env > /dev/null

# PAKSA salin file krusial agar sinkron sempurna dan tidak ada 'Module Not Found'
mkdir -p "$MAIN_DIR/task-manager-server/src/database/migrations"
cp -f "$DEV_DIR/task-manager-client/vite.config.ts" "$MAIN_DIR/task-manager-client/vite.config.ts"
cp -f "$DEV_DIR/task-manager-server/src/index.ts" "$MAIN_DIR/task-manager-server/src/index.ts"
cp -f "$DEV_DIR/task-manager-server/src/database/migrations/add_supplier_email.ts" "$MAIN_DIR/task-manager-server/src/database/migrations/add_supplier_email.ts"

echo "   ✅ Sinkronisasi file selesai."

# 3. Build Backend
echo "⚙️  2/4: Building Backend (Server)..."
cd "$MAIN_DIR/task-manager-server" || exit
npm install --quiet
rm -rf dist
# Gunakan tsc langsung dengan pengabaian error tipe data untuk memastikan file dist tercipta
npx tsc --skipLibCheck || echo "⚠️ Warning: Build tetap dilanjutkan."

# 4. Build Frontend
echo "📦 3/4: Building Frontend (Client)..."
cd "$MAIN_DIR/task-manager-client" || exit
npm install --quiet
rm -rf dist
npx vite build

# 5. Restart Service dengan PM2
echo "🔄 4/4: Me-restart Layanan di PM2..."
cd "$MAIN_DIR" || exit

# Ambil port dari .env produksi
S_PORT=$(grep ^PORT task-manager-server/.env | cut -d'=' -f2 | tr -dc '0-9')
V_PORT=$(grep VITE_PORT task-manager-client/.env | cut -d'=' -f2 | tr -dc '0-9')
[ -z "$S_PORT" ] && S_PORT=4444
[ -z "$V_PORT" ] && V_PORT=8888

# NUCLEAR RESET: Matikan SEMUA proses Node yang mungkin mengunci port
echo "   - Membersihkan port $S_PORT, $V_PORT, dan sisa port 5555..."
powershell.exe -Command "& {
    \$ports = @(5555, 4444, 8888, 3333, 8181, $S_PORT, $V_PORT);
    foreach (\$p in \$ports) {
        \$proc = Get-NetTCPConnection -LocalPort \$p -ErrorAction SilentlyContinue;
        if (\$proc) {
            \$proc | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }
            Write-Host \"Membersihkan port \$p\"
        }
    }
    # Matikan proses node yang tersesat
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
}"

# Bersihkan PM2 secara total
pm2 delete all 2>/dev/null
sleep 3

# Start Backend
echo "   - Menjalankan Backend di port $S_PORT..."
pm2 start "$MAIN_DIR/task-manager-server/dist/index.js" --name taskflow-server-prod --cwd "$MAIN_DIR/task-manager-server"

# Start Frontend
echo "   - Menjalankan Frontend di port $V_PORT..."
cd "$MAIN_DIR/task-manager-client" || exit
pm2 start node_modules/vite/bin/vite.js --name taskflow-client-prod -- preview --port $V_PORT --host

# 6. Selesai
echo "---------------------------------------------------"
echo "✅ PIPELINE BERHASIL!"
echo "Aplikasi berjalan di: http://localhost:$V_PORT"
pm2 status
