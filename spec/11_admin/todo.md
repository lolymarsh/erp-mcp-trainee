# 11 Admin Module — Todo & Status

> **Module**: 11_admin (User Management & Role-based Access)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T11.1**: User Filter & Pagination backend endpoint (`POST /api/users/filter`)
- [x] **T11.2**: Update User details & Role with version check (`PATCH /api/users/:id`)
- [x] **T11.3**: Activate / Deactivate toggle endpoint (`PATCH /api/users/:id/deactivate`)
- [x] **T11.4**: Soft delete user endpoint with version check (`DELETE /api/users/:id`)
- [x] **T11.5**: Frontend MVC User management (`model.ts`, `controller.ts`, `view.tsx`)
- [x] **T11.6**: Fix `UserEntity` and `CategoryEntity` import references in `frontend/src/router.tsx`
- [ ] **T11.7**: Migrate User table and edit dialog to pure shadcn/ui (`Table`, `Dialog`, `Select`, `Badge`)

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **User Management UI Migration**:
   - ลบ `@mui/material` ออกจาก `UserListView`, `UserCreateDialog`, `UserEditDialog`, `UserDeleteConfirmDialog` เปลี่ยนเป็น shadcn `Table`, `Badge`, `Dialog`, `Input`, `Select`
