# 07: Migrate Job Queue Module & Kanban Board

**What to build:**
Replace all MUI components in `frontend/src/modules/job/view.tsx` with shadcn `Table`, `Card`, `Badge`, `Button`, `Select`, `Input`, and Lucide icons (`Wrench`, `Clock`, `CheckCircle2`, `Kanban`, `List`).

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Migrate `JobQueueView` table and Kanban board columns
- [ ] Migrate `JobCreateDialog`, `JobDetailView`
- [ ] Update `JobView.test.tsx` and ensure all 32+ tests in `src/modules/job/` pass
