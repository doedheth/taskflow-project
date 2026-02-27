#!/bin/bash
# ==========================================
# SCRIPT OTOMATISASI SYNC CLOUD (DEV -> MASTER)
# ==========================================

set -e # Stop jika ada error

echo "🔄 Memulai Sinkronisasi Cloud..."

# 1. Pastikan kita di branch dev dan ambil update terbaru
echo "📥 Mengirim perubahan dari lokal ke origin/dev..."
git checkout dev
git push origin dev

# 2. Pindah ke master untuk proses merge
echo "🔀 Berpindah ke branch master..."
git checkout master
git pull origin master

# 3. Merge dev ke master
echo "Merging dev ke master..."
git merge dev --no-edit

# 4. Push master yang sudah di-merge ke cloud
echo "📤 Mengirim hasil merge ke origin/master (Cloud)..."
git push origin master

# 5. Kembali ke branch dev agar bisa lanjut bekerja
echo "🔙 Kembali ke branch dev..."
git checkout dev

echo "---------------------------------------------------"
echo "✅ Sinkronisasi Cloud Berhasil!"
echo "Sekarang Anda bisa menjalankan 'npm run deploy' untuk update produksi."
