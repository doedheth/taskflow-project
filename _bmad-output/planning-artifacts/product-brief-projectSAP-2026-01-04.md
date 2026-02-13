---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
date: 2026-01-04
author: Dedy
workflowType: 'product-brief'
project_name: 'Mobile Quick Action App'
elicitation_methods_applied:
  - User Persona Focus Group
  - SCAMPER Method
---

# Product Brief: Mobile Quick Action App

## Executive Summary

**TaskFlow Mobile Quick Action** adalah aplikasi mobile (APK) yang memungkinkan user lapangan untuk log downtime, memantau ticket/WO, dan melihat beban kerja mereka - hanya dengan beberapa tap, tanpa perlu buka browser atau mengetik panjang.

**Masalah yang Dipecahkan:**
- User lapangan kesulitan akses TaskFlow via browser di HP (harus ketik URL)
- Laporan downtime masih ditulis manual di kertas pada akhir shift
- Data downtime tidak akurat karena waktu dicatat dari ingatan, bukan real-time
- KPI menjadi tidak valid karena data input terlambat dan tidak presisi

**Solusi:**
- Native mobile app dengan UI minimalis berbasis button (seperti remote control)
- Quick Downtime: Tap "Mulai" → waktu tercatat otomatis → Tap "Selesai" → durasi terhitung
- Voice note sebagai alternatif ketik deskripsi panjang
- Terintegrasi penuh dengan TaskFlow existing (shared backend API)
- Offline-first dengan auto-sync untuk area sinyal lemah

**Value Proposition:**
"Hanya tinggal tap dan selesai - tanpa ribet membuat laporan downtime"

---

## Core Vision

### Problem Statement

User lapangan (teknisi, operator) kesulitan mengakses TaskFlow melalui browser di handphone. Mereka harus membuka browser, mengetik URL, dan mengisi form dengan deskripsi panjang. Akibatnya, laporan downtime baru dibuat di akhir shift secara manual di kertas, menyebabkan:
- Waktu mulai dan selesai downtime tidak akurat (berdasarkan ingatan)
- Deskripsi tidak lengkap karena sudah lupa detail
- Data KPI menjadi tidak valid

### Problem Impact

| Dampak | Konsekuensi |
|--------|-------------|
| **Data Tidak Real-time** | Waktu downtime dicatat dari ingatan, bukan saat kejadian |
| **KPI Tidak Valid** | Perhitungan MTTR, availability, dan metrik lain menjadi tidak akurat |
| **Beban User** | User harus mengingat semua kejadian dan menulis di akhir shift |
| **Proses Duplikat** | Tulis di kertas → kemudian input ke sistem = double work |
| **Supervisor Blind Spot** | Supervisor tidak tahu ada breakdown sampai akhir shift |

### Why Existing Solutions Fall Short

TaskFlow web sudah ada dan berfungsi baik, namun tidak optimal untuk user lapangan karena:
- Akses via browser memerlukan langkah ekstra (buka browser, ketik URL)
- Form input memerlukan pengetikan deskripsi panjang
- Tidak ada fitur quick-action untuk log downtime instan
- UI tidak dioptimasi untuk penggunaan cepat di lapangan
- Button tidak friendly untuk user dengan sarung tangan
- Tidak ada offline capability untuk area dengan sinyal lemah
- Tidak ada push notification untuk real-time awareness

### Proposed Solution

**TaskFlow Mobile Quick Action App** - aplikasi native Android (APK) dengan fitur:

**Core Features (MVP):**

1. **Quick Downtime Log**
   - Tap "Mulai Downtime" → waktu tercatat otomatis
   - **Recent Machines** - 5 mesin terakhir di home screen
   - Pilih kategori masalah (button/dropdown)
   - **Voice Note** - rekam 10 detik sebagai alternatif ketik
   - Tap "Selesai" → durasi terhitung otomatis
   - Foto opsional sebagai bukti

2. **Monitor Ticket/WO**
   - Lihat ticket yang di-assign
   - Lihat work order yang harus dikerjakan
   - Status update real-time

3. **Personal Workload**
   - Lihat beban kerja hari ini
   - Prioritas tugas yang jelas

**Critical Features:**

4. **Offline Mode** - Queue downtime logs saat offline, sync otomatis saat online
5. **Timestamp Integrity** - Waktu dikunci setelah submit, tidak bisa diedit
6. **Push Notifications** - Alert supervisor saat breakdown dimulai
7. **Biometric Login** - Fingerprint/Face ID, stay logged in
8. **Large Touch Targets** - Button besar untuk user dengan sarung tangan

**Growth Features (Post-MVP):**

9. **QR Code Scan** - Scan QR di mesin untuk auto-identify (v1.1)
10. **One-Tap Emergency** - Tombol darurat untuk breakdown critical (v1.1)
11. **Supervisor Watch List** - Subscribe ke mesin critical untuk alert khusus (v1.5)
12. **Before/After Photo** - Dokumentasi PM dengan foto sebelum dan sesudah (v2.0+)
13. **NFC Tag Support** - Tap HP ke tag di mesin untuk ultra-fast identify (v2.0+)
14. **Collaborative Log** - Multiple teknisi contribute ke satu downtime event (v2.0+)

### Key Differentiators

| Differentiator | Penjelasan |
|----------------|------------|
| **Ultra-Simple UI** | Button-based seperti remote control - minimal typing, maksimal tapping |
| **Voice Note Input** | Rekam suara sebagai deskripsi - hands-free saat tangan kotor |
| **Real-time Timestamp** | Waktu tercatat saat tap, bukan input manual dari ingatan |
| **Shared Backend** | Terintegrasi penuh dengan TaskFlow existing - satu database, satu API |
| **Zero Learning Curve** | User yang sudah pakai TaskFlow langsung familiar |
| **Offline-First** | Log downtime meski sinyal lemah, auto-sync saat online |
| **Tamper-Proof Timestamps** | Waktu dikunci setelah submit - integritas data terjamin |
| **Glove-Friendly** | Large buttons untuk user dengan sarung tangan di lapangan |
| **Push Notifications** | Supervisor dapat notifikasi real-time saat breakdown terjadi |

---

## Target Users

### Primary Users

#### Teknisi/Operator Lapangan

**Persona: Rudi (35 tahun) - Teknisi Maintenance**

| Aspek | Detail |
|-------|--------|
| **Usia** | 30-40 tahun |
| **Pendidikan** | SMK/D3 Teknik |
| **Shift** | 8 jam, kadang lembur |
| **Downtime/Shift** | 2-3 log per shift |
| **Device** | Android pribadi |
| **Kondisi Kerja** | Sering pakai sarung tangan |

**Pain Points:**
- Harus mengingat kejadian downtime sampai akhir shift
- Menulis laporan manual memakan waktu 20-30 menit
- Data tidak akurat karena dari ingatan
- Lelah setelah kerja, masih harus bikin laporan

**Goals:**
- Laporan downtime yang tidak ribet
- Tidak perlu mengingat-ingat kejadian
- Pulang tepat waktu

**Success Statement:**
> "Kalau bisa langsung tap-tap selesai waktu kejadian, saya gak perlu pusing ingat-ingat lagi di akhir shift."

### Secondary Users

| User | Platform | Kebutuhan |
|------|----------|-----------|
| **Supervisor** | Web + Notifikasi | Real-time awareness saat breakdown terjadi |
| **Manager** | Web Dashboard | Data downtime akurat untuk KPI dan reporting |

*Secondary users tidak menggunakan Mobile App secara langsung - mereka mendapat benefit dari data yang diinput oleh Primary User (Teknisi).*

### User Journey

**Rudi's Journey dengan Mobile Quick Action App:**

| Stage | Aksi | Waktu |
|-------|------|-------|
| 1. **Mesin Breakdown** | Tap "Mulai Downtime" | 3 detik |
| 2. **Identifikasi Mesin** | Pilih dari Recent Machines | 3 detik |
| 3. **Perbaikan** | Fokus kerja (HP di saku) | - |
| 4. **Mesin Jalan** | Tap "Selesai" | 3 detik |
| 5. **Detail (opsional)** | Pilih kategori + voice note | 15 detik |
| 6. **Akhir Shift** | ✅ Tidak perlu buat laporan | 0 menit |

**Total waktu input:** ~25 detik per downtime (vs 10-15 menit manual di akhir shift)

**"Aha!" Moment:**
Rudi menyadari bahwa dia sudah tidak perlu menulis laporan manual lagi. Semua downtime sudah tercatat real-time dengan waktu yang akurat. Dia bisa pulang tepat waktu tanpa lembur untuk bikin laporan.

---

## Success Metrics

### User Success Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| **App Adoption Rate** | % teknisi yang aktif menggunakan app | 80% dalam 3 bulan |
| **Input Time Reduction** | Waktu total input per downtime | < 30 detik (vs 10-15 menit manual) |
| **User Satisfaction** | Teknisi merasa terbantu | Tidak perlu lembur bikin laporan |
| **Feature Usage** | Fitur yang paling sering dipakai | Quick Downtime > 90% usage |

**User Success Statement:**
> Rudi bisa pulang tepat waktu karena tidak perlu lagi menulis laporan manual di akhir shift. Semua downtime sudah tercatat real-time saat kejadian.

### Business Objectives

| Objective | Target | Timeframe |
|-----------|--------|-----------|
| **Downtime Real-time Recording** | 95% downtime tercatat saat kejadian | 3 bulan |
| **Data Accuracy** | 100% akurasi waktu downtime | 3 bulan |
| **User Adoption** | 80% teknisi aktif menggunakan app | 3 bulan |
| **Reporting Efficiency** | Eliminate manual paper reporting | 3 bulan |

### Key Performance Indicators

#### Primary KPIs (Must Improve)

| KPI | Baseline (Current) | Target | How to Measure |
|-----|-------------------|--------|----------------|
| **Downtime Accuracy** | Data dari ingatan, ±30 menit error | Real-time (±1 menit) | Compare logged time vs actual |
| **Reporting Time** | 20-30 menit per shift | < 2 menit total | Time tracking in app |
| **Data Timeliness** | Delay 6-8 jam (end of shift) | Delay < 5 menit | Timestamp difference |
| **MTTR Validity** | Not reliable | Valid & trackable | Audit trail accuracy |

#### Secondary KPIs (Monitor)

| KPI | Target | How to Measure |
|-----|--------|----------------|
| **Supervisor Response Time** | < 5 menit dari breakdown | Push notification to action |
| **App Daily Active Users** | 80% of technicians | Login/activity logs |
| **Offline Sync Success** | 99% data synced successfully | Sync failure rate |

### Success Timeline

| Milestone | Timeframe | Success Criteria |
|-----------|-----------|------------------|
| **Launch** | Week 1 | App available di Play Store internal |
| **Early Adoption** | Month 1 | 50% teknisi install & try |
| **Active Usage** | Month 2 | 70% teknisi log min 1 downtime/week |
| **Full Adoption** | Month 3 | 80% teknisi aktif, 95% downtime real-time |
| **Business Impact** | Month 4+ | MTTR accuracy validated, KPI reports reliable |

---

## MVP Scope

### Core Features (Must Have)

**Quick Downtime Logging:**
1. **Start/Stop Timer** - Tap "Mulai Downtime" dan "Selesai" dengan auto-timestamp
2. **Machine Selection** - Pilih dari Recent Machines (5 mesin terakhir)
3. **Category Selection** - Pilih kategori masalah dari dropdown/button
4. **Voice Note** - Rekam deskripsi 10 detik sebagai alternatif ketik
5. **Photo Attachment** - Foto opsional sebagai bukti (tidak wajib)

**Monitoring:**
6. **View Tickets** - Lihat ticket yang di-assign ke user
7. **View Work Orders** - Lihat WO yang harus dikerjakan
8. **Personal Workload** - Lihat beban kerja dan prioritas hari ini

### Critical Features (Must Have)

**Reliability:**
9. **Offline Mode** - Queue data saat offline, auto-sync saat online
10. **Timestamp Integrity** - Waktu tidak bisa diedit setelah submit

**User Experience:**
11. **Biometric Login** - Fingerprint/Face ID, stay logged in
12. **Large Touch Targets** - Button besar (min 48x48dp) untuk sarung tangan

**Notifications:**
13. **Push Notification** - Alert supervisor saat breakdown dimulai

### Out of Scope for MVP

| Feature | Reason | Target Version |
|---------|--------|----------------|
| **QR Code Scan** | Butuh generate & pasang QR di semua mesin | v1.1 |
| **NFC Tag Support** | Perlu hardware tambahan | v2.0+ |
| **Before/After Photo PM** | Enhancement untuk PM workflow | v2.0+ |
| **Supervisor Watch List** | Nice-to-have, bukan core | v1.5 |
| **Collaborative Log** | Complex multi-user feature | v2.0+ |
| **One-Tap Emergency** | Perlu define emergency protocol | v1.1 |

### MVP Success Criteria

| Criteria | Target | Validation |
|----------|--------|------------|
| **Zero Paper Reporting** | 100% downtime log via app | No paper forms submitted |
| **User Adoption** | 80% teknisi aktif | App analytics |
| **Data Timeliness** | 95% downtime logged real-time | Timestamp < 5 menit dari kejadian |
| **App Stability** | 99% sync success rate | Error monitoring |

**Go/No-Go Decision Point:**
Setelah 1 bulan, jika zero paper reporting tercapai dan 50%+ teknisi aktif, proceed ke v1.1 dengan QR Code Scan.

### Future Vision

**v1.1 (Month 2):**
- QR Code Scan untuk identifikasi mesin
- One-Tap Emergency button

**v1.5 (Month 4):**
- Supervisor Watch List (subscribe ke mesin)
- Enhanced notification settings

**v2.0 (Month 6+):**
- NFC Tag Support
- Before/After Photo untuk PM
- Collaborative Downtime Log
- AI-assisted kategori suggestion

**Long-term Vision:**
Mobile Quick Action App menjadi primary interface untuk semua field operations - tidak hanya downtime, tapi juga PM execution, safety reporting, dan inventory request. Tujuan akhir: paperless factory floor operations.

