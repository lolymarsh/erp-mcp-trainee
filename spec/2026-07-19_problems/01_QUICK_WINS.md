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
- [ ] `invoice/view.tsx` — แก้ label ทั้งหมดใน `InvoiceListView`
- [ ] `invoice/view.tsx` — แก้ label ทั้งหมดใน `InvoiceCreateView`
- [ ] `invoice/view.tsx` — แก้ label ทั้งหมดใน `InvoiceDetailView`
- [ ] `job/view.tsx` — แก้ label ทั้งหมดใน `JobQueueView`
- [ ] `job/view.tsx` — แก้ label ทั้งหมดใน `JobCreateDialog`
- [ ] `job/view.tsx` — แก้ label ทั้งหมดใน `JobDetailView`
- [ ] ตรวจสอบ `dashboard/view.tsx`, `inventory/view.tsx` เผื่อมีอังกฤษเหลือ

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
- [ ] `router.tsx` — เพิ่ม props ที่ขาด
- [ ] ทดสอบ manual: เปิด modal → ค้นหา customer → ค้นหา product → เลือก → สร้าง invoice
- [ ] ทดสอบ infinite scroll (ถ้ามี customers/products เยอะพอ)

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
- [ ] `job/controller.ts` — เพิ่ม `customerDebounceRef`
- [ ] `job/controller.ts` — เปลี่ยน `handleCustomerSearch` ให้ใช้ debounce
- [ ] `job/controller.ts` — เพิ่ม cleanup effect
- [ ] ทดสอบ manual: พิมพ์หาลูกค้า → ดู network tab → ไม่ยิง API รัว

---

## Phase 01 Checklist

- [ ] `invoice/view.tsx` — แก้ label เป็นไทย
- [ ] `job/view.tsx` — แก้ label เป็นไทย
- [ ] `router.tsx` — เพิ่ม props ให้ InvoiceCreateView
- [ ] `job/controller.ts` — เพิ่ม debounce customer search
- [ ] ทดสอบ manual: Invoice modal ทำงานได้
- [ ] ทดสอบ manual: Job ไม่ยิง API รั่ว
- [ ] `npm run typecheck` — pass
- [ ] `npm run lint` — no new errors
