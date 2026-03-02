# Workflow Diagrams - TaskFlow Management System

Dokumen ini berisi diagram workflow yang dapat digunakan untuk presentasi.

---

## 1. Alur Sistem TaskFlow Secara Keseluruhan

```mermaid
flowchart TB
    subgraph INPUT["INPUT DATA"]
        A[Teknisi] --> |Log Downtime| B[TaskFlow]
        C[Supervisor] --> |Buat Work Order| B
        D[Operator] --> |Lapor Masalah| B
    end

    subgraph SYSTEM["SISTEM TASKFLOW"]
        B --> E[(Database)]
        E --> F[AI Engine]
        F --> |Analisis| G[Smart Insights]
    end

    subgraph OUTPUT["OUTPUT"]
        G --> H[Dashboard Real-time]
        G --> I[Laporan Otomatis]
        G --> J[Notifikasi dan Alert]
        G --> K[Rekomendasi AI]
    end

    subgraph USERS["PENGGUNA"]
        H --> L[Manager]
        I --> L
        H --> M[Supervisor]
        J --> M
        K --> N[Teknisi]
    end

    style F fill:#6366f1,color:#fff
    style G fill:#6366f1,color:#fff
    style K fill:#10b981,color:#fff
```

---

## 2. Alur AI Smart Assignment - Penugasan Cerdas

```mermaid
flowchart LR
    subgraph TRIGGER["PEMICU"]
        A[Tugas Baru atau WO Baru]
    end

    subgraph AI_ANALYSIS["ANALISIS AI"]
        A --> B{AI Analisis}
        B --> C[Cek Beban Kerja Tim]
        B --> D[Cek Keahlian Teknisi]
        B --> E[Cek Lokasi dan Jadwal]
        B --> F[Cek Prioritas Tugas]
    end

    subgraph RESULT["HASIL"]
        C --> G[Skor Matching]
        D --> G
        E --> G
        F --> G
        G --> H[Ranking Kandidat]
        H --> I[Rekomendasi Terbaik]
    end

    subgraph ACTION["AKSI"]
        I --> J{Supervisor Review}
        J --> |Setuju| K[Assign ke Teknisi]
        J --> |Ubah| L[Pilih Manual]
        L --> K
    end

    style B fill:#6366f1,color:#fff
    style I fill:#10b981,color:#fff
```

---

## 3. Alur Root Cause Analysis - Analisis Akar Masalah

```mermaid
flowchart TB
    subgraph TRIGGER["PEMICU ANALISIS"]
        A[Breakdown Terjadi]
        B[Request Analisis Manual]
    end

    subgraph DATA_COLLECTION["PENGUMPULAN DATA"]
        A --> C[Kumpulkan Data]
        B --> C
        C --> D[Riwayat Downtime 90 Hari]
        C --> E[Work Order Historis]
        C --> F[Jadwal PM dan Compliance]
        C --> G[Failure Codes]
    end

    subgraph AI_PROCESSING["PROSES AI"]
        D --> H{AI Analysis Engine}
        E --> H
        F --> H
        G --> H
        H --> I[Identifikasi Pola]
        H --> J[Hitung Contributing Factors]
        H --> K[Cari Insiden Serupa]
    end

    subgraph OUTPUT["HASIL ANALISIS"]
        I --> L[Probable Root Cause]
        J --> M[Factor Weights]
        K --> N[Similar Cases]
        L --> O[Rekomendasi Tindakan]
        M --> O
        N --> O
    end

    subgraph ACTION["TINDAK LANJUT"]
        O --> P{Review Supervisor}
        P --> Q[Buat WO Perbaikan]
        P --> R[Update Jadwal PM]
        P --> S[Training Teknisi]
    end

    style H fill:#6366f1,color:#fff
    style L fill:#ef4444,color:#fff
    style O fill:#10b981,color:#fff
```

---

## 4. Alur Pencatatan Downtime

```mermaid
flowchart LR
    subgraph START["KEJADIAN"]
        A[Mesin Breakdown]
    end

    subgraph RECORD["PENCATATAN"]
        A --> B[Buka TaskFlow]
        B --> C[Tap Mulai Downtime]
        C --> D[Timer Mulai Otomatis]
        D --> E[Pilih Mesin]
        E --> F[Pilih Kategori Masalah]
    end

    subgraph REPAIR["PERBAIKAN"]
        F --> G[Teknisi Perbaiki]
    end

    subgraph END_RECORD["SELESAI"]
        G --> H[Mesin Jalan]
        H --> I[Tap Selesai]
        I --> J[Durasi Terhitung Otomatis]
        J --> K[Tambah Catatan atau Foto]
        K --> L[Data Tersimpan]
    end

    subgraph BENEFIT["MANFAAT"]
        L --> M[KPI Akurat]
        L --> N[Trend Analysis]
        L --> O[Input untuk AI RCA]
    end

    style D fill:#f59e0b,color:#fff
    style J fill:#10b981,color:#fff
    style L fill:#6366f1,color:#fff
```

---

## 5. Alur Dashboard Berbasis Role

```mermaid
flowchart TB
    subgraph LOGIN["LOGIN"]
        A[User Login]
    end

    A --> B{Cek Role User}

    subgraph ADMIN["ADMIN DASHBOARD"]
        B --> |Admin| C[System Health]
        C --> C1[Status Server]
        C --> C2[User Activity]
        C --> C3[AI Usage Stats]
    end

    subgraph MANAGER["MANAGER DASHBOARD"]
        B --> |Manager| D[Executive View]
        D --> D1[KPI Summary]
        D --> D2[Team Performance]
        D --> D3[AI Recommendations]
    end

    subgraph SUPERVISOR["SUPERVISOR DASHBOARD"]
        B --> |Supervisor| E[Team Overview]
        E --> E1[Status Mesin]
        E --> E2[Team Workload]
        E --> E3[Yesterday Summary]
        E --> E4[AI Alerts]
    end

    subgraph TECHNICIAN["TECHNICIAN DASHBOARD"]
        B --> |Technician| F[My Day View]
        F --> F1[Prioritas Hari Ini]
        F --> F2[Work Orders Saya]
        F --> F3[PM Reminders]
        F --> F4[Personal Workload]
    end

    style C fill:#8b5cf6,color:#fff
    style D fill:#3b82f6,color:#fff
    style E fill:#10b981,color:#fff
    style F fill:#f59e0b,color:#fff
```

---

## 6. Alur AI Writing Assistant

```mermaid
flowchart LR
    subgraph INPUT["USER INPUT"]
        A[User Ketik Deskripsi]
        B[ganti seal bocor]
    end

    subgraph AI_PROCESS["PROSES AI"]
        B --> C{AI Writing Assistant}
        C --> D[Analisis Konteks]
        C --> E[Cek Grammar dan Typo]
        C --> F[Standarisasi Format]
        C --> G[Tambah Detail Relevan]
    end

    subgraph OUTPUT["SARAN AI"]
        D --> H[Suggested Text]
        E --> H
        F --> H
        G --> H
        H --> I[Melakukan penggantian seal conveyor yang mengalami kebocoran]
    end

    subgraph ACTION["AKSI USER"]
        I --> J{User Review}
        J --> |Accept| K[Gunakan Saran]
        J --> |Edit| L[Modifikasi]
        J --> |Reject| M[Ketik Manual]
    end

    style C fill:#6366f1,color:#fff
    style H fill:#10b981,color:#fff
```

---

## 7. Alur AI Chatbot

```mermaid
flowchart TB
    subgraph USER_QUERY["PERTANYAAN USER"]
        A[Berapa downtime TFM-001 bulan ini?]
    end

    subgraph AI_PROCESSING["PROSES AI"]
        A --> B{AI Chatbot}
        B --> C[Parse Intent]
        C --> D[Identifikasi: Query Downtime]
        D --> E[Extract: Mesin TFM-001]
        E --> F[Extract: Periode Bulan Ini]
    end

    subgraph DATA_FETCH["AMBIL DATA"]
        F --> G[(Database)]
        G --> H[Query Downtime Logs]
        H --> I[Aggregate Data]
    end

    subgraph RESPONSE["RESPONSE AI"]
        I --> J[Generate Response]
        J --> K[TFM-001 downtime 12.5 jam dengan 4 kejadian]
    end

    subgraph ACTIONS["AKSI LANJUTAN"]
        K --> L{User Mau Aksi?}
        L --> |Ya| M[Buatkan WO untuk perbaikan]
        M --> N[AI Buat Work Order]
        L --> |Tidak| O[Selesai]
    end

    style B fill:#6366f1,color:#fff
    style J fill:#6366f1,color:#fff
    style N fill:#10b981,color:#fff
```

---

## 8. Alur Preventive Maintenance Workflow

```mermaid
flowchart TB
    subgraph SCHEDULE["JADWAL PM"]
        A[PM Schedule Dibuat]
        A --> B[Set Frekuensi: Harian atau Mingguan atau Bulanan]
        B --> C[Set Asset dan Checklist]
    end

    subgraph TRIGGER["PEMICU"]
        C --> D{Waktu PM Tiba?}
        D --> |Ya| E[Notifikasi Teknisi]
        D --> |Belum| D
    end

    subgraph EXECUTION["EKSEKUSI"]
        E --> F[WO PM Otomatis Dibuat]
        F --> G[Teknisi Mulai PM]
        G --> H[Checklist Dikerjakan]
        H --> I[Foto Dokumentasi]
        I --> J[PM Selesai]
    end

    subgraph COMPLETION["PENYELESAIAN"]
        J --> K[Update Database]
        K --> L[Next Due Date Terhitung]
        K --> M[PM Compliance Updated]
    end

    subgraph ANALYTICS["ANALITIK"]
        M --> N[AI Monitor PM Compliance]
        N --> O{Compliance di bawah 90 persen?}
        O --> |Ya| P[Alert ke Supervisor]
        O --> |Tidak| Q[Status OK]
    end

    style F fill:#3b82f6,color:#fff
    style N fill:#6366f1,color:#fff
    style P fill:#ef4444,color:#fff
```

---

## 9. Alur AI Report Generation

```mermaid
flowchart LR
    subgraph REQUEST["REQUEST LAPORAN"]
        A[User Request Laporan]
        B[Pilih Tipe: Maintenance atau Produksi]
        C[Pilih Periode: Harian atau Mingguan atau Bulanan]
    end

    A --> B --> C

    subgraph AI_GENERATE["AI GENERATE"]
        C --> D{AI Report Engine}
        D --> E[Ambil Data Relevan]
        D --> F[Kalkulasi Metrics]
        D --> G[Generate Insights]
        D --> H[Buat Rekomendasi]
    end

    subgraph OUTPUT["OUTPUT LAPORAN"]
        E --> I[Laporan Lengkap]
        F --> I
        G --> I
        H --> I
        I --> J[Summary Statistics]
        I --> K[Trend Analysis]
        I --> L[AI Insights]
        I --> M[Actionable Recommendations]
    end

    subgraph DELIVERY["DELIVERY"]
        J --> N[View di Dashboard]
        K --> N
        L --> N
        M --> N
        N --> O[Export PDF atau Excel]
    end

    style D fill:#6366f1,color:#fff
    style L fill:#10b981,color:#fff
```

---

## 10. Overview: Manfaat AI untuk Setiap Role

```mermaid
flowchart TB
    subgraph CENTER["AI ENGINE"]
        AI[TaskFlow AI]
    end

    subgraph TECHNICIAN["TEKNISI"]
        T1[Writing Assistant]
        T2[Priority Suggestions]
        T3[Troubleshooting Tips]
    end

    subgraph SUPERVISOR["SUPERVISOR"]
        S1[Smart Assignment]
        S2[Team Workload Balancing]
        S3[Breakdown Alerts]
        S4[Root Cause Analysis]
    end

    subgraph MANAGER["MANAGER"]
        M1[Executive Reports]
        M2[KPI Insights]
        M3[Resource Recommendations]
        M4[Predictive Alerts]
    end

    subgraph ADMIN["ADMIN"]
        A1[AI Usage Analytics]
        A2[Cost Monitoring]
        A3[Feature Control]
    end

    AI --> T1
    AI --> T2
    AI --> T3
    AI --> S1
    AI --> S2
    AI --> S3
    AI --> S4
    AI --> M1
    AI --> M2
    AI --> M3
    AI --> M4
    AI --> A1
    AI --> A2
    AI --> A3

    style AI fill:#6366f1,color:#fff
    style T1 fill:#f59e0b,color:#fff
    style T2 fill:#f59e0b,color:#fff
    style T3 fill:#f59e0b,color:#fff
    style S1 fill:#10b981,color:#fff
    style S2 fill:#10b981,color:#fff
    style S3 fill:#10b981,color:#fff
    style S4 fill:#10b981,color:#fff
    style M1 fill:#3b82f6,color:#fff
    style M2 fill:#3b82f6,color:#fff
    style M3 fill:#3b82f6,color:#fff
    style M4 fill:#3b82f6,color:#fff
    style A1 fill:#8b5cf6,color:#fff
    style A2 fill:#8b5cf6,color:#fff
    style A3 fill:#8b5cf6,color:#fff
```

---

*Dokumen ini berisi 10 diagram workflow untuk keperluan presentasi sistem TaskFlow.*
