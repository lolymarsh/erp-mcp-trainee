# Prompt — Phase 04: Customer CRUD UI

implement phase 04 ตาม spec/2026-07-18_problems/04_CUSTOMER_CRUD.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: frontend MVC, Zod validation, MUI Dialog/DataGrid, version check + 409 handling

backend API มีครบแล้ว — ทำ frontend อย่างเดียว

สิ่งที่ต้องทำ:
  frontend:
    - modules/customer/controller.ts: useCustomerDetail(id) — fetch + refetch
    - modules/customer/view.tsx: CustomerDetailView — แสดงข้อมูล + vehicles list + action buttons
    - modules/customer/controller.ts: useCustomerCreate(onSuccess) — Zod schema + API call
    - modules/customer/view.tsx: CustomerCreateDialog — MUI Dialog + form fields (firstName*, lastName*, phone*, email, address)
    - modules/customer/controller.ts: useCustomerUpdate(id, onSuccess) — pre-fill + version
    - modules/customer/view.tsx: CustomerEditDialog — same form, pre-filled, handle 409
    - modules/customer/controller.ts: useCustomerDelete(id, onSuccess) — confirmation + softDelete API
    - modules/customer/view.tsx: DeleteConfirmDialog
    - CustomerListView: add "เพิ่มลูกค้า" Button in header (top-right)
    - router.tsx: register /customers/:id route

CRITICAL — Version Handling:
  - update/delete payload ต้องส่ง version
  - ถ้า API return 409 → show "ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่" + refresh detail
  - version field ใน Zod schema: z.number().int().min(1)

อย่าลืม:
  - model.ts มี API functions ครบแล้ว (create, update, softDelete, getById) — ไม่ต้องสร้างใหม่
  - phone validation: min 10 หลัก, format เบอร์ไทย
  - email: optional, แต่ถ้ากรอกต้อง valid format
  - forms ใช้ MUI Dialog (ไม่ใช่ inline form)
  - onSuccess callback → refresh list/detail
