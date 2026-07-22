# 11 — Admin: User Management

> **Priority**: 🔴 P0 — ฟีเจอร์ใหม่, ต้องมีก่อนสร้าง UI
> **Estimate**: 2.5 days (backend 1.5d + frontend 1d + UX improvements 0.5d)
> **Depends on**: Phase 01 core (user entity, auth middleware, audit module)

---

## Overview

User Management สำหรับ Admin — CRUD ผู้ใช้งานในระบบ ปัจจุบัน backend มีแค่ `POST /auth/login`, `GET /auth/profile`, `POST /users` (create) — ขาดการจัดการเต็มรูปแบบ

## Backend

### Existing + New Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/users/filter` | `ADMIN` | List with pagination + filter |
| `POST` | `/api/users` | `ADMIN` | Create user (existing) |
| `PATCH` | `/api/users/:id` | `ADMIN` | Update role/displayName/isActive |
| `DELETE` | `/api/users/:id` | `ADMIN` | Soft delete |
| `PATCH` | `/api/users/:id/deactivate` | `ADMIN` | Toggle active/inactive |

### Schema Additions

```ts
export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "TECHNICIAN"]).optional(),
  isActive: z.boolean().optional(),
  version: z.number().int().min(1),
});

export const deleteUserSchema = z.object({
  version: z.number().int().min(1),
});
```

### Repository Additions

```ts
// UserRepository.findFiltered(input) — paginated + filterable
// Support filters: role (eq), isActive (eq), displayName (contains), username (contains)
// Sort by: displayName, role, createdAt
// Soft delete: set deletedAt, version + 1, updatedAt

// UserRepository.softDelete(id, version) — optimistic lock
```

### Service Methods

| Method | Behavior |
|--------|----------|
| `filter(input)` | Paginated list, exclude soft-deleted, map to response |
| `update(id, input, adminUserId, meta?)` | Version check, update fields, audit log |
| `softDelete(id, input, adminUserId, meta?)` | Version check, set deletedAt, audit log |
| `deactivate(id, adminUserId, meta?)` | Toggle isActive, audit log with ACTIVATE/DEACTIVATE action |

### Audit Integration

| Action | Audit entry |
|--------|-------------|
| Admin creates user | `CREATE` on `users` |
| Admin updates user | `UPDATE` on `users` |
| Admin deletes user | `DELETE` on `users` |
| Admin toggles active | `ACTIVATE` / `DEACTIVATE` on `users` |

## Frontend

### Module Structure

```
frontend/src/modules/user/
  model.ts       — API calls + types
  controller.ts  — Hooks (list, create, update, delete, toggleActive)
  view.tsx       — Components (list, dialogs)
```

### Components

#### UserListView

- **Table columns**: ชื่อผู้ใช้, ชื่อที่แสดง, บทบาท (ภาษาไทย), สถานะ (chip), จัดการ
- **Search**: TextField ค้นหาชื่อผู้ใช้หรือชื่อที่แสดง (debounced 400ms)
- **Role filter**: Select dropdown (ทั้งหมด, ADMIN, MANAGER, STAFF, TECHNICIAN)
- **Pagination**: MUI TablePagination
- **Actions column**: ปุ่ม-style buttons (ไม่ใช่ icon buttons)

```
[ค้นหาชื่อผู้ใช้หรือชื่อที่แสดง...]    [บทบาท: ทั้งหมด ▼]

| ชื่อผู้ใช้ | ชื่อที่แสดง | บทบาท     | สถานะ      | จัดการ                                                      |
|-----------|------------|-----------|------------|-------------------------------------------------------------|
| admin     | ผู้ดูแลระบบ  | ผู้ดูแลระบบ | 🟢 ใช้งาน   | [ประวัติ] [แก้ไข] [ปิดใช้งาน] [ลบ]                          |
| staff01   | สมชาย      | พนักงาน    | 🔴 ปิดใช้งาน | [ประวัติ] [แก้ไข] [เปิดใช้งาน] [ลบ]                         |
```

#### UserCreateDialog

- Form fields: username, password (min 6), displayName, role (select)
- Zod validation frontend + backend
- Field-level error display
- On success → refetch list + close dialog

#### UserEditDialog

- Form fields: displayName, role (select), isActive (toggle)
- Username แก้ไขไม่ได้
- Password แก้ไขไม่ได้ (reset password = future feature)
- Pre-filled with current values
- Sends current version for optimistic lock

#### UserDeleteConfirmDialog

- Confirm dialog: "คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ {displayName}?"
- Sends version for optimistic lock
- Soft delete (not actual removal)

### Hooks

| Hook | State | Purpose |
|------|-------|---------|
| `useUserList()` | users, loading, error, pagination, page, roleFilter, search, debouncedSearch | Fetch paginated list with filters |
| `useUserCreate(onSuccess)` | open, loading, error, fieldErrors | Create user dialog control |
| `useUserUpdate(id, onSuccess)` | open, loading, error, fieldErrors, initialValues | Edit user dialog control |
| `useUserDelete(id, onSuccess)` | open, loading, error | Delete confirmation control |
| `useUserToggleActive(onSuccess)` | loading, error | Toggle active/inactive |

### Router

```tsx
// Route: /admin/users → UserListRoute
function UserListRoute() {
  const { users, loading, error, pagination, setPage, setRoleFilter, roleFilter, setSearch, search, refetch } = useUserList();
  const createCtl = useUserCreate(refetch);
  const updateCtl = useUserUpdate(selectedUserId, refetch);
  const deleteCtl = useUserDelete(selectedUserId, refetch);
  const toggleCtl = useUserToggleActive(refetch);

  return (
    <UserListView
      users={users} loading={loading} error={error} pagination={pagination}
      roleFilter={roleFilter} search={search}
      onPageChange={setPage} onRoleFilterChange={setRoleFilter} onSearch={setSearch}
      onCreateClick={() => createCtl.setOpen(true)}
      onEdit={(user) => { setSelectedUserId(user.id); updateCtl.openWithData(user); }}
      onDelete={(user) => { setSelectedUserId(user.id); deleteCtl.setOpen(true); }}
      onToggleActive={(id) => toggleCtl.toggle(id)}
    />
    <UserCreateDialog ... />
    <UserEditDialog ... />
    <UserDeleteConfirmDialog ... />
  );
}
```

### Navigation

ใน sidebar navigation → เพิ่ม link:
```
"จัดการผู้ใช้งาน" → /admin/users
```
เฉพาะ Admin เท่านั้นที่เห็น

## Tasks

### Backend
- [ ] `user/schema.ts` — เพิ่ม `updateUserSchema`, `deleteUserSchema`
- [ ] `user/repo.ts` — เพิ่ม `findFiltered()` with pagination + filters
- [ ] `user/repo.ts` — เพิ่ม `softDelete()` with version check
- [ ] `user/service.ts` — เพิ่ม `filter()`, `update()`, `softDelete()`, `deactivate()`
- [ ] `user/handler.ts` — เพิ่ม `filter`, `update`, `softDelete`, `deactivate` handlers
- [ ] `user/route.ts` — เพิ่ม routes (`POST /filter`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/deactivate`)
- [ ] Inject audit service into user service
- [ ] Audit logging for all user mutations
- [ ] `npm run typecheck` — pass
- [ ] `npm test` — all pass

### Frontend
- [ ] `modules/user/model.ts` — interfaces + API calls
- [ ] `modules/user/controller.ts` — hooks (list, create, update, delete, toggleActive)
- [ ] `modules/user/view.tsx` — UserListView, UserCreateDialog, UserEditDialog, UserDeleteConfirmDialog
- [ ] `router.tsx` — เพิ่ม route `/admin/users`
- [ ] Layout sidebar — เพิ่ม link (Admin only)
- [ ] Search field with debounce (400ms)
- [ ] Role filter dropdown
- [ ] Button-style actions (not icon buttons)
- [ ] ทุก label เป็นภาษาไทย
- [ ] `npm run typecheck` — pass
- [ ] `npm run lint` — no new errors
- [ ] Manual test: Login as admin → /admin/users → list, create, edit, deactivate, delete
