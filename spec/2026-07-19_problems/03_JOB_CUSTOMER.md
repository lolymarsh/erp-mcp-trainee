# Phase 03 — Job: Customer Selection Overhaul

> **Priority**: 🔴 P0 — UX แย่, API รั่ว, เลือกลูกค้าไม่ได้
> **Estimate**: 1 day
> **Depends on**: Nothing

---

## Problem Summary

หน้า `/jobs` ตอนสร้างงาน — การเลือกลูกค้า:
1. **API leak** — ยิง API ทุก keystroke (แก้เบื้องต้นใน Phase 01 แล้ว)
2. **No pagination** — ปัจจุบันโหลด `pageSize: 100` ไม่ scalable
3. **No infinite scroll** — ไม่เหมือน invoice modal ที่ทำ infinite scroll
4. **No debounce** — (แก้แล้วใน Phase 01)

**เป้าหมาย:** ทำให้เลือก customer ใน JobCreateDialog เหมือน InvoiceCreateView ทุกประการ

---

## Task 3.1 — Refactor useJobCreate (0.5 day)

### เปลี่ยน `loadCustomers` ให้ใช้ pagination + debounce + infinite scroll

**Before (`job/controller.ts`):**
```ts
const loadCustomers = useCallback(async (search?: string) => {
  try {
    const params: FilterParams = {
      page: 1,
      pageSize: 100,  // ← ไม่มี pagination
      sortName: "firstName",
      sortBy: "asc",
    };
    if (search) {
      params.filters = [{ field: "firstName", operator: "contains", value: search }];
    }
    const result = await customerApi.filter(params);
    setCustomers(result.data);
  } catch {
    setCustomers([]);
  }
}, []);
```

**After:**
```ts
// เพิ่ม refs สำหรับ pagination state
const customerSearchTerm = useRef('');
const customerPageRef = useRef(1);
const customerTotalPagesRef = useRef(1);
const customerLoadingRef = useRef(false);
const customerDebounceRef = useRef<ReturnType<typeof setTimeout>>();

const searchCustomers = useCallback(async (search: string, page: number, append: boolean) => {
  if (customerLoadingRef.current) return;
  customerLoadingRef.current = true;
  try {
    const filters = search
      ? [{ field: 'firstName', operator: 'contains' as const, value: search }]
      : [];
    const result = await customerApi.filter({
      page,
      pageSize: 10,
      sortBy: 'asc',
      sortName: 'firstName',
      filters,
    });
    if (append) {
      setCustomers(prev => [...prev, ...result.data]);
    } else {
      setCustomers(result.data);
    }
    customerTotalPagesRef.current = result.pagination.totalPage;
    customerPageRef.current = page;
  } catch {
    // silent
  } finally {
    customerLoadingRef.current = false;
  }
}, []);

const handleCustomerSearch = useCallback((q: string) => {
  customerSearchTerm.current = q;
  if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
  customerDebounceRef.current = setTimeout(() => {
    void searchCustomers(q, 1, false);
  }, 300);
}, [searchCustomers]);

const loadMoreCustomers = useCallback(() => {
  if (customerPageRef.current < customerTotalPagesRef.current && !customerLoadingRef.current) {
    void searchCustomers(customerSearchTerm.current, customerPageRef.current + 1, true);
  }
}, [searchCustomers]);
```

### เปลี่ยน useEffect ตอนเปิด dialog
```ts
// Before:
useEffect(() => {
  if (open) {
    void loadCustomers();
  }
}, [open, loadCustomers]);

// After:
useEffect(() => {
  if (open) {
    customerSearchTerm.current = '';
    customerPageRef.current = 1;
    void searchCustomers('', 1, false);
  }
}, [open, searchCustomers]);

// Cleanup
useEffect(() => {
  return () => {
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
  };
}, []);
```

### เพิ่มใน return object
```ts
return {
  // ... existing ...
  handleCustomerSearch,
  loadMoreCustomers,  // ← เพิ่ม
  customerLoading: customerLoadingRef.current,  // ← ต้องใช้ useState จริงแทน useRef ถ้าต้องการให้ UI re-render
};
```

> **Note**: `customerLoadingRef.current` เป็น ref → UI ไม่ re-render อัตโนมัติ ถ้าต้องการแสดง loading spinner ต้องใช้ `customerLoading` state (setCustomerLoading) แทน — ปรับตามตัวอย่าง invoice/controller.ts

---

## Task 3.2 — Update JobCreateDialog Props (0.25 day)

### `frontend/src/modules/job/view.tsx`

เพิ่ม props ใน `JobCreateDialogProps`:
```ts
interface JobCreateDialogProps {
  // ... existing ...
  customerLoading: boolean;
  onLoadMoreCustomers: () => void;
}
```

แก้ Autocomplete ของ customer:
```tsx
<Autocomplete
  options={customers}
  getOptionLabel={(c) => `${c.firstName} ${c.lastName} (${c.phone})`}
  value={selectedCustomer}
  onChange={(_, val) => onCustomerChange(val?.id ?? "")}
  onInputChange={(_, val) => onCustomerSearch(val)}
  filterOptions={(x) => x}  // ← ใช้ API filter ไม่ใช้ local
  loading={customerLoading}  // ← เพิ่ม
  slotProps={{
    listbox: {
      onScroll: (e: React.UIEvent<HTMLUListElement>) => {
        const listbox = e.currentTarget;
        if (listbox.scrollHeight - listbox.scrollTop - listbox.clientHeight < 50) {
          onLoadMoreCustomers();  // ← infinite scroll
        }
      },
    },
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="ลูกค้า *"
      required
      error={!!fieldErrors.customerId}
      helperText={fieldErrors.customerId}
    />
  )}
/>
```

---

## Task 3.3 — Update router.tsx (0.1 day)

### `frontend/src/router.tsx` — JobListRoute

ส่ง props เพิ่ม:
```tsx
<JobCreateDialog
  // ... existing props ...
  customerLoading={createCtl.customerLoading}
  onLoadMoreCustomers={createCtl.loadMoreCustomers}
/>
```

---

## Task 3.4 — Cleanup vehicle load (0.15 day)

### ปัญหาเดิม
```ts
const setCustomerId = useCallback((id: string) => {
  setCustomerIdState(id);
  setVehicleId("");
  if (id) {
    void loadVehicles(id);  // ← เรียก API ทุกครั้งที่เปลี่ยน customer
  } else {
    setVehicles([]);
  }
}, [loadVehicles]);
```

ไม่ต้องแก้ไข — อันนี้ถูกต้องแล้ว (ต้องโหลด vehicles ของ customer ที่เลือก)
แต่เพิ่ม error handling:
```ts
const loadVehicles = useCallback(async (id: string) => {
  try {
    const result = await customerApi.getById(id);
    setVehicles(result.data.vehicles ?? []);  // ← fallback ถ้า vehicles เป็น undefined
  } catch {
    setVehicles([]);
  }
}, []);
```

---

## Phase 03 Checklist

- [x] `job/controller.ts` — เพิ่ม refs: `customerSearchTerm`, `customerPageRef`, `customerTotalPagesRef`, `customerLoadingRef`, `customerDebounceRef`
- [x] `job/controller.ts` — เพิ่ม `searchCustomers()` แบบ paginated
- [x] `job/controller.ts` — เปลี่ยน `handleCustomerSearch` → debounce + reset page
- [x] `job/controller.ts` — เพิ่ม `loadMoreCustomers()` infinite scroll
- [x] `job/controller.ts` — เปลี่ยน `useEffect` ตอนเปิด dialog
- [x] `job/controller.ts` — เพิ่ม cleanup effect
- [x] `job/controller.ts` — เพิ่ม `customerLoading`, `loadMoreCustomers` ใน return
- [x] `job/view.tsx` — เพิ่ม props `customerLoading`, `onLoadMoreCustomers`
- [x] `job/view.tsx` — Autocomplete เพิ่ม `filterOptions`, `loading`, `slotProps.listbox.onScroll`
- [x] `job/view.tsx` — `loadVehicles` fallback `?? []`
- [x] `router.tsx` — ส่ง props `customerLoading`, `onLoadMoreCustomers`
- [ ] ทดสอบ manual: เปิด JobCreate → ค้นหาลูกค้า → เห็น loading → infinite scroll
- [x] `npm run typecheck` — pass
- [x] `npm run lint` — no new errors
