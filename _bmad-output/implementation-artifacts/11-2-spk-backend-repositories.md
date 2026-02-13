---
story_id: '11-2'
title: 'SPK Backend Repositories'
epic: 'Epic 11: SPK Production Order System'
status: 'done'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 11-2 SPK Backend Repositories

Sebagai pengembang, saya ingin memiliki lapisan akses data (Repository) untuk Produk dan SPK sehingga operasi basis data dapat dikelola secara terpusat, aman, dan mendukung transaksi kompleks.

## Acceptance Criteria

- [x] `ProductRepository.ts` mengimplementasikan CRUD dasar dan pencarian produk.
- [x] `SPKRepository.ts` mengimplementasikan CRUD untuk header SPK.
- [x] `SPKRepository.ts` menangani penyimpanan line items dalam satu transaksi saat pembuatan/pembaruan SPK.
- [x] Mendukung fitur duplikasi SPK melalui logika repositori.
- [x] Implementasi pencarian SPK dengan filter (tanggal, mesin, status).

## Tasks / Subtasks

- [x] **Product Repository**
  - [x] Implement `ProductRepository.ts` extending `BaseRepository`
  - [x] Add `findByCode` and `search` methods
- [x] **SPK Repository**
  - [x] Implement `SPKRepository.ts`
  - [x] Add header + line items persistence logic
  - [x] Implement `duplicate` and `linkToProductionSchedule` methods

## Status
done
