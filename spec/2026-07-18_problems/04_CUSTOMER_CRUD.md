# Phase 04 — Customer CRUD UI

> **Priority**: 🔴 P0 — User-facing
> **Estimate**: 1 day
> **Depends on**: Nothing (backend CRUD APIs + model.ts ready)

---

## Problem Summary

**Current:** `frontend/src/modules/customer/view.tsx` — มีแค่ list + search + click navigate ไป `/customers/:id` ซึ่งเป็น dead route (ไม่มี route ลงทะเบียน)

**Backend มีแล้ว:** `POST /customers` (create), `PATCH /customers/:id` (update), `DELETE /customers/:id` (softDelete), `GET /customers/:id`
**Model มีแล้ว:** `customerApi.create()`, `customerApi.update()`, `customerApi.softDelete()`, `customerApi.getById()`

---

## Task 4.1 — Customer Detail Page (0.4 day)

### Route: `/customers/:id` → `CustomerDetailRoute`

```tsx
// controller.ts
export function useCustomerDetail(id: string) {
  const [customer, setCustomer] = useState<CustomerWithVehicles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await customerApi.getById(id);
      setCustomer(data);
    } catch (err) {
      setError(isErrorWithMessage(err) ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [id]);
  return { customer, loading, error, refetch: fetch };
}
```

### View: `CustomerDetailView`

แสดง:
- ข้อมูลลูกค้า (ชื่อ, นามสกุล, เบอร์โทร, อีเมล, ที่อยู่)
- รถที่ลงทะเบียน (license plate, brand, model, year, engine type)
- Action buttons: แก้ไข / ลบ / **ประวัติการแก้ไข** (Phase 02)

---

## Task 4.2 — Create Customer Dialog (0.2 day)

### Controller: `useCustomerCreate()`

```ts
export function useCustomerCreate(onSuccess: () => void) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createCustomerSchema = z.object({
    firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
    lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
    phone: z.string().min(10, 'เบอร์โทรต้องอย่างน้อย 10 หลัก'),
    email: z.string().email('อีเมลไม่ถูกต้อง').optional().or(z.literal('')),
    address: z.string().optional(),
  });

  const submit = async (input: CreateCustomerInput) => {
    const result = createCustomerSchema.safeParse(input);
    if (!result.success) { /* set fieldErrors */ return; }

    setLoading(true);
    try {
      await customerApi.create(input);
      onSuccess();
      setOpen(false);
    } catch (err) {
      setError(isErrorWithMessage(err) ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return { open, setOpen, loading, error, fieldErrors, submit };
}
```

### View: `CustomerCreateDialog`

MUI `<Dialog>`:
- TextField: ชื่อ*, นามสกุล*, เบอร์โทร*, อีเมล, ที่อยู่
- Zod validation + field-level error display
- Submit → call controller → close on success

---

## Task 4.3 — Edit Customer (0.2 day)

### Controller: `useCustomerUpdate(id)`

- Pre-fill form with existing customer data
- Zod validation (same as create but all optional except version)
- Include `version` in payload
- Handle 409 Conflict → show "ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่"

### View: `CustomerEditDialog` (หรือ inline form ใน detail page)

- Same fields as create, pre-populated
- Version check in payload

---

## Task 4.4 — Delete Customer (0.2 day)

### Controller: `useCustomerDelete(id)`

- Confirmation dialog
- Call `customerApi.softDelete(id, version)`
- Handle 409 → refresh detail page
- On success → navigate back to `/customers`

### View: Delete confirmation dialog

```tsx
<Dialog open={open} onClose={onCancel}>
  <DialogTitle>ยืนยันการลบ</DialogTitle>
  <DialogContent>
    คุณต้องการลบลูกค้า "{customerName}" ใช่หรือไม่?
  </DialogContent>
  <DialogActions>
    <Button onClick={onCancel}>ยกเลิก</Button>
    <Button color="error" onClick={onConfirm}>ลบ</Button>
  </DialogActions>
</Dialog>
```

---

## Task 4.5 — Register Routes (0.1 day)

ใน `router.tsx`:

```tsx
// เพิ่มใน children array:
{ path: 'customers/:id', element: <CustomerDetailRoute /> }
```

Update `CustomerListRoute` — เปลี่ยนจาก dead navigate เป็น navigate ไป `/customers/:id` (มีอยู่แล้ว แค่ route ยังไม่มี)

---

## Phase 04 Checklist

- [x] `useCustomerDetail(id)` controller
- [x] `CustomerDetailView` — display customer + vehicles
- [x] `useCustomerCreate()` controller + Zod schema
- [x] `CustomerCreateDialog` — MUI Dialog with form
- [x] "เพิ่มลูกค้า" button in `CustomerListView` header
- [x] `useCustomerUpdate(id)` controller + pre-fill + version
- [x] `CustomerEditDialog` — handle 409 version conflict
- [x] `useCustomerDelete(id)` controller + confirmation
- [x] Delete confirmation dialog
- [x] `/customers/:id` route registered
- [x] Run `npx tsc -b --noEmit` — pass (0 errors)
