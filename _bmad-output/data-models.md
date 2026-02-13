# TaskFlow - Data Models Reference

**Project:** TaskFlow - Task & Maintenance Management System
**Version:** 1.0
**Generated:** 2025-12-31

---

## Database Overview

- **Database Engine:** SQLite (sql.js - in-memory with file persistence)
- **Database File:** `task-manager-server/data/taskmanager.db`
- **Naming Convention:** snake_case for tables and columns

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   users     │────▶│  departments │     │   sprints   │
└──────┬──────┘     └──────────────┘     └──────┬──────┘
       │                                        │
       │  ┌─────────────────────────────────────┘
       │  │
       ▼  ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   tickets   │────▶│    epics     │     │  comments   │
└──────┬──────┘     └──────────────┘     └─────────────┘
       │
       │  ┌─────────────────────────────────────┐
       │  │                                     │
       ▼  ▼                                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ work_orders │────▶│    assets    │◀────│  downtime   │
└─────────────┘     └──────┬───────┘     │    _logs    │
                           │             └─────────────┘
                           │
                    ┌──────┴───────┐
                    │ maintenance  │
                    │  _schedules  │
                    └──────────────┘
```

---

## Core Tables

### users

Stores user accounts and authentication information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| email | TEXT | UNIQUE NOT NULL | User email (login) |
| password | TEXT | NOT NULL | Bcrypt hashed password |
| name | TEXT | NOT NULL | Display name |
| avatar | TEXT | | Profile image URL |
| whatsapp | TEXT | | WhatsApp number |
| role | TEXT | DEFAULT 'member' | admin, manager, supervisor, member |
| department_id | INTEGER | FK → departments(id) | User's department |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### departments

Organizational departments/teams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| name | TEXT | UNIQUE NOT NULL | Department name |
| description | TEXT | | Description |
| color | TEXT | DEFAULT '#3B82F6' | Display color (hex) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## Task Management Tables

### tickets

Main task/issue tracking table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| ticket_key | TEXT | UNIQUE NOT NULL | e.g., "TM-1", "TM-2" |
| title | TEXT | NOT NULL | Task title |
| description | TEXT | | Rich text description |
| type | TEXT | DEFAULT 'task' | bug, task, story, epic |
| priority | TEXT | DEFAULT 'medium' | low, medium, high, critical |
| status | TEXT | DEFAULT 'todo' | todo, in_progress, review, done |
| story_points | INTEGER | | Estimation points |
| reporter_id | INTEGER | NOT NULL, FK → users(id) | Creator |
| assignee_id | INTEGER | FK → users(id) | Legacy single assignee |
| department_id | INTEGER | FK → departments(id) | Owning department |
| epic_id | INTEGER | FK → tickets(id) | Parent epic |
| sprint_id | INTEGER | FK → sprints(id) | Sprint assignment |
| due_date | DATE | | Due date |
| asset_id | INTEGER | FK → assets(id) | Linked asset |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### ticket_assignees

Many-to-many relationship for ticket assignees.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| ticket_id | INTEGER | NOT NULL, FK → tickets(id) | |
| user_id | INTEGER | NOT NULL, FK → users(id) | |
| assigned_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(ticket_id, user_id) | |

### sprints

Agile sprint containers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| name | TEXT | NOT NULL | Sprint name |
| goal | TEXT | | Sprint goal |
| start_date | DATE | | Start date |
| end_date | DATE | | End date |
| status | TEXT | DEFAULT 'planning' | planning, active, completed |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### comments

Ticket comments/discussions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| content | TEXT | NOT NULL | Comment text (HTML) |
| ticket_id | INTEGER | NOT NULL, FK → tickets(id) | |
| user_id | INTEGER | NOT NULL, FK → users(id) | Author |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### attachments

File attachments for tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| filename | TEXT | NOT NULL | Stored filename |
| original_name | TEXT | NOT NULL | Original upload name |
| mimetype | TEXT | | File MIME type |
| size | INTEGER | | File size in bytes |
| ticket_id | INTEGER | NOT NULL, FK → tickets(id) | |
| uploaded_by | INTEGER | NOT NULL, FK → users(id) | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### ticket_counter

Counter for generating ticket keys.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY CHECK (id = 1) | Single row |
| counter | INTEGER | DEFAULT 0 | Current counter value |

---

## Maintenance Tables

### assets

Equipment and machinery registry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| asset_code | TEXT | UNIQUE NOT NULL | e.g., "TFM-001" |
| name | TEXT | NOT NULL | Asset name |
| category_id | INTEGER | FK → asset_categories(id) | |
| location | TEXT | | Physical location |
| manufacturer | TEXT | | Manufacturer name |
| model | TEXT | | Model number |
| serial_number | TEXT | | Serial number |
| purchase_date | DATE | | Purchase date |
| warranty_expiry | DATE | | Warranty end date |
| status | TEXT | DEFAULT 'operational' | operational, maintenance, breakdown, retired |
| criticality | TEXT | DEFAULT 'medium' | low, medium, high, critical |
| department_id | INTEGER | FK → departments(id) | Owning department |
| specifications | TEXT | | Technical specs (JSON) |
| notes | TEXT | | Additional notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### asset_categories

Asset groupings/types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| name | TEXT | UNIQUE NOT NULL | Category name |
| description | TEXT | | Description |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### work_orders

Maintenance work orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| wo_number | TEXT | UNIQUE NOT NULL | e.g., "WO-2025-0001" |
| asset_id | INTEGER | NOT NULL, FK → assets(id) | Target asset |
| type | TEXT | NOT NULL | preventive, corrective, emergency |
| priority | TEXT | DEFAULT 'medium' | low, medium, high, critical |
| status | TEXT | DEFAULT 'open' | open, in_progress, on_hold, completed, cancelled |
| title | TEXT | NOT NULL | Work order title |
| description | TEXT | | Detailed description |
| failure_code_id | INTEGER | FK → failure_codes(id) | Failure classification |
| maintenance_schedule_id | INTEGER | FK → maintenance_schedules(id) | Linked PM schedule |
| reported_by | INTEGER | FK → users(id) | Reporter |
| assigned_to | INTEGER | FK → users(id) | Legacy single assignee |
| related_ticket_id | INTEGER | FK → tickets(id) | Linked ticket |
| sprint_id | INTEGER | FK → sprints(id) | Sprint assignment |
| scheduled_start | DATETIME | | Planned start |
| scheduled_end | DATETIME | | Planned end |
| actual_start | DATETIME | | Actual start |
| actual_end | DATETIME | | Actual end |
| root_cause | TEXT | | Root cause analysis |
| solution | TEXT | | Solution description |
| parts_used | TEXT | | Parts/materials used |
| labor_hours | REAL | | Total labor hours |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### work_order_assignees

Multiple assignees for work orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| work_order_id | INTEGER | NOT NULL, FK → work_orders(id) | |
| user_id | INTEGER | NOT NULL, FK → users(id) | |
| assigned_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(work_order_id, user_id) | |

### work_order_counter

Counter for generating WO numbers by year.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| year | INTEGER | PRIMARY KEY | Year (e.g., 2025) |
| counter | INTEGER | DEFAULT 0 | Current counter for year |

### failure_codes

Failure categorization codes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| code | TEXT | UNIQUE NOT NULL | e.g., "EL-001", "MC-002" |
| category | TEXT | NOT NULL | electrical, mechanical, hydraulic, etc. |
| description | TEXT | NOT NULL | Description |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### maintenance_schedules

Preventive maintenance schedules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| asset_id | INTEGER | NOT NULL, FK → assets(id) | Target asset |
| title | TEXT | NOT NULL | PM title |
| description | TEXT | | Description |
| frequency_type | TEXT | NOT NULL | daily, weekly, monthly, quarterly, yearly, runtime_hours |
| frequency_value | INTEGER | DEFAULT 1 | Frequency multiplier |
| runtime_hours_trigger | INTEGER | | Hours-based trigger |
| last_performed | DATE | | Last completion date |
| next_due | DATE | | Next due date |
| estimated_duration_minutes | INTEGER | | Estimated duration |
| assigned_to | INTEGER | FK → users(id) | Default assignee |
| is_active | INTEGER | DEFAULT 1 | Active flag (0/1) |
| checklist | TEXT | | JSON array of checklist items |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## Downtime Tables

### downtime_logs

Downtime event records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| asset_id | INTEGER | NOT NULL, FK → assets(id) | Affected asset |
| work_order_id | INTEGER | FK → work_orders(id) | Related WO |
| downtime_type | TEXT | DEFAULT 'unplanned' | planned, unplanned |
| classification_id | INTEGER | FK → downtime_classifications(id) | Downtime type |
| start_time | DATETIME | NOT NULL | Start timestamp |
| end_time | DATETIME | | End timestamp (null = ongoing) |
| duration_minutes | INTEGER | | Calculated duration |
| was_scheduled_production | INTEGER | | Was asset in production? |
| production_schedule_id | INTEGER | FK → production_schedule(id) | |
| reason | TEXT | | Reason description |
| failure_code_id | INTEGER | FK → failure_codes(id) | Failure classification |
| production_impact | TEXT | | JSON: {units_lost, batch_affected} |
| logged_by | INTEGER | FK → users(id) | Who logged it |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### downtime_classifications

Categories for downtime events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| code | TEXT | UNIQUE NOT NULL | e.g., "BD-EL", "PM-PROD" |
| name | TEXT | NOT NULL | Display name |
| description | TEXT | | Description |
| counts_as_downtime | INTEGER | DEFAULT 1 | Affects KPI? (0/1) |
| category | TEXT | NOT NULL | breakdown, planned_maintenance, changeover, idle, production |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## Production Tables

### production_schedule

Production calendar entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| asset_id | INTEGER | NOT NULL, FK → assets(id) | |
| date | DATE | NOT NULL | Schedule date |
| shift_pattern_id | INTEGER | FK → shift_patterns(id) | |
| status | TEXT | NOT NULL | scheduled, no_order, holiday, maintenance_window |
| planned_start | TIME | | Planned start time |
| planned_end | TIME | | Planned end time |
| planned_production_minutes | INTEGER | | Planned production time |
| actual_production_minutes | INTEGER | | Actual production time |
| product_name | TEXT | | Product being produced |
| notes | TEXT | | Notes |
| created_by | INTEGER | FK → users(id) | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### shift_patterns

Work shift definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| name | TEXT | NOT NULL | e.g., "Shift 1", "Night Shift" |
| start_time | TEXT | NOT NULL | e.g., "07:00" |
| end_time | TEXT | NOT NULL | e.g., "15:00" |
| break_minutes | INTEGER | DEFAULT 60 | Break duration |
| is_active | INTEGER | DEFAULT 1 | Active flag |

### production_quick_actions

Quick action buttons for production downtime.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| label | TEXT | NOT NULL | Button label |
| icon | TEXT | DEFAULT '⚡' | Emoji icon |
| color | TEXT | NOT NULL | Tailwind color class |
| classification_code | TEXT | NOT NULL | FK reference to classification |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| is_active | INTEGER | DEFAULT 1 | Active flag |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## AI/Chat Tables

### chat_conversations

AI chat conversation containers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| user_id | INTEGER | NOT NULL, FK → users(id) | |
| title | TEXT | NOT NULL | Conversation title |
| summary | TEXT | | AI-generated summary |
| is_active | INTEGER | DEFAULT 0 | Currently active? |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### chat_messages

Individual chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| conversation_id | INTEGER | NOT NULL, FK → chat_conversations(id) | |
| role | TEXT | NOT NULL | user, assistant, system, tool |
| content | TEXT | NOT NULL | Message content |
| context_data | TEXT | | JSON context data |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### user_context

User preferences and AI learning data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| user_id | INTEGER | UNIQUE NOT NULL, FK → users(id) | |
| preferences | TEXT | DEFAULT '{}' | JSON preferences |
| frequent_topics | TEXT | DEFAULT '[]' | JSON array |
| favorite_tickets | TEXT | DEFAULT '[]' | JSON array |
| last_queries | TEXT | DEFAULT '[]' | JSON array |
| insights | TEXT | DEFAULT '{}' | AI insights |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## Supporting Tables

### notifications

User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| user_id | INTEGER | NOT NULL, FK → users(id) | Recipient |
| type | TEXT | NOT NULL | assigned, comment, status, mention |
| title | TEXT | NOT NULL | Notification title |
| message | TEXT | | Notification body |
| ticket_id | INTEGER | FK → tickets(id) | Related ticket |
| ticket_key | TEXT | | Ticket key for display |
| actor_id | INTEGER | FK → users(id) | Who triggered it |
| actor_name | TEXT | | Actor name for display |
| is_read | INTEGER | DEFAULT 0 | Read flag (0/1) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### activity_log

System activity/audit log.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| action | TEXT | NOT NULL | Action type |
| entity_type | TEXT | NOT NULL | ticket, work_order, etc. |
| entity_id | INTEGER | NOT NULL | Entity ID |
| user_id | INTEGER | NOT NULL, FK → users(id) | Who did it |
| details | TEXT | | JSON additional details |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## TypeScript Interfaces

### Frontend Types (task-manager-client/src/types/index.ts)

```typescript
// User
interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  whatsapp?: string;
  role: 'admin' | 'manager' | 'supervisor' | 'member';
  department_id?: number;
  department_name?: string;
}

// Ticket
interface Ticket {
  id: number;
  ticket_key: string;
  title: string;
  description?: string;
  type: 'bug' | 'task' | 'story' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  story_points?: number;
  reporter_id: number;
  assignees?: Assignee[];
  department_id?: number;
  epic_id?: number;
  sprint_id?: number;
  due_date?: string;
  asset_id?: number;
  created_at: string;
  updated_at: string;
}

// Work Order
interface WorkOrder {
  id: number;
  wo_number: string;
  asset_id: number;
  type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  failure_code_id?: number;
  maintenance_schedule_id?: number;
  assignees?: WorkOrderAssignee[];
  related_ticket_id?: number;
  sprint_id?: number;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  labor_hours?: number;
  created_at: string;
  updated_at: string;
}

// Asset
interface Asset {
  id: number;
  asset_code: string;
  name: string;
  category_id?: number;
  location?: string;
  manufacturer?: string;
  model?: string;
  status: 'operational' | 'maintenance' | 'breakdown' | 'retired';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  department_id?: number;
  created_at: string;
  updated_at: string;
}

// Downtime Log
interface DowntimeLog {
  id: number;
  asset_id: number;
  work_order_id?: number;
  downtime_type: 'planned' | 'unplanned';
  classification_id?: number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  was_scheduled_production?: boolean;
  reason?: string;
  failure_code_id?: number;
  created_at: string;
}

// Maintenance Schedule
interface MaintenanceSchedule {
  id: number;
  asset_id: number;
  title: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'runtime_hours';
  frequency_value: number;
  last_performed?: string;
  next_due?: string;
  estimated_duration_minutes?: number;
  assigned_to?: number;
  is_active: boolean;
  checklist?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Indexes

```sql
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations (user_id);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages (conversation_id);
CREATE INDEX idx_user_context_user_id ON user_context (user_id);
```

---

## Migration Notes

The system uses inline migrations in `src/index.ts` that run on startup:
1. Check for missing columns and add them
2. Create tables if they don't exist
3. Insert default data (departments, quick actions, etc.)

Key migrations:
- `add_work_order_assignees.ts` - Adds many-to-many assignee support
- `add_integrations.ts` - Adds ticket↔work order integration fields
- `add_failure_code_category.ts` - Adds category to failure codes
