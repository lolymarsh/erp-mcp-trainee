# Prompt — Phase 07: Cross-Cutting Fixes

implement phase 07 ตาม spec/2026-07-18_problems/07_CROSS_CUTTING.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: React Router v7, MUI Skeleton, debounce pattern

สิ่งที่ต้องทำ:
  frontend:
    # Routes
    - router.tsx: register missing routes:
        /customers/:id → CustomerDetailRoute
        /inventory/:id → InventoryDetailRoute
        /sales/invoices/:id → InvoiceDetailRoute
        /jobs/:id → JobDetailRoute
        * (catch-all) → NotFoundPage
    - optional: redirect /login → / if authenticated

    # 404 + Error Pages
    - shared/pages/NotFound.tsx — "404 ไม่พบหน้า" + ปุ่มกลับหน้าแรก
    - shared/pages/Forbidden.tsx — "403 ไม่มีสิทธิ์เข้าถึง"
    - shared/pages/ErrorPage.tsx — "500 เกิดข้อผิดพลาด"
    - shared/pages/NetworkError.tsx — "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"

    # Skeleton Loading
    - CustomerListView: loading → 5 Skeleton rows (3 columns)
    - InventoryListView: loading → 5 Skeleton rows (5 columns)
    - InvoiceListView: loading → 5 Skeleton table rows
    - JobQueueView: loading → 5 Skeleton table rows
    - DashboardView: loading → Skeleton KPI cards (4 rectangles) + Skeleton chart areas

    # Debounce
    - shared/hooks/useDebouncedValue.ts: useState + useEffect + setTimeout + cleanup
    - customer controller: search text → useDebouncedValue(search, 400) → use in API call
    - inventory controller: same
    - setPage(1) when debounced value changes

CRITICAL — Skeleton Pattern:
  - ใช้ MUI <Skeleton variant="text" /> ใน TableCell หรือ grid cell
  - ไม่ใช้ CircularProgress แล้ว (ยกเว้น dialog/form submits)
  - จำนวน skeleton rows = page_size หรือ 5 ถ้าเป็น list

CRITICAL — Debounce Pattern:
  - Hook: useDebouncedValue<T>(value: T, delay: number): T
  - apply ใน controller ไม่ใช่ใน view
  - useEffect(() => { setPage(1); }, [debouncedSearch])
  - delay: 400ms

อย่าลืม:
  - NotFound ต้องเป็น wildcard route (*) — ตัวสุดท้ายใน children array
  - Skeleton ต้องมี animation (ใช้ default MUI pulse animation)
  - Error pages มีปุ่มกลับหน้าแรก (Link to="/")
  - npm run typecheck — ผ่าน
