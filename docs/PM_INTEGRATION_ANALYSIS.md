# Preventive Maintenance (PM) Integration Analysis

**Document Date:** December 22, 2025  
**Project:** TaskFlow - Maintenance Management System

---

## 📊 Current PM Integration Status

### ✅ Already Implemented

| Feature | Status | Location |
|---------|--------|----------|
| PM Schedule Management | ✅ | `/maintenance-calendar` |
| Create/Edit/Delete PM | ✅ | `MaintenanceCalendar.tsx` |
| Generate WO from PM | ✅ | `/schedules/:id/generate-wo` |
| PM-to-WO Linking | ✅ | `maintenance_schedule_id` in work_orders |
| Frequency Types | ✅ | daily, weekly, monthly, quarterly, yearly, runtime_hours |
| Overdue PM Filtering | ✅ | `overdue_only` parameter |
| Maintenance Window in Schedule | ✅ | `maintenance_window` status |
| PM Classifications | ✅ | PM-PROD, PM-IDLE, PM-WINDOW |

### ⚠️ Partially Implemented

| Feature | Issue |
|---------|-------|
| PM Calendar Display | Shows schedules but doesn't show actual completion |
| PM-to-Downtime Link | Manual - no automatic downtime log when PM starts |
| Asset Criticality | Field exists but not used in PM prioritization |

### ❌ Not Yet Implemented

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Auto WO Generation** | Cron job to auto-create WO for due PM | High | Planned |
| **PM Notifications** | Email/WhatsApp for upcoming/overdue PM | Medium | Planned |
| **Checklist Execution** | Track PM task completion | Medium | Planned |
| **Runtime Hours Tracking** | Auto-trigger PM based on machine hours | Medium | Planned |

### ✅ Recently Implemented (Dec 22, 2025)

| Feature | Description | Location |
|---------|-------------|----------|
| **PM-Downtime Auto-Link** | Auto-create downtime when PM WO starts | `WorkOrderService.ts` |
| **Next Due Auto-Update** | Update next_due when PM WO completes | `WorkOrderService.ts` |
| **PM Compliance Rate** | % of PM completed on time | `ReportRepository.ts`, `MaintenanceKPI.tsx` |
| **PM Dashboard Alert** | Overdue PM shown on main Dashboard | `dashboard.ts`, `Dashboard.tsx` |
| **Upcoming PM List** | PM due in 7 days on Maintenance KPI | `MaintenanceKPI.tsx` |

---

## 🗄️ Database Schema

### maintenance_schedules Table
```sql
CREATE TABLE maintenance_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL,        -- daily, weekly, monthly, quarterly, yearly, runtime_hours
  frequency_value INTEGER DEFAULT 1,
  runtime_hours_trigger INTEGER,       -- trigger after X hours of operation
  last_performed DATE,
  next_due DATE,
  estimated_duration_minutes INTEGER,
  assigned_to INTEGER,
  is_active INTEGER DEFAULT 1,
  checklist TEXT,                      -- JSON array of checklist items
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

### Related Classifications
| Code | Name | Category | Counts as Downtime |
|------|------|----------|-------------------|
| PM-PROD | Preventive Maintenance (Production) | planned_maintenance | Yes |
| PM-IDLE | Preventive Maintenance (Idle) | planned_maintenance | No |
| PM-WINDOW | Preventive Maintenance (Scheduled Window) | planned_maintenance | No |

---

## 💡 Recommendations

### 1. Auto-Generate Work Orders for Due PM (High Priority)

**Current Flow:**
```
Manual: User clicks "Generate WO" button → WO created
```

**Recommended Flow:**
```
Scheduler Job (Daily) → Check PM schedules → 
  IF next_due <= today AND no open WO exists → 
    Auto-create WO with status 'open'
    Send notification to assigned technician
```

**Implementation:**
```typescript
// src/services/PMSchedulerService.ts
async function checkAndGenerateDuePM() {
  const duePM = db.prepare(`
    SELECT ms.* FROM maintenance_schedules ms
    WHERE ms.is_active = 1 
      AND ms.next_due <= date('now')
      AND NOT EXISTS (
        SELECT 1 FROM work_orders wo 
        WHERE wo.maintenance_schedule_id = ms.id 
          AND wo.status NOT IN ('completed', 'cancelled')
      )
  `).all();
  
  for (const pm of duePM) {
    await generateWorkOrder(pm.id);
    await sendNotification(pm.assigned_to, `PM Due: ${pm.title}`);
  }
}
```

---

### 2. Auto-Update PM Schedule When WO Completes (High Priority)

**Current Flow:**
```
WO Completed → Nothing happens to PM schedule
```

**Recommended Flow:**
```
WO Completed → 
  IF WO has maintenance_schedule_id →
    Update last_performed = today
    Calculate new next_due based on frequency
```

**Implementation:**
```typescript
// Add to WorkOrderService.complete() or work order route
if (workOrder.maintenance_schedule_id) {
  const schedule = db.prepare('SELECT * FROM maintenance_schedules WHERE id = ?')
    .get(workOrder.maintenance_schedule_id);
  
  const newNextDue = calculateNextDue(
    schedule.frequency_type, 
    schedule.frequency_value,
    new Date() // from today
  );
  
  db.prepare(`
    UPDATE maintenance_schedules 
    SET last_performed = date('now'), 
        next_due = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newNextDue, schedule.id);
}

function calculateNextDue(frequencyType: string, frequencyValue: number, fromDate: Date): string {
  const nextDue = new Date(fromDate);
  
  switch (frequencyType) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + frequencyValue);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + (frequencyValue * 7));
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + frequencyValue);
      break;
    case 'quarterly':
      nextDue.setMonth(nextDue.getMonth() + (frequencyValue * 3));
      break;
    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + frequencyValue);
      break;
  }
  
  return nextDue.toISOString().split('T')[0];
}
```

---

### 3. Auto-Link PM to Downtime (High Priority)

**Current Flow:**
```
PM WO Started → User manually logs downtime
PM WO Completed → User manually ends downtime
```

**Recommended Flow:**
```
PM WO Status → 'in_progress' → 
  Auto-create downtime log with classification PM-WINDOW/PM-PROD
  
PM WO Status → 'completed' →
  Auto-end downtime log
```

**Implementation:**
```typescript
// In WorkOrderService or route when status changes to 'in_progress'
if (workOrder.type === 'preventive' && newStatus === 'in_progress') {
  // Determine classification based on production schedule
  const scheduleCheck = await downtimeService.checkSchedule(workOrder.asset_id);
  let classificationCode = 'PM-IDLE';
  
  if (scheduleCheck.status === 'maintenance_window') {
    classificationCode = 'PM-WINDOW';
  } else if (scheduleCheck.status === 'scheduled') {
    classificationCode = 'PM-PROD';
  }
  
  const classification = db.prepare(
    'SELECT id FROM downtime_classifications WHERE code = ?'
  ).get(classificationCode);
  
  // Create downtime log
  await downtimeService.start({
    asset_id: workOrder.asset_id,
    downtime_type: 'planned',
    classification_id: classification.id,
    work_order_id: workOrder.id,
    reason: `Preventive Maintenance: ${workOrder.title}`,
  });
}

// When status changes to 'completed'
if (workOrder.type === 'preventive' && newStatus === 'completed') {
  // End downtime log
  await downtimeService.endByWorkOrderId(workOrder.id);
}
```

---

### 4. PM Compliance Dashboard (Medium Priority)

**Metrics to Track:**
- **PM Scheduled:** Total PM due in period
- **PM Completed On Time:** Completed before or on due date
- **PM Completed Late:** Completed after due date
- **PM Overdue:** Not completed yet, past due date
- **PM Compliance Rate:** (On Time / Total Scheduled) × 100%

**SQL Query:**
```sql
SELECT 
  COUNT(*) as total_scheduled,
  SUM(CASE 
    WHEN wo.status = 'completed' AND date(wo.actual_end) <= date(ms.next_due) 
    THEN 1 ELSE 0 
  END) as completed_on_time,
  SUM(CASE 
    WHEN wo.status = 'completed' AND date(wo.actual_end) > date(ms.next_due) 
    THEN 1 ELSE 0 
  END) as completed_late,
  SUM(CASE 
    WHEN (wo.status IS NULL OR wo.status NOT IN ('completed', 'cancelled'))
      AND ms.next_due < date('now')
    THEN 1 ELSE 0 
  END) as overdue
FROM maintenance_schedules ms
LEFT JOIN work_orders wo ON wo.maintenance_schedule_id = ms.id
WHERE ms.is_active = 1
  AND ms.next_due BETWEEN ? AND ?
```

---

### 5. Integrate PM with Production Schedule (Medium Priority)

**Enhanced Production Schedule View:**
```
┌─────────────────────────────────────────────────────────────┐
│ Production Schedule - December 23, 2025                      │
├─────────────────────────────────────────────────────────────┤
│ Asset: TFM-001 - Thermoforming Machine Line 1               │
├─────────────────────────────────────────────────────────────┤
│ Shift 1 (07:00-15:00): 🔧 maintenance_window                │
│   └─ PM: Monthly Oil Change (Due: Dec 23)                   │
│                                                              │
│ Shift 2 (15:00-23:00): ✅ scheduled                         │
│   └─ Product: Container A                                    │
│                                                              │
│ Shift 3 (23:00-07:00): ✅ scheduled                         │
│   └─ Product: Container B                                    │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
- When creating PM schedule, optionally link to a production schedule slot
- Show PM details when production schedule status = 'maintenance_window'

---

### 6. PM Notifications (Medium Priority)

**Notification Triggers:**

| Trigger | Recipients | Channel |
|---------|------------|---------|
| PM due in 3 days | Assigned technician | Dashboard, Email |
| PM due tomorrow | Assigned technician, Supervisor | Dashboard, Email, WhatsApp |
| PM overdue | Supervisor, Manager | Dashboard, Email |
| PM completed | Supervisor | Dashboard |

**Implementation:**
```typescript
// Notification service
async function sendPMNotifications() {
  // PM due in 3 days
  const dueSoon = db.prepare(`
    SELECT ms.*, u.email, u.whatsapp 
    FROM maintenance_schedules ms
    JOIN users u ON ms.assigned_to = u.id
    WHERE ms.is_active = 1 
      AND ms.next_due = date('now', '+3 days')
  `).all();
  
  for (const pm of dueSoon) {
    await sendEmail(pm.email, 'PM Reminder', `PM "${pm.title}" due in 3 days`);
  }
  
  // Similar for overdue, etc.
}
```

---

### 7. Checklist Tracking (Lower Priority)

**Enhanced PM Schedule with Checklist:**
```typescript
interface PMChecklist {
  items: {
    id: number;
    description: string;
    required: boolean;
  }[];
}

interface PMChecklistExecution {
  work_order_id: number;
  items: {
    checklist_item_id: number;
    completed: boolean;
    notes?: string;
    completed_at?: string;
    completed_by?: number;
  }[];
}
```

**New Table:**
```sql
CREATE TABLE pm_checklist_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_order_id INTEGER NOT NULL,
  checklist_item_id INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  notes TEXT,
  completed_at DATETIME,
  completed_by INTEGER,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  FOREIGN KEY (completed_by) REFERENCES users(id)
);
```

---

## 📈 Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
- [ ] Auto-update `next_due` when PM Work Order completes
- [ ] Add overdue PM count to Dashboard
- [ ] Add PM compliance summary to Maintenance KPI page

### Phase 2: Core Integration (3-5 days)
- [ ] Auto-link PM Work Orders to Downtime logs
- [ ] PM Compliance Dashboard with metrics
- [ ] PM Notifications (in-app)

### Phase 3: Automation (5-7 days)
- [ ] Scheduler job for auto-generating PM Work Orders
- [ ] Email/WhatsApp notifications
- [ ] PM Calendar enhancements (show completion status)

### Phase 4: Advanced Features (7-10 days)
- [ ] Checklist execution tracking
- [ ] Runtime hours-based PM triggers
- [ ] PM vs Breakdown analysis report
- [ ] Asset MTBF/MTTR metrics

---

## 📋 Score Summary

| Area | Score | Notes |
|------|-------|-------|
| Database Schema | 9/10 | Complete, well-designed |
| Frontend UI | 8/10 | Calendar + KPI dashboard + Dashboard alerts |
| Backend API | 9/10 | ✅ Auto-update next_due implemented |
| Integration with Downtime | 8/10 | ✅ Auto-link PM-Downtime implemented |
| Integration with Production | 7/10 | PM classification based on schedule |
| Automation | 4/10 | Manual WO creation, no scheduler yet |
| KPI/Reporting | 8/10 | ✅ PM Compliance metrics + Upcoming PM |

**Overall PM Integration: 76%** (↑ from 55%)

### Recent Improvements
- ✅ Auto-update `next_due` when PM Work Order completes
- ✅ Auto-link PM Work Orders to Downtime logs
- ✅ PM Compliance Dashboard with metrics
- ✅ Overdue PM alerts on main Dashboard
- ✅ Upcoming PM list on Maintenance KPI page

---

## 📝 Notes

- PM schedules are stored in `maintenance_schedules` table
- Work Orders link to PM via `maintenance_schedule_id`
- Downtime classifications include PM-specific codes (PM-PROD, PM-IDLE, PM-WINDOW)
- Production schedule supports `maintenance_window` status for planned PM

---

*Document generated by AI Assistant - TaskFlow Project*

