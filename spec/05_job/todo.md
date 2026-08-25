# 05 Job Module — Todo & Status

> **Module**: 05_job (Installation & Workshop Job Queue)  
> **Status**: 🟡 80% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T5.1**: Job Queue backend with technician assignment & status logs (`/api/jobs`)
- [x] **T5.2**: State machine transition rules (QUEUED → IN_PROGRESS → COMPLETED / CANCELLED)
- [x] **T5.3**: Today queue summary endpoint (`GET /api/jobs/today-queue`)
- [x] **T5.4**: Frontend MVC structure (`model.ts`, `controller.ts`, `view.tsx`)
- [x] **T5.5**: Fix `JobView.test.tsx` props mismatch (`jobTypeFilter`, `onJobTypeFilterChange`, `onSearch`, `search`)
- [x] **T5.6**: Remove unused `_debouncedSearch` in `frontend/src/modules/job/controller.ts`
- [ ] **T5.7**: Build Kanban Board view using shadcn `Card` & drag-and-drop for technician queue management

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Fix Frontend Test & Type Warnings**:
   - `src/modules/job/JobView.test.tsx` ส่ง props ไม่ครบตาม `JobQueueViewProps`
   - `src/modules/job/controller.ts` มี unused variable `_debouncedSearch`
2. **Kanban UI Experience**:
   - ปัจจุบันแสดงผลเป็น List ตารางธรรมดา ต้องการปรับเป็น Kanban Board ลากเปลี่ยนสถานะงาน (QUEUED -> IN_PROGRESS -> COMPLETED)
