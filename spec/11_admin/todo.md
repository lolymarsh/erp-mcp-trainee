# 11 Admin Module — Todo & Status

> **Module**: 11_admin (User Management & Role-based Access)  
> **Status**: 🟢 90% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T11.1**: User Filter & Pagination backend endpoint (`POST /api/users/filter`)
- [x] **T11.2**: Update User details & Role with version check (`PATCH /api/users/:id`)
- [x] **T11.3**: Activate / Deactivate toggle endpoint (`PATCH /api/users/:id/deactivate`)
- [x] **T11.4**: Soft delete user endpoint with version check (`DELETE /api/users/:id`)
- [x] **T11.5**: Frontend MVC User management (`model.ts`, `controller.ts`, `view.tsx`)
- [ ] **T11.6**: Fix `UserEntity` and `CategoryEntity` import references in `frontend/src/router.tsx`
- [ ] **T11.7**: Migrate User table and edit dialog to shadcn/ui (`Table`, `Dialog`, `Select`)

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Router Type Fixes**:
   - `frontend/src/router.tsx`: มี reference หายไป `Cannot find name 'CategoryEntity'`, `Cannot find name 'UserEntity'`
2. **UI Polishing**:
   - ใช้ shadcn `Badge` สำหรับแสดง Role (`ADMIN`, `MANAGER`, `STAFF`, `TECHNICIAN`) และสถานะ (`ACTIVE`, `INACTIVE`)
