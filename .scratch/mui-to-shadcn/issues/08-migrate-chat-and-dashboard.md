# 08: Migrate Chat Assistant & Dashboard Analytics

**What to build:**
Replace all MUI components in `frontend/src/modules/chat/view.tsx` and `frontend/src/modules/dashboard/view.tsx` (including removing `@mui/x-data-grid`). Use shadcn `Card`, `Button`, `Input`, `Badge`, `Table`, and Recharts responsive containers.

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Migrate `ChatPanel` message bubbles, quick prompt tags, and input toolbar
- [ ] Migrate `DashboardView` KPI cards, revenue charts, top technicians, and low stock table
- [ ] Update `DashboardView.test.tsx` and ensure 100% green tests in `chat` & `dashboard`
