# 07 Dashboard Module — Todo & Status

> **Module**: 07_dashboard (Aggregated KPIs & Analytics)  
> **Status**: 🟢 90% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T7.1**: KPI aggregation backend service (Today sales, Queued jobs, Low stock count, Month revenue)
- [x] **T7.2**: Redis caching for dashboard metrics with auto-invalidation
- [x] **T7.3**: Monthly revenue trend & Top technicians chart endpoints
- [x] **T7.4**: Frontend MVC structure with Recharts (`model.ts`, `controller.ts`, `view.tsx`)
- [ ] **T7.5**: Migrate KPI Cards to shadcn `Card` + `CardHeader` + `CardTitle`
- [ ] **T7.6**: Replace low-stock table in dashboard with shadcn `Table` + `Badge`
- [ ] **T7.7**: Add Date Range Picker for customized historical analysis

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Custom Date Filter**:
   - ปัจจุบันสรุปยอดเฉพาะ Today และ Current Month ยังไม่รองรับ Custom Date Range (เช่น ดูย้อนหลัง 3 เดือน หรือเลือกช่วงวันที่เอง)
2. **UI Polishing**:
   - ปรับแต่งหน้าตา KPI Cards ให้ใช้ shadcn Cards พร้อมไอคอนจาก `lucide-react`
