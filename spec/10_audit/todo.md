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
- [x] **T10.7**: Audit dialog with action type badges (CREATE, UPDATE, DELETE) and formatted JSON diffs

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Full Audit Log Page**:
   - ปัจจุบันดูประวัติได้เฉพาะราย Entity ผ่าน Dialog ยังไม่มีหน้าจอรวมสำหรับ Admin ค้นหาประวัติการทำงานทั้งระบบ
2. **UI Polish**:
   - ปรับแต่ง Badge แสดง Action Type (CREATE = green, UPDATE = blue, DELETE = red) ด้วย shadcn `Badge`
