# 10 Audit Log Module — Todo & Status

> **Module**: 10_audit (Audit Logging, Change Tracking & MongoDB Store)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T10.1**: MongoDB Audit Log Schema & Indexing (`audit_logs` collection)
- [x] **T10.2**: Audit Service with Diff Engine (captures only changed fields)
- [x] **T10.3**: RabbitMQ background worker (`auditWorker.ts`) for async logging
- [x] **T10.4**: Audit Log API endpoint (`POST /api/audit-logs/filter`)
- [x] **T10.5**: Frontend `AuditLogDialog` component for entity change history inspection
- [x] **T10.6**: Filterable Audit Log query support with Table/Record filters
- [ ] **T10.7**: Migrate `AuditLogDialog` to pure shadcn/ui `Dialog`, `Badge`, `Skeleton` and remove MUI

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **AuditLogDialog Migration**:
   - ลบ `@mui/material` ออกจาก `AuditLogDialog.tsx` และแทนที่ด้วย shadcn `Dialog`, `Badge`, `Skeleton`
