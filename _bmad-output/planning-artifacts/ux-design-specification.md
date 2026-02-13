---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-projectSAP-2026-01-04.md
  - _bmad-output/planning-artifacts/prd.md
date: 2026-01-04
author: Dedy
project_name: Mobile Quick Action App
workflowType: ux-design
---

# UX Design Specification: Mobile Quick Action App

**Author:** Dedy
**Date:** 2026-01-04

---

## Executive Summary

### Project Vision

**TaskFlow Mobile Quick Action** adalah aplikasi mobile native Android yang dirancang khusus untuk teknisi lapangan. Aplikasi ini menggantikan proses manual pencatatan downtime di kertas dengan sistem tap-and-go yang terintegrasi langsung dengan backend TaskFlow.

**Core Design Philosophy:**
- **Remote Control UI** - Button-based interface seperti remote TV, bukan form-based
- **Glove-Friendly** - Touch targets besar untuk user dengan sarung tangan
- **Voice-First** - Voice note sebagai alternatif primary untuk deskripsi
- **Offline-First** - Tetap functional meski tanpa koneksi internet

**Value Proposition:**
> "Hanya tinggal tap dan selesai - tanpa ribet membuat laporan downtime"

### Target Users

**Primary Persona: Rudi (35 tahun) - Teknisi Maintenance**

| Karakteristik | Detail | UX Implication |
|---------------|--------|----------------|
| **Usia** | 30-40 tahun | Familiar dengan smartphone, tapi prefer simple UI |
| **Device** | Android mid-range (pribadi) | Optimize untuk mid-range performance |
| **Kondisi Kerja** | Sarung tangan, shift 8 jam | Extra large buttons, minimal steps |
| **Tech Savvy** | Moderate | Zero learning curve required |
| **Context** | Di lapangan, berdiri, satu tangan | One-hand operation, glare-resistant |

**User Goals:**
- Log downtime secepat mungkin (< 30 detik)
- Tidak perlu mengingat kejadian sampai akhir shift
- Pulang tepat waktu tanpa lembur bikin laporan

**User Frustrations (Current):**
- Buka browser → ketik URL → login → isi form = terlalu banyak langkah
- Menulis deskripsi panjang saat tangan kotor
- Mengingat waktu kejadian dari ingatan = tidak akurat

### Key Design Challenges

1. **Glove-Friendly Touch Targets**
   - Minimum button size: 56x56dp (lebih besar dari standard 48dp)
   - Adequate spacing antara buttons untuk prevent mis-taps
   - Consider entire thumb reach zone untuk button placement

2. **Minimal Cognitive Load**
   - Maximum 3 taps untuk complete core action
   - No complex forms atau multi-step wizards
   - Visual hierarchy yang jelas dengan satu primary action per screen

3. **Offline-First Architecture**
   - UI tidak boleh blocking saat offline
   - Visual indicator untuk sync status
   - Queue actions locally, sync when online

4. **One-Hand Operation**
   - Critical actions reachable dengan thumb
   - Bottom-aligned navigation dan action buttons
   - Swipe gestures untuk common actions

5. **Industrial Environment**
   - High contrast untuk visibility di berbagai kondisi cahaya
   - Haptic feedback untuk confirm actions tanpa lihat layar
   - Audio feedback optional untuk noisy environment

### Design Opportunities

1. **Remote Control Paradigm**
   - Familiar mental model untuk semua usia
   - Big buttons dengan clear labels
   - Instant feedback seperti TV remote

2. **Voice-First Input**
   - Voice note sebagai primary input untuk deskripsi
   - Tidak perlu typing sama sekali
   - Works dengan tangan kotor/sarung tangan

3. **Contextual Intelligence**
   - Recent Machines di home screen
   - Smart category suggestions berdasarkan mesin
   - Quick actions berdasarkan context

4. **Real-Time Confidence**
   - Timestamp tercatat saat tap (tidak bisa dimanipulasi)
   - Visual confirmation dengan animation
   - Sync status selalu visible

---

## Core User Experience

### Defining Experience

**Primary Interaction: Quick Downtime Logging**

Core loop yang mendefinisikan value aplikasi:
1. **TAP "Mulai"** → Timestamp tercatat instant
2. **Perbaiki mesin** (HP di saku)
3. **TAP "Selesai"** → Durasi auto-calculated
4. **Add detail (optional)** → Voice note / kategori / foto

**Time Budget per Downtime:**
- Start: 3 detik (1 tap)
- End: 3 detik (1 tap)
- Details: 15 detik (optional)
- **Total: < 25 detik** (vs 10-15 menit manual)

**One-Tap Emergency:**
- Big red button always visible
- Instantly notify supervisor
- Auto-start downtime log
- Critical for production-stopping events

### Platform Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Framework** | Cross-platform (Flutter/React Native) | Maintainability, future iOS support |
| **Primary Target** | Android | 100% user base saat ini |
| **Future** | iOS ready | Architecture supports iOS deployment |
| **Min Android** | API 24 (Android 7.0) | Cover 95%+ mid-range devices |

**Offline Capability:**
- Maximum offline duration: 24 jam (1 hari)
- Local SQLite database untuk queue
- Auto-sync saat koneksi kembali
- Conflict resolution: Server timestamp wins
- Visual indicator: Sync status always visible

**Device Capabilities Leveraged:**
- Camera (foto evidence)
- Microphone (voice note)
- Biometrics (fingerprint/face login)
- Haptic engine (confirmation feedback)
- Push notifications (supervisor alerts)

### Effortless Interactions

**Zero-Friction Design Goals:**

| Action | Taps | Duration | Notes |
|--------|------|----------|-------|
| Start Downtime | 1 | < 3s | From home screen |
| End Downtime | 1 | < 3s | Big button, no confirm dialog |
| Emergency Alert | 1 | < 2s | Always visible, red button |
| Add Voice Note | Hold | < 15s | Press-and-hold pattern |
| Login (after first) | 1 | < 2s | Biometric only |
| View My Tickets | 1 | < 1s | Tab navigation |
| Sync Status | 0 | Passive | Always visible indicator |

**Friction Elimination:**
- No confirm dialogs untuk start/end (undo available instead)
- No loading spinners blocking UI (optimistic updates)
- No form validation errors (smart defaults)
- No mandatory fields (only timestamp is auto)

### Critical Success Moments

**Make-or-Break Interactions:**

1. **First Tap Confidence**
   - When: User taps "Mulai Downtime" for first time
   - Success: Instant visual + haptic feedback, timestamp visible
   - Failure: Delay, no feedback, uncertainty
   - Design: Animation + vibration + timestamp display

2. **Sync Assurance**
   - When: User sees "Synced" indicator
   - Success: Checkmark, timestamp of last sync
   - Failure: Unclear status, no confirmation
   - Design: Persistent status bar with clear iconography

3. **Offline Trust**
   - When: User logs downtime without internet
   - Success: Normal experience, "Pending sync" indicator
   - Failure: Error message, blocked action
   - Design: Queue visualization, count of pending items

4. **End-of-Shift Relief**
   - When: User finishes shift, all logs complete
   - Success: Dashboard shows all logged, "Ready to go home"
   - Failure: Missing logs, unclear status
   - Design: Summary view with completion indicator

### Experience Principles

Guiding principles untuk semua UX decisions:

1. **"1-Tap or Less"**
   - Every critical action achievable in 1 tap
   - Automate everything that can be automated
   - Default > Configure

2. **"Trust the Timestamp"**
   - Visual proof that time is accurate
   - No ability to edit after submit
   - Audit trail visible

3. **"Gloves On"**
   - All touch targets 56dp minimum
   - Generous spacing between elements
   - Thumb-zone priority for actions

4. **"Always Working"**
   - Offline is normal, not an error state
   - Sync happens in background
   - Never block user from logging

5. **"Voice Over Typing"**
   - Voice note is primary input for descriptions
   - Typing is fallback, not default
   - Works with dirty/gloved hands

---

## Desired Emotional Response

### Primary Emotional Goals

**Core Feeling: Efficient & Productive**

User lapangan harus merasa bahwa Mobile Quick Action App membuat mereka lebih efisien dan produktif. Bukan app yang menambah beban kerja, tapi yang menghilangkan beban.

| Emotional Goal | Manifestasi | UX Trigger |
|----------------|-------------|------------|
| **Productive** | "App ini bantu saya kerja lebih cepat" | Quick actions, minimal steps |
| **Happy** | "Senang karena kerjaan selesai" | Clear completion states |
| **Relieved** | "Lega tidak perlu laporan manual" | End-of-shift dashboard |
| **Comfortable** | "Nyaman pakainya" | Familiar patterns, simple UI |

### Emotional Journey Mapping

| Stage | Target Emotion | Design Response |
|-------|----------------|-----------------|
| **First Open** | Nyaman & Tertarik | Clean UI, obvious primary action, welcoming onboarding |
| **Tap "Mulai"** | Mudah | Instant response, no hesitation, clear feedback |
| **During Work** | Tenang | HP di saku, confidence data tersimpan |
| **Tap "Selesai"** | Lega & Senang | Celebration micro-animation, durasi auto-calculated |
| **Offline/Error** | Biasa (Calm) | No panic indicators, "will sync later" messaging |
| **End of Shift** | Lega & Bebas | Summary shows all done, "nothing pending" state |

**The Relief Moment:**
> Akhir shift = lega karena tidak harus melakukan apa-apa lagi. Semua sudah tercatat real-time. Langsung pulang.

### Micro-Emotions

**Critical Emotional States:**

| Emotion Pair | Priority | Target State | Design Approach |
|--------------|----------|--------------|-----------------|
| **Confidence vs Confusion** | CRITICAL | Confidence | Clear visual hierarchy, obvious next steps, no ambiguity |
| **Trust vs Skepticism** | CRITICAL | Trust | Visible timestamps, sync indicators, audit trail |
| **Accomplishment vs Frustration** | HIGH | Accomplishment | Success states, completion feedback, progress visibility |

**Confidence Builders:**
- Timestamp visible immediately after tap
- Sync status always on screen
- Clear "saved" indicators
- Undo available (bukan confirm dialog)

**Trust Builders:**
- Locked timestamp (tidak bisa edit)
- Sync checkmark dengan waktu
- Pending count visible saat offline
- Data integrity indicators

### Design Implications

**Emotion-to-Design Mapping:**

| Target Emotion | UX Design Decision |
|----------------|-------------------|
| **Efficient** | Max 1-tap for critical actions, no unnecessary screens |
| **Productive** | Quick access to recent machines, smart defaults |
| **Relieved** | End-of-shift summary, "all done" state clearly visible |
| **Comfortable** | Consistent patterns, no surprises, familiar icons |
| **Mudah** | Obvious buttons, self-explanatory UI, no instructions needed |
| **Trust** | Visible timestamps, sync status, data indicators |
| **Calm (Offline)** | No error styling, "pending" is neutral not negative |
| **Accomplishment** | Completion animations, checkmarks, success colors |

**Negative Emotions to Eliminate:**

| Avoid | Prevention Strategy |
|-------|---------------------|
| **Anxiety (offline)** | Treat offline as normal state, not error |
| **Frustration (loading)** | Optimistic updates, no blocking spinners |
| **Doubt (data saved?)** | Immediate visual confirmation, persistent status |
| **Confusion** | One primary action per screen, clear labels |
| **Overwhelm** | Minimal UI, hide complexity, progressive disclosure |

### Emotional Design Principles

1. **"Relief, Not Burden"**
   - App mengurangi beban, bukan menambah
   - End-of-shift = nothing to do

2. **"Confidence at Every Tap"**
   - Immediate feedback untuk setiap action
   - Never leave user guessing

3. **"Offline is Normal"**
   - No panic, no error styling
   - "Will sync" bukan "Failed to sync"

4. **"Trust Through Transparency"**
   - Timestamps visible dan locked
   - Sync status selalu terlihat

5. **"Celebrate Completion"**
   - Micro-animations untuk success
   - Clear "done" states

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Apps yang Disukai Target User:**

#### 1. Gojek

| Aspek | Analisis | Relevansi untuk Quick Action App |
|-------|----------|----------------------------------|
| **Core Strength** | One-tap ordering, clear service cards | Translates to one-tap downtime logging |
| **Visual Design** | Bold colors, clear icons, high contrast | Industrial environment needs high visibility |
| **Optimistic Updates** | UI responds instantly, sync background | Critical pattern untuk offline-first |

#### 2. Tokopedia

| Aspek | Analisis | Relevansi untuk Quick Action App |
|-------|----------|----------------------------------|
| **Core Strength** | Search + recent items prominent | Recent Machines di home screen |
| **Achievement Display** | Order history, badges, points | Downtime log history, completion stats |

#### 3. Shopee

| Aspek | Analisis | Relevansi untuk Quick Action App |
|-------|----------|----------------------------------|
| **Core Strength** | Gamification, rewards visible | Achievement dari hasil pekerjaan |
| **Visual Appeal** | Vibrant colors, engaging animations | Micro-animations untuk completion |

### Transferable UX Patterns

**Patterns to Adopt:**

| Pattern | Source | Application |
|---------|--------|-------------|
| One-Tap Primary Action | Gojek | "Mulai Downtime" button prominent |
| Optimistic Updates | Gojek | Never block UI, queue everything |
| Recent Items Access | Tokopedia | Recent 5 Machines cards |
| Achievement Visibility | Shopee | Daily/shift completion stats |
| Smart Defaults | All | Recent category as pseudo-AI |

**Achievement & Recognition System:**

| Feature | MVP | v1.1 |
|---------|-----|------|
| Daily Counter | "X logs today" | Enhanced stats |
| Completion Rate | "Shift X% complete" | Weekly trends |
| Badges | - | "Fast Responder" etc |
| Supervisor View | Web dashboard (existing) | - |

*Framing: Recognition-focused, not surveillance. Technicians feel PROUD, not WATCHED.*

### Design Decision Matrix

**Validated via Comparative Analysis:**

| Decision | Score | Status |
|----------|-------|--------|
| Red Theme (Primary) | 4.45/5 | ✅ Confirmed |
| Green (Secondary/Success) | - | ✅ Required |
| Voice Note (Primary Input) | 4.55/5 | ✅ Confirmed |
| Simple Counters MVP | Feasible | ✅ GO |
| Badges | Medium effort | ⏳ v1.1 |

### Anti-Patterns to Avoid

| Anti-Pattern | Our Alternative |
|--------------|-----------------|
| Form Input Deskripsi | Voice Note (10 detik) |
| Manual Time Input | Auto-timestamp saat tap |
| Loading Spinners | Optimistic updates |
| Required Fields | All optional except tap |
| Surveillance framing | Recognition, not monitoring |

### Critical User Path

**Reverse-Engineered from "Rudi pulang tepat waktu":**

```
Install → Onboarding (3 screens max, skippable)
    ↓
Biometric Login (< 2 sec, stay logged in)
    ↓
Home: Big Red "Mulai" Button (50% screen)
    ↓
1-Tap Logging → Offline Queue → Auto-Sync
    ↓
"All Done" Summary → Pulang Tepat Waktu ✅
```

| Step | UX Requirement | Risk if Failed |
|------|---------------|----------------|
| Install → First Use | Max 3 onboarding screens | User abandons app |
| Open → Ready | Biometric < 2 sec | Friction → paper fallback |
| Ready → Logging | 1-tap visible immediately | User forgets to log |
| Logging → Synced | Optimistic UI, background sync | Anxiety about data loss |
| Synced → Summary | Clear "All Done" indicator | User unsure if complete |

### Color Palette - Red Theme

| Color | Role | Hex | Usage |
|-------|------|-----|-------|
| **Primary Red** | Brand identity | #C62828 | Headers, primary buttons, active states |
| **Light Red** | Backgrounds | #FFEBEE | Cards, subtle highlights |
| **Bright Red** | Emergency only | #F44336 | Critical alerts (differentiated) |
| **Green** | Success | #4CAF50 | Synced, completed, confirmed |
| **Amber** | Warning/Pending | #FFC107 | Offline queue, attention needed |
| **White/Gray** | Neutral | #FFFFFF | Backgrounds, text, borders |

### Design Inspiration Strategy

**ADOPT (Langsung Pakai):**
- One-tap primary action
- Optimistic updates (never block UI)
- Achievement counters
- Bottom tab navigation
- Real-time feedback (haptic + visual)

**ADAPT (Modifikasi):**
- Gojek tracking → Simplified sync indicator
- Shopee gamification → Simple counters, badges v1.1

**AVOID:**
- Form-based input → Voice note instead
- Manual timestamp → Auto-capture only
- Loading spinners → Optimistic updates
- Surveillance framing → Recognition focus

---

## Design System Foundation

### Design System Choice

**Flutter Material 3 (Material You)** dengan custom theming

| Aspect | Detail |
|--------|--------|
| **Base System** | Material Design 3 (Material You) |
| **Framework** | Flutter SDK |
| **Approach** | Themeable established system |
| **Customization** | Color scheme, typography, component overrides |

### Rationale for Selection

| Factor | Why Material 3 for Flutter |
|--------|---------------------------|
| **Speed** | Built-in components, minimal custom development |
| **Glove-Friendly** | Easy to override touch targets to 56dp |
| **Theming** | `ColorScheme.fromSeed()` supports custom red palette |
| **Accessibility** | WCAG compliance built-in |
| **Offline Support** | Works seamlessly with Flutter's local state management |
| **Haptic Feedback** | Native haptic APIs accessible via Flutter |
| **Documentation** | Extensive, well-maintained by Google |
| **Community** | Large ecosystem, many packages available |

**Why NOT Custom Design System:**
- No existing brand to match
- Speed is priority over uniqueness
- Small team benefits from proven patterns
- Material 3 already familiar to Android users

### Implementation Approach

**Flutter Project Structure:**

```
lib/
├── core/
│   ├── theme/
│   │   ├── app_theme.dart       # Material 3 theme config
│   │   ├── app_colors.dart      # Red palette tokens
│   │   └── app_typography.dart  # Font scales
│   └── constants/
│       └── dimensions.dart      # 56dp touch targets
├── features/
│   ├── downtime/               # Quick downtime feature
│   ├── tickets/                # Ticket monitoring
│   └── workload/               # Personal workload
└── shared/
    └── widgets/                # Reusable components
```

**Key Flutter Packages:**

| Package | Purpose |
|---------|---------|
| `flutter_riverpod` atau `bloc` | State management |
| `sqflite` / `drift` | Local SQLite for offline queue |
| `local_auth` | Biometric authentication |
| `record` | Voice note recording |
| `connectivity_plus` | Network status detection |

### Customization Strategy

**Component Overrides:**

| Component | Default | Our Override |
|-----------|---------|--------------|
| **ElevatedButton** | 48dp height | 56dp height (glove-friendly) |
| **IconButton** | 48dp | 56dp with larger icon |
| **BottomNavigationBar** | Standard | Larger icons, touch areas |
| **FloatingActionButton** | 56dp | 72dp (primary action emphasis) |

**Color Token Mapping:**

| Material 3 Token | Our Value | Usage |
|------------------|-----------|-------|
| `primary` | #C62828 | Main actions, headers |
| `primaryContainer` | #FFEBEE | Card backgrounds |
| `secondary` | #4CAF50 | Success states |
| `tertiary` | #FFC107 | Pending/warning |
| `error` | #F44336 | Emergency only |
| `surface` | #FFFFFF | Screen backgrounds |

**Typography Scale:**

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| `headlineLarge` | 32sp | Bold | Main headers |
| `titleLarge` | 22sp | SemiBold | Section titles |
| `bodyLarge` | 16sp | Regular | Primary text |
| `labelLarge` | 14sp | Medium | Button labels |

---

## Defining Experience

### The Core Interaction

**One-Line Description:**
> "Tinggal login aja, lalu tap untuk log downtime"

**Core Interaction Pattern:**
```
LOGIN (sekali) → TAP MULAI → KERJA → TAP SELESAI → DONE ✅
```

**What Makes It Special:**
- Tidak perlu nulis laporan manual
- Waktu tercatat otomatis saat tap
- Selesai shift = langsung pulang

**Elevator Pitch:**
> "App yang bikin teknisi bisa log downtime cuma dengan tap, tanpa perlu nulis laporan di akhir shift lagi."

### User Mental Model

**Familiar Pattern: Stopwatch**

| Stopwatch | Quick Action App |
|-----------|------------------|
| Tap Start | Tap "Mulai Downtime" |
| Timer running | Mesin sedang diperbaiki |
| Tap Stop | Tap "Selesai" |
| Time recorded | Durasi + timestamp saved |

**User Expectation:**
- Tap = instant response (seperti stopwatch)
- Waktu tercatat otomatis
- Tidak ada form yang harus diisi
- Lihat histori kapan saja

**Pain Points Solved:**

| Before | After |
|--------|-------|
| Ingat kejadian sampai akhir shift | Catat saat kejadian |
| Tulis di kertas | Tap di HP |
| Estimasi waktu dari ingatan | Timestamp akurat |
| 20-30 menit bikin laporan | 0 menit |
| Lembur | Pulang tepat waktu |

### Success Criteria

**User Knows They Succeeded When:**

| Success Indicator | Visual Feedback |
|-------------------|-----------------|
| **Downtime Started** | Button berubah warna, timestamp visible, haptic feedback |
| **Downtime Ended** | Durasi auto-calculated, green checkmark, celebration animation |
| **Data Saved** | Sync indicator shows checkmark |
| **Shift Complete** | Summary: "X downtimes logged, all synced" |
| **Ultimate Success** | "Tidak perlu ngapa-ngapain lagi, langsung pulang" |

**Performance Targets:**

| Metric | Target |
|--------|--------|
| Tap to Start | < 1 second response |
| Tap to End | < 1 second response |
| Full flow (start-end-detail) | < 30 seconds total |
| End of shift work | 0 minutes (vs 20-30 min before) |

### Novel UX Patterns

**Pattern Classification: Established**

| Aspect | Assessment |
|--------|------------|
| **Core Pattern** | Stopwatch (Start/Stop) - Very familiar |
| **Input Method** | Voice note - Familiar from WhatsApp |
| **Navigation** | Bottom tabs - Standard Android |
| **Feedback** | Haptic + visual - Standard mobile |

**No User Education Needed:**
- Stopwatch mental model already understood
- Voice recording familiar from messaging apps
- Tab navigation is standard Android pattern
- Only novelty: Context (downtime logging vs general timer)

**Innovation Within Familiarity:**
- Auto-machine suggestion (Recent Machines)
- Auto-category suggestion (based on machine history)
- Offline queueing (invisible to user)

### Experience Mechanics

**Core Flow: Log Downtime**

#### Initiation

| Element | Design |
|---------|--------|
| **Trigger** | Big red "Mulai Downtime" button (50% of home screen) |
| **Always Visible** | Button never hidden, always accessible |
| **One Tap** | No confirmation dialog, immediate action |

#### Interaction

| Step | User Action | System Response |
|------|-------------|-----------------|
| **Start** | Tap "Mulai Downtime" | Timestamp captured, haptic feedback, button changes to "Selesai" |
| **Select Machine** | Tap from Recent Machines (or search) | Machine linked to downtime |
| **Work** | Put phone away, fix machine | Timer runs in background |
| **End** | Tap "Selesai" | Duration calculated, haptic feedback |
| **Details (Optional)** | Voice note / category / photo | Attached to log |

#### Feedback

| State | Feedback |
|-------|----------|
| **Start Confirmed** | Button color change (Red → Amber), timestamp display, short vibration |
| **In Progress** | Timer visible (optional), pulsing indicator |
| **End Confirmed** | Green checkmark, duration display, celebration micro-animation |
| **Synced** | Sync status icon turns green, "Saved" text |
| **Offline** | Amber indicator: "Will sync when online" (neutral, not error) |

#### Completion

| Element | Design |
|---------|--------|
| **Success State** | Green checkmark, duration displayed |
| **What's Next** | Return to home, ready for next downtime |
| **End of Shift** | Summary accessible: "X logs today, all synced" |
| **Undo** | Available for 10 seconds (in case of accidental tap) |

---

## Visual Design Foundation

### Color System

**Brand Palette - TaskFlow Red Theme:**

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `primary` | #C62828 | Brand Primary | Headers, primary buttons, active states |
| `primaryContainer` | #FFEBEE | Primary Light | Card backgrounds, subtle highlights |
| `secondary` | #4CAF50 | Success | Synced, completed, confirmed states |
| `tertiary` | #FFC107 | Warning/Pending | Offline queue, attention needed |
| `error` | #F44336 | Emergency | Critical alerts only (differentiated from primary) |
| `surface` | #FFFFFF | Backgrounds | Screen backgrounds, cards |
| `onSurface` | #212121 | Text | Primary text on light backgrounds |
| `outline` | #757575 | Borders | Dividers, input borders |

**Color Usage Guidelines:**

| Context | Color Application |
|---------|-------------------|
| **Active Downtime** | Amber (#FFC107) - Timer running |
| **Completed** | Green (#4CAF50) - Checkmark, success |
| **Emergency Stop** | Error Red (#F44336) - Differentiated from primary |
| **Primary Actions** | Brand Red (#C62828) - Main buttons |
| **Pending Sync** | Amber (#FFC107) - Neutral, not error |

**Accessibility Compliance:**
- Primary on white: 7.2:1 contrast ratio (AAA)
- Text on surface: 15.3:1 contrast ratio (AAA)
- All interactive elements meet WCAG 2.1 AA minimum

### Typography System

**Primary Typeface: Roboto**

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `headlineLarge` | 32sp | Bold (700) | 40sp | Main headers, screen titles |
| `headlineMedium` | 28sp | Bold (700) | 35sp | Section headers |
| `titleLarge` | 22sp | SemiBold (600) | 30sp | Card titles, dialogs |
| `titleMedium` | 16sp | SemiBold (600) | 25sp | Sub-section titles |
| `bodyLarge` | 16sp | Regular (400) | 25sp | Primary body text |
| `bodyMedium` | 14sp | Regular (400) | 20sp | Secondary text |
| `labelLarge` | 14sp | Medium (500) | 20sp | Button labels |
| `labelMedium` | 12sp | Medium (500) | 15sp | Captions, metadata |

**Typography Tone: Professional + Modern + Industrial**
- Clean, sans-serif untuk readability di kondisi lapangan
- Bold weights untuk hierarchy yang jelas
- Generous line heights untuk scanning cepat
- Roboto familiar di Android ecosystem

### Spacing & Layout Foundation

**Base Unit: 5dp**

| Spacing Token | Value | Usage |
|---------------|-------|-------|
| `space-xs` | 5dp | Tight spacing, inline elements |
| `space-sm` | 10dp | Related elements, icon padding |
| `space-md` | 15dp | Default spacing |
| `space-lg` | 20dp | Section spacing |
| `space-xl` | 25dp | Major sections |
| `space-2xl` | 30dp | Screen padding |

**Touch Targets:**

| Element | Size | Rationale |
|---------|------|-----------|
| **Primary Button** | 56dp height | Glove-friendly minimum |
| **FAB** | 72dp | Extra emphasis untuk primary action |
| **Icon Button** | 56dp | Consistent dengan primary |
| **List Item** | 72dp height | Easy tap dengan gloves |
| **Bottom Nav Item** | 80dp height | Generous touch area |

**Screen Layout Grid:**

| Zone | Height | Content |
|------|--------|---------|
| **App Bar** | 56dp | Title, sync status |
| **Content Area** | Flexible | Main content, scrollable |
| **Bottom Navigation** | 80dp | 3-4 primary destinations |
| **FAB Position** | 16dp from bottom | Above bottom nav |

**Layout Density: Balance of Dense & Spacious**
- Industrial context = scannable, not cramped
- Enough density for information
- Enough whitespace for gloved fingers
- Priority on touch target spacing

### Accessibility Considerations

**Visual Accessibility:**

| Requirement | Implementation |
|-------------|----------------|
| **Contrast Ratio** | All text ≥ 4.5:1, large text ≥ 3:1 |
| **Touch Targets** | Minimum 56dp (exceeds 48dp guideline) |
| **Color Independence** | Icons + labels, not color alone |
| **Focus Indicators** | High contrast focus rings |

**Motor Accessibility:**

| Requirement | Implementation |
|-------------|----------------|
| **One-Hand Operation** | Primary actions in thumb zone |
| **Glove Compatibility** | 56dp+ touch targets |
| **Tap vs Swipe** | Primary actions are taps, not gestures |
| **Error Recovery** | Undo available, no destructive single taps |

**Cognitive Accessibility:**

| Requirement | Implementation |
|-------------|----------------|
| **Clear Hierarchy** | One primary action per screen |
| **Consistent Patterns** | Same actions, same locations |
| **Minimal Steps** | Max 3 taps for core action |
| **Familiar Metaphors** | Stopwatch mental model |

**Industrial Environment Considerations:**

| Challenge | Solution |
|-----------|----------|
| **Bright Sunlight** | High contrast colors, no subtle grays |
| **Dirty Screen** | Large touch targets, generous spacing |
| **Noise** | Haptic feedback primary, audio optional |
| **Distraction** | Minimal UI, focus on primary action |

