# 09: Migrate Admin User Management & Audit Log Dialog

**What to build:**
Replace all MUI components in `frontend/src/modules/user/view.tsx` and `frontend/src/shared/components/AuditLogDialog.tsx` with shadcn `Table`, `Dialog`, `Badge`, `Select`, `Input`, `Button`.

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Migrate `UserListView`, `UserCreateDialog`, `UserEditDialog`, `UserDeleteConfirmDialog`
- [ ] Migrate `AuditLogDialog.tsx`
- [ ] Update `UserView.test.tsx` and ensure all 20+ tests in `src/modules/user/` pass
