# 02 Customer Module — Todo & Status

> **Module**: 02_customer (Customer & Vehicle Management)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T2.1**: Customer Backend CRUD + Soft Delete + Version Check (`/api/customers`)
- [x] **T2.2**: Vehicle Backend CRUD (`/api/customers/:id/vehicles`)
- [x] **T2.3**: Customer Filter API with Pagination (`POST /api/customers/filter`)
- [x] **T2.4**: Frontend MVC structure (`model.ts`, `controller.ts`, `view.tsx`)
- [x] **T2.5**: Frontend UX Improvements (Sonner toast on save/delete + Skeleton loader + inline error helper)
- [x] **T2.6**: Unit and component tests for Customer module (22/22 tests passing)
- [x] **T2.7**: Migrate Customer Table & Dialogs from MUI to shadcn/ui components (`Table`, `Dialog`, `Input`, `Button`)
- [x] **T2.8**: Add CSV / Excel Export for customer contact list

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Full shadcn/ui Component Migration**:
   - `CustomerListView` และ `CustomerDetailView` ยังมี MUI `Paper`, `Dialog`, `Typography` ปนอยู่ สามารถแทนที่ด้วย shadcn `Card`, `Dialog`, `Table`
2. **Vehicle History Tracking**:
   - เชื่อมโยงประวัติงานซ่อมและใบเสร็จของแต่ละรถ (Vehicle) ในหน้า Customer Detail
