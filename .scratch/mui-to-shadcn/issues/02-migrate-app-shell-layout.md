# 02: Migrate App Shell, Layout Sidebar & Error Pages

**What to build:**
Remove MUI `ThemeProvider` from `App.tsx`, and replace MUI `Drawer`/`AppBar`/`List` in `Layout.tsx` with a modern responsive sidebar + topbar built with Tailwind CSS, shadcn `Button`/`Badge`, and Lucide navigation icons (`LayoutDashboard`, `Users`, `Boxes`, `FileText`, `Wrench`, `BotMessageSquare`, `Shield`, `LogOut`). Migrate static Error Pages (`NotFound`, `Forbidden`, `NetworkError`, `ErrorPage`).

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Remove `@mui/material/styles` `ThemeProvider` from `App.tsx`
- [ ] Migrate `Layout.tsx` and `Layout.test.tsx` to pure Tailwind + Lucide
- [ ] Migrate `shared/pages/NotFound.tsx`, `Forbidden.tsx`, `NetworkError.tsx`, `ErrorPage.tsx`
