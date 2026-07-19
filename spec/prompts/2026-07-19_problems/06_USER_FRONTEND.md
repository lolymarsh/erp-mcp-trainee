# Prompt — Phase 06: User Management Frontend

implement phase 06 ตาม spec/2026-07-19_problems/06_USER_FRONTEND.md

อ่าน AGENTS.md + modules/customer/* (เป็น reference pattern) + router.tsx ก่อนเริ่ม

ตามกฎ: frontend MVC, Zod validation, MUI Dialog, version check + 409 handling

backend API มีครบแล้ว (POST /users/filter, POST /users, PATCH /users/:id, DELETE /users/:id, PATCH /users/:id/deactivate) — ทำ frontend อย่างเดียว

สิ่งที่ต้องทำ:
  frontend/src/modules/user/ — สร้างใหม่ 3 ไฟล์:

  model.ts:
    - UserEntity, CreateUserInput, UpdateUserInput, DeleteUserInput, FilterParams, PaginationResponse interfaces
    - userApi: filter (POST /users/filter), create (POST /users), update (PATCH /users/:id), softDelete (DELETE /users/:id), deactivate (PATCH /users/:id/deactivate)
    - getRoleLabel() → แสดงไทย: ADMIN="ผู้ดูแลระบบ", MANAGER="ผู้จัดการ", STAFF="พนักงาน", TECHNICIAN="ช่าง"

  controller.ts:
    - useUserList() — pagination + role filter
    - useUserCreate(onSuccess) — Zod validation
    - useUserUpdate(id, onSuccess) — pre-fill + version
    - useUserDelete(id, onSuccess) — confirmation
    - useUserToggleActive(onSuccess) — toggle isActive

  view.tsx:
    - UserListView — Table: ชื่อผู้ใช้, ชื่อที่แสดง, บทบาท (ไทย), สถานะ (Active/Inactive chip), จัดการ (edit/deactivate/delete buttons)
    - UserCreateDialog — form: ชื่อผู้ใช้, รหัสผ่าน, ชื่อที่แสดง, บทบาท (select)
    - UserEditDialog — form: ชื่อที่แสดง, บทบาท (select), username ไม่แก้
    - DeleteConfirmDialog — confirm message
    - ทุก label เป็นภาษาไทย

  router.tsx:
    - เพิ่ม route path:"admin/users" → UserListRoute component
    - import components + hooks

CRITICAL — Version Handling:
  - update/delete payload ต้องส่ง version
  - version field: z.number().int().min(1)

อย่าลืม:
  - ลอก pattern จาก modules/customer/* (โครงสร้าง hooks, dialog, error handling)
  - npm run typecheck + npm run lint ต้องผ่าน
