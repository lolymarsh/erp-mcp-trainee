# Phase 06 — Jobs CRUD + Invoice Detail + Pagination

> **Priority**: 🟡 P1
> **Estimate**: 1 day
> **Depends on**: Phase 04 (Customer CRUD) — jobs need customer selector

---

## Problem Summary

1. **Jobs page** — มีแค่ list + status filter + per-row status change, ไม่มี create form, ไม่มี detail page
2. **Invoice page** — มี list + create dialog (ดีแล้ว), แต่ไม่มี detail page
3. **Pagination** — Customer/Inventory ใช้ custom `<button>` ส่วน Invoice/Jobs ใช้ MUI `<TablePagination>` — ไม่สม่ำเสมอ

---

## Task 6.1 — Create Job (0.3 day)

### Controller: `useJobCreate(onSuccess)`

```ts
const createJobSchema = z.object({
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  vehicleId: z.string().optional(),
  jobType: z.enum(['INSTALL', 'REPAIR', 'INSPECT']),
  scheduledDate: z.string().optional(),
  technicianId: z.string().optional(),
  notes: z.string().optional(),
});
```

### View: `JobCreateDialog`

- Autocomplete: เลือกลูกค้า (load from customer list API)
- Autocomplete: เลือกรถ (filter by customer)
- Select: Job Type (INSTALL / REPAIR / INSPECT)
- DatePicker / TextField: วันที่นัดหมาย
- TextField: ช่างผู้รับผิดชอบ
- TextField: หมายเหตุ (multiline)

---

## Task 6.2 — Job Detail Page (0.2 day)

### Route: `/jobs/:id` → `JobDetailRoute`

แสดง:
- Job info (customer, vehicle, job type, status badge, scheduled date, start/end time, technician, notes)
- Status change dropdown (specific allowed transitions)
- Status logs timeline
- Action buttons: เปลี่ยนสถานะ / **ประวัติการแก้ไข** (Phase 02)

---

## Task 6.3 — Invoice Detail Page (0.2 day)

### Route: `/sales/invoices/:id` → `InvoiceDetailRoute`

แสดง:
- Invoice number, payment status (Chip), payment method, date
- Customer info
- Items table (product name, qty, unit price, line total)
- Total, discount, grand total
- Action button: **ประวัติการแก้ไข** (Phase 02)

> Note: Invoice ไม่มี edit/delete — create เท่านั้นตาม spec

---

## Task 6.4 — Standardize Pagination (0.3 day)

### Current State
- Customer/Inventory: custom `<button>` "ก่อนหน้า/ถัดไป"
- Invoice/Jobs: MUI `<TablePagination>`

### Fix

เปลี่ยน CustomerListView และ InventoryListView ให้ใช้ MUI `<TablePagination>`:

```tsx
// Before (customer/view.tsx)
<button disabled={!pagination.hasPreviousPage} onClick={...}>ก่อนหน้า</button>
<Typography>หน้า {page} / {totalPage}</Typography>
<button disabled={!pagination.hasNextPage} onClick={...}>ถัดไป</button>

// After
<TablePagination
  component="div"
  count={pagination.totalData}
  page={pagination.page - 1}   // MUI 0-indexed
  rowsPerPage={pagination.pageSize}
  onPageChange={(_, newPage) => onPageChange(newPage + 1)}
  rowsPerPageOptions={[pagination.pageSize]} // fixed page size
  labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
/>
```

---

## Phase 06 Checklist

### Jobs
- [x] `useJobCreate()` controller + Zod schema
- [x] `JobCreateDialog` — customer/vehicle Autocomplete + form fields
- [x] "สร้างงาน" button in `JobQueueView` header
- [x] `JobDetailView` — job info + status logs + actions
- [x] `/jobs/:id` route registered

### Invoice
- [x] `InvoiceDetailView` — invoice info + items table + totals
- [x] `/sales/invoices/:id` route registered

### Pagination
- [x] `CustomerListView` — replace custom buttons with `<TablePagination>`
- [x] `InventoryListView` — replace custom buttons with `<TablePagination>`
- [x] Verify `PaginationResponse` type has all required fields

### Verify
- [x] Run `npm run typecheck` — pass
