# 04: Migrate Customer Module Views & Dialogs

**What to build:**
Replace all MUI components in `frontend/src/modules/customer/view.tsx` with shadcn `Table`, `Dialog`, `Card`, `Badge`, `Button`, `Input`, and Lucide icons (`Plus`, `Search`, `Edit`, `Trash2`, `History`, `Download`, `Car`).

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Migrate `CustomerListView`, `CustomerDetailView`, and all Customer/Vehicle CRUD dialogs
- [ ] Update `CustomerView.test.tsx` to match semantic shadcn DOM structure
- [ ] Ensure all 22+ tests in `src/modules/customer/` pass
