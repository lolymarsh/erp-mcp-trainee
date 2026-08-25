# 05 Job Module — Todo & Status

> **Module**: 05_job (Installation & Workshop Job Queue)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T5.1**: Job Queue backend with technician assignment & status logs (`/api/jobs`)
- [x] **T5.2**: State machine transition rules (QUEUED → IN_PROGRESS → COMPLETED / CANCELLED)
- [x] **T5.3**: Today queue summary endpoint (`GET /api/jobs/today-queue`)
- [x] **T5.4**: Frontend MVC structure (`model.ts`, `controller.ts`, `view.tsx`)
- [x] **T5.5**: Fix `JobView.test.tsx` props mismatch (`jobTypeFilter`, `onJobTypeFilterChange`, `onSearch`, `search`)
- [x] **T5.6**: Remove unused `_debouncedSearch` in `frontend/src/modules/job/controller.ts`
- [ ] **T5.7**: Migrate Job Table & Kanban board to pure shadcn `Card`, `Badge`, `Button` and remove all MUI

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Kanban & Table UI Migration**:
   - ลบ MUI `@mui/material` components ออกจาก `JobQueueView`, `JobCreateDialog`, `JobDetailView` เปลี่ยนเป็น shadcn `Card`, `Table`, `Dialog`
