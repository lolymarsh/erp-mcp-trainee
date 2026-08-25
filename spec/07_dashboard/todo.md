# 07 Dashboard Module — Todo & Status

> **Module**: 07_dashboard (Aggregated KPIs & Analytics)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T7.1**: KPI aggregation backend service (Today sales, Queued jobs, Low stock count, Month revenue)
- [x] **T7.2**: Redis caching for dashboard metrics with auto-invalidation
- [x] **T7.3**: Monthly revenue trend & Top technicians chart endpoints
- [x] **T7.4**: Frontend MVC structure with Recharts (`model.ts`, `controller.ts`, `view.tsx`)
- [ ] **T7.5**: Migrate KPI Cards to shadcn `Card` + `CardHeader` + `CardTitle` + Lucide icons
- [ ] **T7.6**: Replace `@mui/x-data-grid` & low-stock table with shadcn `Table` + `Badge`
- [x] **T7.7**: Summary and quick filtering support for dashboard analysis

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Dashboard UI Migration**:
   - ลบ `@mui/material` และ `@mui/x-data-grid` ออกจาก `DashboardView` แทนที่ด้วย shadcn `Card`, `Table`, `Badge` และ Recharts ResponsiveContainer
