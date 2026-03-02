# TaskFlow Epic Planning Index

## Overview

Dokumen ini merangkum semua Epic planning documents untuk TaskFlow - Factory Management System. Setiap Epic memiliki dokumen detail terpisah yang mencakup database schema, API endpoints, UI pages, dan acceptance criteria.

## Epic Summary Table

| # | Epic | ID | Priority | Story Points | Plan Document |
|---|------|-----|----------|--------------|---------------|
| 1 | Sales & Order Management | TM-33 | High | 34 SP | [01_sales_order_management.plan.md](./01_sales_order_management.plan.md) |
| 2 | Procurement / Purchasing | TM-39 | High | 34 SP | [02_procurement_purchasing.plan.md](./02_procurement_purchasing.plan.md) |
| 3 | Warehouse & Logistics | TM-45 | High | 34 SP | [03_warehouse_logistics.plan.md](./03_warehouse_logistics.plan.md) |
| 4 | HR & Training | TM-51 | Medium | 31 SP | [04_hr_training.plan.md](./04_hr_training.plan.md) |
| 5 | Safety & Incident | TM-57 | Medium | 31 SP | [05_safety_incident.plan.md](./05_safety_incident.plan.md) |
| 6 | Costing & Finance | TM-63 | Medium | 34 SP | [06_costing_finance.plan.md](./06_costing_finance.plan.md) |
| 7 | Document Management | TM-69 | Low | 26 SP | [07_document_management.plan.md](./07_document_management.plan.md) |
| 8 | Continuous Improvement | TM-74 | Low | 23 SP | [08_continuous_improvement.plan.md](./08_continuous_improvement.plan.md) |
| 9 | Mobile App (PWA) | TM-80 | Medium | 47 SP | [09_mobile_app.plan.md](./09_mobile_app.plan.md) |
| 10 | Integration & API | TM-86 | Low | 37 SP | [10_integration_api.plan.md](./10_integration_api.plan.md) |

**Total Estimated Story Points: 331 SP**

---

## Previously Created Epics

| Epic | ID | Plan Document |
|------|-----|---------------|
| Maintenance Management System (MMS) | TM-8 | [maintenance_management_system.plan.md](./maintenance_management_system_71a05d44.plan.md) |
| Production Management System | TM-20 | [production_management_system.plan.md](./production_management_system_6afd2746.plan.md) |

---

## Epic Details Quick Reference

### 1. Sales & Order Management
- **Focus**: Customer management, quotations, sales orders, delivery scheduling
- **Key Features**: Customer master, quotation lifecycle, SO-to-production link
- **Child Tickets**: 5 tasks (TM-34 to TM-38)

### 2. Procurement / Purchasing
- **Focus**: Supplier management, purchase requisitions, POs, goods receiving
- **Key Features**: Supplier rating, PR approval workflow, GR with inspection
- **Child Tickets**: 5 tasks (TM-40 to TM-44)

### 3. Warehouse & Logistics
- **Focus**: Warehouse locations, stock management, pick-pack-ship, deliveries
- **Key Features**: Multi-location, stock movements, barcode tracking
- **Child Tickets**: 5 tasks (TM-46 to TM-50)

### 4. HR & Training
- **Focus**: Skills matrix, certifications, training programs, competency assessment
- **Key Features**: Skill gap analysis, certification expiry alerts, training calendar
- **Child Tickets**: 5 tasks (TM-52 to TM-56)

### 5. Safety & Incident
- **Focus**: Incident reporting, near-miss, safety observations, investigations
- **Key Features**: 5-Why analysis, CAPA, safety KPIs (TRIR, LTIR)
- **Child Tickets**: 5 tasks (TM-58 to TM-62)

### 6. Costing & Finance
- **Focus**: BOM costing, labor costs, overhead allocation, profitability
- **Key Features**: Multi-level BOM, variance analysis, product profitability
- **Child Tickets**: 5 tasks (TM-64 to TM-68)

### 7. Document Management
- **Focus**: SOPs, work instructions, drawings, version control
- **Key Features**: Approval workflow, audit trail, full-text search
- **Child Tickets**: 4 tasks (TM-70 to TM-73)

### 8. Continuous Improvement
- **Focus**: Kaizen events, employee suggestions, 5S audits
- **Key Features**: Suggestion system, 5S scoring, recognition points
- **Child Tickets**: 5 tasks (TM-75 to TM-79)

### 9. Mobile App (PWA)
- **Focus**: Progressive Web App for shop floor access
- **Key Features**: Offline capability, barcode scanning, push notifications
- **Child Tickets**: 5 tasks (TM-81 to TM-85)

### 10. Integration & API
- **Focus**: REST API, webhooks, external system integration
- **Key Features**: Swagger docs, OAuth2, webhook system, data export/import
- **Child Tickets**: 5 tasks (TM-87 to TM-91)

---

## Implementation Roadmap Suggestion

### Phase 1: Core Operations (High Priority)
1. **Sales & Order Management** - Revenue generation
2. **Procurement / Purchasing** - Material supply
3. **Warehouse & Logistics** - Inventory control

### Phase 2: Operations Excellence (Medium Priority)
4. **Costing & Finance** - Cost tracking
5. **Safety & Incident** - Compliance
6. **HR & Training** - Workforce management
7. **Mobile App (PWA)** - Shop floor access

### Phase 3: Optimization (Low Priority)
8. **Document Management** - Process standardization
9. **Continuous Improvement** - Kaizen culture
10. **Integration & API** - System connectivity

---

## Common Patterns Across Epics

### Database Schema Patterns
- All entities have `id`, `created_at`, `updated_at`
- Soft delete using `is_active` boolean
- Foreign keys to core tables (users, departments)
- Status tracking with text enums

### API Patterns
- RESTful conventions
- Pagination for list endpoints
- Filter/search query parameters
- Consistent error responses

### UI Patterns
- List page with filters
- Detail page with tabs
- Create/edit forms
- Dashboard with KPIs

---

## Technical Stack Reference

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS |
| Charts | Recharts |
| Rich Text | React-Quill |
| Drag & Drop | @dnd-kit |
| Backend | Node.js, Express |
| Database | SQLite (upgradable to PostgreSQL) |
| Auth | JWT |
| PWA | Workbox, IndexedDB |
| API Docs | Swagger/OpenAPI |

---

## Notes

- All story point estimates are rough sizing using Fibonacci sequence
- Database schemas are designed for SQLite but compatible with PostgreSQL
- UI pages follow existing TaskFlow design patterns
- Each Epic can be developed independently after core modules

