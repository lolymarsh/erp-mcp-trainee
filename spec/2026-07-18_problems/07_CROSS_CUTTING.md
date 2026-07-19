# Phase 07 — Cross-Cutting: Routes, 404, Skeleton, Debounce

> **Priority**: 🟡 P1
> **Estimate**: 1 day
> **Depends on**: Phase 04-06 (detail pages must exist before routes can register)

---

## Task 7.1 — Register All Missing Routes (0.25 day)

### In `router.tsx`

```tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'login', element: <LoginPage /> },

      // List pages (existing)
      { path: 'customers', element: <CustomerListRoute /> },
      { path: 'inventory', element: <InventoryListRoute /> },
      { path: 'sales/invoices', element: <InvoiceListRoute /> },
      { path: 'jobs', element: <JobListRoute /> },
      { path: 'chat', element: <ChatPanel /> },

      // Detail pages (NEW)
      { path: 'customers/:id', element: <CustomerDetailRoute /> },
      { path: 'inventory/:id', element: <InventoryDetailRoute /> },
      { path: 'sales/invoices/:id', element: <InvoiceDetailRoute /> },
      { path: 'jobs/:id', element: <JobDetailRoute /> },

      // 404 catch-all (NEW)
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

### Route Guards
- Redirect authenticated users from `/login` to `/` (use `Navigate` if `isAuthenticated`)

---

## Task 7.2 — 404 + Error Pages (0.25 day)

### `shared/pages/NotFound.tsx`

```tsx
export function NotFoundPage() {
  return (
    <Box textAlign="center" py={8}>
      <Typography variant="h1" color="text.secondary" fontWeight="bold">404</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>ไม่พบหน้าที่คุณต้องการ</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        หน้าที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่ในระบบ
      </Typography>
      <Button variant="contained" component={Link} to="/">
        กลับหน้าแรก
      </Button>
    </Box>
  );
}
```

### Other Error Pages

| Page | When | Content |
|------|------|---------|
| `shared/pages/Forbidden.tsx` | 403 — no permission | "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" |
| `shared/pages/ErrorPage.tsx` | 500 — crash | "เกิดข้อผิดพลาด กรุณาลองใหม่" |
| `shared/pages/NetworkError.tsx` | Fetch failure | "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" |

---

## Task 7.3 — Skeleton Loading on All List Pages (0.5 day)

### Pattern

```tsx
import { Skeleton, TableRow, TableCell } from '@mui/material';

// Replace CircularProgress with Skeleton rows
{loading && (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton /></TableCell>
        <TableCell><Skeleton /></TableCell>
        {/* ... one Skeleton per column */}
      </TableRow>
    ))}
  </>
)}
```

### Pages to Update

| Page | Columns | Skeleton Rows |
|------|---------|--------------|
| `CustomerListView` | 3 (ชื่อ, นามสกุล, เบอร์โทร) | 5 |
| `InventoryListView` | 5 (SKU, ชื่อ, ขาย, สต็อก, ขั้นต่ำ) | 5 |
| `InvoiceListView` | 5 (Inv#, Total, Status, Method, Date) | 5 |
| `JobQueueView` | 7 | 5 |
| `DashboardView` | 4 KPI cards + 2 charts + table | Cards: skeleton rectangles, Charts: skeleton bars, Table: 5 skeleton rows |

### For Customer/Inventory (no Table, custom grid)

```tsx
{loading && (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
        <Skeleton variant="text" height={24} />
        <Skeleton variant="text" height={24} />
        <Skeleton variant="text" height={24} />
      </Box>
    ))}
  </Box>
)}
```

---

## Task 7.4 — Debounce on All Search Inputs (0.25 day)

### Shared hook: `useDebouncedValue`

```ts
// frontend/src/shared/hooks/useDebouncedValue.ts
import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

### Integration in controllers

```ts
// customer/controller.ts
export function useCustomerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const { customers, loading, pagination } = useCustomerData(page, debouncedSearch);

  useEffect(() => {
    setPage(1); // Reset to page 1 when search changes
  }, [debouncedSearch]);

  return { customers, loading, pagination, setPage, setSearch };
}
```

### Pages to Update

| Page | Search Field | Debounce Delay |
|------|-------------|----------------|
| Customer | "ค้นหาชื่อหรือเบอร์โทร" | 400ms |
| Inventory | "ค้นหาชื่อสินค้าหรือ SKU" | 400ms |
| Jobs (if added) | — | 400ms |

---

## Phase 07 Checklist

### Routes
- [x] `/customers/:id` route registered
- [x] `/inventory/:id` route registered
- [x] `/sales/invoices/:id` route registered
- [x] `/jobs/:id` route registered
- [x] `*` catch-all route → `NotFoundPage`
- [x] Login redirect (if authenticated) optional

### Error Pages
- [x] `shared/pages/NotFound.tsx`
- [x] `shared/pages/Forbidden.tsx`
- [x] `shared/pages/ErrorPage.tsx`
- [x] `shared/pages/NetworkError.tsx`

### Skeleton Loading
- [x] CustomerListView — skeleton rows
- [x] InventoryListView — skeleton rows
- [x] InvoiceListView — skeleton table rows
- [x] JobQueueView — skeleton table rows
- [x] DashboardView — skeleton cards + charts

### Debounce
- [x] `shared/hooks/useDebouncedValue.ts`
- [x] Customer search — debounced
- [x] Inventory search — debounced

### Verify
- [x] Run `npm run typecheck` — pass
- [x] Run `npm run lint` — pass
