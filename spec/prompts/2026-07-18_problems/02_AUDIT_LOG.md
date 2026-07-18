# Prompt — Phase 02: Audit Log Module

implement phase 02 ตาม spec/2026-07-18_problems/02_AUDIT_LOG.md

อ่าน AGENTS.md + ARCHITECTURE.md + .agent/rules/ServicePatterns.md ก่อนเริ่ม
อิงจาก Go reference: /Users/lolymarsh/Desktop/project/be-go-echo/internal/auditlog/
ตามกฎ: DI (constructor), MongoDB repo (repo_mongo.ts), async fire-and-forget

CRITICAL — ใช้ MongoDB (ไม่ใช่ MySQL):
  - audit_logs collection (แยกจาก activity_logs ของ chat)
  - change_datas เก็บเป็น array of {field, old, new} — native JSON
  - async insert via setImmediate — ไม่ผ่าน RabbitMQ
  - ไม่ใช้ Drizzle, ไม่ใช้ MySQL transaction

สิ่งที่ต้องทำ:
  backend:
    - database.ts: เพิ่ม MongoDB indexes สำหรับ audit_logs collection
    - modules/audit/entity.ts — AuditLogDocument + ChangeModel
    - modules/audit/schema.ts — Zod filter/detail schemas + response DTOs
    - modules/audit/repo_mongo.ts — IAuditLogRepository: insertAuditLog, findByFilters, countByFilters, findByRecord
    - modules/audit/service.ts — IAuditLogService: filter, getDetail, insertAuditLog (diff engine + async setImmediate)
    - modules/audit/handler.ts — POST /filter, GET /detail?resource_id=&table_name=
    - modules/audit/route.ts — register routes with auth middleware
    - shared/middleware/auditMeta.ts — extract IP, User-Agent, Request-ID from req
    - app.ts: apply auditMetaMiddleware after auth middleware
    - customer/service.ts: inject IAuditLogService, log CREATE/UPDATE/DELETE (void async)
    - inventory/service.ts: inject IAuditLogService, log CREATE/UPDATE/DELETE + stock adjust
    - invoice/service.ts: inject IAuditLogService, log CREATE
    - job/service.ts: inject IAuditLogService, log CREATE + status change (UPDATE)
    - user/service.ts: inject IAuditLogService, log admin create user

  frontend:
    - modules/audit/model.ts — auditApi.getDetail(tableName, recordId), auditApi.filter(filters)
    - modules/audit/controller.ts — useAuditHistory(tableName, recordId)
    - shared/components/AuditLogDialog.tsx — reusable dialog showing change timeline with field-level diff
    - CustomerDetail view — add "ประวัติการแก้ไข" button → opens AuditLogDialog
    - InventoryDetail view — same
    - JobDetail view — same
    - InvoiceDetail view — same

  tests:
    - backend: auditlog unit tests (diff engine, service, handler)
    - backend: auditlog integration tests (MongoDB insert + query)
    - frontend: AuditLogDialog component test

CRITICAL — Diff Engine:
  - structToMap(data) → map[string]any (JSON roundtrip)
  - calculateChangedFields(oldMap, newMap, action) → ChangeModel[]
  - IGNORED_FIELDS: updatedAt, updated_at, version, updatedBy, updated_by
  - UPDATE with zero changes → skip insert
  - CREATE: all fields from newMap (old = "")
  - DELETE: all fields from oldMap (new = "")
  - Comparison: JSON.stringify(oldVal) !== JSON.stringify(newVal)

CRITICAL — Integration Pattern (ทุก module เหมือนกัน):
  - Snapshot oldData ก่อน mutate
  - ทำ business logic + persist
  - void this.auditService.insertAuditLog(action, tableName, recordId, userId, oldData, newData, meta)
  - ไม่ await — fire-and-forget

อย่าลืม:
  - DI: AuditLogRepository(mongoDb) — MongoDB, not MySQL/Drizzle
  - Services inject audit service + getAuditMeta callback (จาก req.auditMeta)
  - collection name: "audit_logs" (แยกจาก "activity_logs")
  - ADMIN see all audit logs; USER see only own (filter user_id enforced)
  - npm run typecheck + npm test — ต้องผ่าน
