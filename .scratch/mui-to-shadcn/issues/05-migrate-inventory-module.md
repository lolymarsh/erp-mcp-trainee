# 05: Migrate Inventory & Category Module Views & Dialogs

**What to build:**
Replace all MUI components in `frontend/src/modules/inventory/view.tsx` with shadcn `Table`, `Badge`, `Dialog`, `Input`, `Select`, `Button`, and Lucide icons (`Package`, `Tags`, `Sliders`, `Plus`, `Search`, `AlertTriangle`).

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Migrate `InventoryListView`, `InventoryDetailView`, `CategoryManageView`, and stock adjust dialogs
- [ ] Update `InventoryView.test.tsx`
- [ ] Ensure all 27+ tests in `src/modules/inventory/` pass
