---
story_id: '12-1'
title: 'Mobile App Project Setup & Core Infrastructure'
epic: 'Epic 12: Mobile Quick Action App'
status: 'ready-for-dev'
created_at: '2026-02-01'
updated_at: '2026-02-01'
---

# Story 12.1: Mobile App Project Setup & Core Infrastructure

Status: ready-for-dev

## Story

As a Developer,
I want to initialize the Flutter project and set up the core architectural infrastructure (DI, Database, Network),
so that the team has a solid and consistent foundation for building mobile features.

## Acceptance Criteria

1.  **Project Initialization**: Proyek Flutter baru diinisialisasi menggunakan `flutter create --empty` dengan bundle ID `com.taskflow.quick_action_app`.
2.  **Dependency Management**: `pubspec.yaml` dikonfigurasi dengan semua paket yang diperlukan (Riverpod, Drift, Dio, Connectivity Plus, Freezed) sesuai dengan dokumen arsitektur.
3.  **Core Structure**: Folder structure (`core/`, `features/`, `shared/`) dibuat sesuai dengan pola Clean Architecture yang didefinisikan.
4.  **Database Foundation**: `AppDatabase` (Drift) diinisialisasi dengan tabel `PendingOperations` untuk mendukung sinkronisasi offline.
5.  **Network Client**: `DioClient` dikonfigurasi dengan base URL dari environment variables dan interceptor chain dasar (Log, Error).
6.  **Dependency Injection**: Provider dasar Riverpod untuk database, dio, dan connectivity service tersedia secara global.

## Tasks / Subtasks

- [ ] **Project Setup (AC: 1, 2)**
  - [ ] Jalankan `flutter create --empty --org com.taskflow --platforms android,ios quick_action_app`
  - [ ] Konfigurasi `pubspec.yaml` dengan dependensi dari `mobile-app-architecture.md`
  - [ ] Jalankan `flutter pub get`
- [ ] **Infrastructure Implementation (AC: 3, 4, 5, 6)**
  - [ ] Buat struktur direktori lengkap di bawah `lib/`
  - [ ] Implementasi `AppDatabase` di `lib/core/database/` dengan tabel `PendingOperations`
  - [ ] Implementasi `DioClient` di `lib/core/network/` dengan interceptor dasar
  - [ ] Siapkan file `lib/core/di/providers.dart` untuk dependency injection
  - [ ] Jalankan `build_runner` untuk menghasilkan file kode (Drift/Freezed)
- [ ] **Validation**
  - [ ] Pastikan aplikasi dapat di-build tanpa error
  - [ ] Verifikasi inisialisasi database lokal saat startup

## Dev Notes

- **Architecture Compliance**: Ikuti struktur folder dan konvensi penamaan di `lib/core` dan `lib/features` secara ketat.
- **Source tree components to touch**: Seluruh folder `quick_action_app/lib`.
- **Testing standards**: Siapkan folder `test/core/` untuk pengujian infrastruktur di story berikutnya.

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming) specified in [mobile-app-architecture.md](_bmad-output/planning-artifacts/mobile-app-architecture.md).
- Ensure `build_runner` is used for all code generation.

### References

- [Source: _bmad-output/planning-artifacts/mobile-app-architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/mobile-app-architecture.md#Flutter Package Dependencies]
- [Source: _bmad-output/planning-artifacts/mobile-app-architecture.md#Data Architecture]

## Dev Agent Record

### Agent Model Used

gemini-3-flash[1m]

### Debug Log References

- (Empty)

### Completion Notes List

- (Empty)

### File List
- `quick_action_app/pubspec.yaml`
- `quick_action_app/lib/core/database/app_database.dart`
- `quick_action_app/lib/core/network/dio_client.dart`
- `quick_action_app/lib/core/di/providers.dart`
