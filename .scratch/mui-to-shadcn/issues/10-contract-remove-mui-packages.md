# 10: Contract — Complete Uninstall of MUI/Emotion & Final Quality Gate

**What to build:**
Uninstall `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`, `@emotion/react`, and `@emotion/styled` from `frontend/package.json`. Verify that zero `@mui` imports remain in `frontend/src/`. Verify that all 25 test files (200+ unit tests) pass 100% Green, typecheck passes with 0 errors, and production build succeeds.

**Blocked by:**
- 02: Migrate App Shell, Layout Sidebar & Error Pages
- 03: Migrate Auth Module (Login View & Tests)
- 04: Migrate Customer Module Views & Dialogs
- 05: Migrate Inventory & Category Module Views & Dialogs
- 06: Migrate Invoice Module Views & Printable Template
- 07: Migrate Job Queue Module & Kanban Board
- 08: Migrate Chat Assistant & Dashboard Analytics
- 09: Migrate Admin User Management & Audit Log Dialog

**Status:** ready-for-agent

- [ ] Run `npm uninstall @mui/material @mui/icons-material @mui/x-data-grid @emotion/react @emotion/styled` in `frontend/`
- [ ] Verify `grep -rn "@mui" frontend/src/` returns 0 results
- [ ] Verify `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass with 0 errors
