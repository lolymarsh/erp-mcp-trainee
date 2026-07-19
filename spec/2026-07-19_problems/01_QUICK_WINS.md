# Phase 01 — Quick Wins: ไทย + Invoice Props + Job API Leak

> **Priority**: 🔴 P0 — ส่งผลต่อ UX โดยตรง
> **Estimate**: 0.5 day
> **Depends on**: Nothing

---

## Task 1.1 — ภาษาไทยสม่ำเสมอ (0.25 day)

### เป้าหมาย
ทุก label/ข้อความใน frontend ที่เป็นอังกฤษ → เปลี่ยนเป็นไทย

### `frontend/src/modules/invoice/view.tsx`
```ts
// InvoiceListView
"Invoices" → "ใบแจ้งหนี้"
"New Invoice" → "สร้างใบแจ้งหนี้"
"Invoice Number" → "เลขที่ใบแจ้งหนี้"
"Total" → "ยอดรวม"
"Payment Status" → "สถานะชำระเงิน"
"Payment Method" → "วิธีการชำระ"
"Date" → "วันที่"
"No invoices found" → "ไม่พบใบแจ้งหนี้"

// InvoiceCreateView
"Create Invoice" → "สร้างใบแจ้งหนี้"
"Customer" → "ลูกค้า"
"Payment Method" → "วิธีการชำระ"
"Product" → "สินค้า"
"Qty" → "จำนวน"
"Add Item" → "เพิ่มสินค้า"
"Discount" → "ส่วนลด"
"Cancel" → "ยกเลิก"
"Create Invoice" → "สร้างใบแจ้งหนี้"
"Unit Price" → "ราคาต่อหน่วย"
"None" → "ไม่มี"
"Cash" → "เงินสด"
"Bank Transfer" → "โอนเงิน"
"Credit" → "เครดิต"
"PromptPay" → "พร้อมเพย์"
```

### `frontend/src/modules/job/view.tsx`
```ts
// JobQueueView
"Job Queue" → "คิวงาน"
"Status Filter" → "กรองสถานะ"
"Customer" → "ลูกค้า"
"Job Type" → "ประเภทงาน"
"Status" → "สถานะ"
"Scheduled" → "วันที่นัดหมาย"
"Technician" → "ช่าง"
"Created" → "สร้างเมื่อ"
"Change Status" → "เปลี่ยนสถานะ"
"No jobs found" → "ไม่พบงาน"
"All" → "ทั้งหมด"
"Queued" → "รอดำเนินการ"
"In Progress" → "กำลังดำเนินการ"
"Completed" → "เสร็จแล้ว"
"Cancelled" → "ยกเลิก"
"Terminal" → "สถานะสิ้นสุด"
"Change..." → "เปลี่ยน..."
"Install" → "ติดตั้ง"
"Repair" → "ซ่อม"
"Inspect" → "ตรวจสอบ"
"Change Status" → "เปลี่ยนสถานะ"
```

### Checklist
- [x] `invoice/view.tsx` — แก้ label ทั้งหมดใน `InvoiceListView`
- [x] `invoice/view.tsx` — แก้ label ทั้งหมดใน `InvoiceCreateView`
- [x] `invoice/view.tsx` — แก้ label ทั้งหมดใน `InvoiceDetailView` (เป็นไทยอยู่แล้ว)
- [x] `job/view.tsx` — แก้ label ทั้งหมดใน `JobQueueView`
- [x] `job/view.tsx` — แก้ label ทั้งหมดใน `JobCreateDialog` (เป็นไทยอยู่แล้ว)
- [x] `job/view.tsx` — แก้ label ทั้งหมดใน `JobDetailView` (เป็นไทยอยู่แล้ว)
- [x] ตรวจสอบ `dashboard/view.tsx`, `inventory/view.tsx` เผื่อมีอังกฤษเหลือ (ไม่มี)

---

## Task 1.2 — Fix Invoice Modal Props (0.15 day)

### ปัญหา
`router.tsx` ส่ง props ให้ `InvoiceCreateView` ไม่ครบ — ขาด `onCustomerSearch`, `onProductSearch`, `onLoadMoreCustomers`, `onLoadMoreProducts`, `customerLoading`, `productLoading`

### สาเหตุ
`frontend/src/router.tsx:295-323` — ส่ง props แค่บางส่วน

### วิธีแก้
```tsx
<InvoiceCreateView
  // ... existing props ...
  customerLoading={createCtl.customerLoading}
  productLoading={createCtl.productLoading}
  onCustomerSearch={createCtl.handleCustomerSearch}
  onProductSearch={createCtl.handleProductSearch}
  onLoadMoreCustomers={createCtl.loadMoreCustomers}
  onLoadMoreProducts={createCtl.loadMoreProducts}
/>
```

### Checklist
- [x] `router.tsx` — เพิ่ม props ที่ขาด
- [x] `invoice/view.tsx` — แก้ `onInputChange` ให้ filter เฉพาะ `reason === 'input'` (กันยิง API ตอนเลือกค่า)
- [x] ทดสอบ manual: เปิด modal → ค้นหา customer → ค้นหา product → เลือก → สร้าง invoice

---

## Task 1.3 — Fix Job API Leak (0.1 day)

### ปัญหา
`frontend/src/modules/job/controller.ts:280-282` — `handleCustomerSearch` เรียก `loadCustomers` โดยตรงทุก keystroke → ยิง API รัว

### วิธีแก้
เพิ่ม debounce 300ms + cleanup:

```ts
// job/controller.ts
const customerDebounceRef = useRef<ReturnType<typeof setTimeout>>();

const handleCustomerSearch = useCallback((q: string) => {
  if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
  customerDebounceRef.current = setTimeout(() => {
    void loadCustomers(q);
  }, 300);
}, [loadCustomers]);

// cleanup on unmount
useEffect(() => {
  return () => {
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
  };
}, []);
```

### Checklist
- [x] `job/controller.ts` — เพิ่ม `customerDebounceRef`
- [x] `job/controller.ts` — เปลี่ยน `handleCustomerSearch` ให้ใช้ debounce
- [x] `job/controller.ts` — เพิ่ม cleanup effect
- [x] `job/controller.ts` — แปลง `scheduledDate` เป็น ISO datetime ก่อนส่ง API
- [x] `job/view.tsx` — แก้ `onInputChange` ให้ filter เฉพาะ `reason === 'input'`

---

## Phase 01 Checklist

- [x] `invoice/view.tsx` — แก้ label เป็นไทย
- [x] `job/view.tsx` — แก้ label เป็นไทย
- [x] `router.tsx` — เพิ่ม props ให้ InvoiceCreateView
- [x] `job/controller.ts` — เพิ่ม debounce customer search
- [x] `invoice/view.tsx` — แก้ `onInputChange` filter `reason === 'input'`
- [x] `job/view.tsx` — แก้ `onInputChange` filter `reason === 'input'`
- [x] `job/controller.ts` — แปลง `scheduledDate` เป็น ISO datetime
- [x] ทดสอบ manual: Invoice modal ทำงานได้ (select customer/product ไม่ clear)
- [x] ทดสอบ manual: Job สร้างได้ ไม่ขึ้น 400
- [x] `npm run typecheck` — pass
- [x] `npm run lint` — no new errors
