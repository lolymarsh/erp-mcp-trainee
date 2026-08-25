# 03: Migrate Auth Module (Login View & Tests)

**What to build:**
Replace all MUI components in `frontend/src/modules/auth/view.tsx` with shadcn `Card`, `Input`, `Label`, `Button`, and Lucide `Eye`/`EyeOff` icons for password visibility toggle. Ensure loading indicator and validation errors match test assertions.

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Replace MUI in `frontend/src/modules/auth/view.tsx`
- [ ] Update `frontend/src/modules/auth/AuthView.test.tsx` to assert on semantic shadcn elements
- [ ] Ensure 100% green tests in `auth` module
