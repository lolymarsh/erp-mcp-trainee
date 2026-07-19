# Phase 04 — Seed Data: 20 Customers + 20 Products

> **Priority**: 🟡 P1 — จำเป็นสำหรับ E2E test และ UX จริง
> **Estimate**: 0.5 day
> **Depends on**: Nothing

---

## Problem Summary

ปัจจุบัน `backend/database/seeds/seed.ts` มี customers 5 ราย, products 10 รายการ — ไม่พอสำหรับทดสอบ search, pagination, infinite scroll

---

## Task 4.1 — เพิ่ม Customers เป็น 20 ราย

เพิ่ม customers ที่เหลืออีก 15 ราย ใน `seed.ts`:
```ts
const customerData = [
  // Existing 5
  { firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678', ... },
  // ... 4 more existing ...

  // New 15
  { firstName: 'ประยุทธ', lastName: 'ตั้งใจ', phone: '0867890123', ... },
  { firstName: 'นภาพร', lastName: 'สุขสวัสดิ์', phone: '0878901234', ... },
  { firstName: 'อดุลย์', lastName: 'เดชา', phone: '0889012345', ... },
  { firstName: 'กนกพร', lastName: 'รักเรียน', phone: '0890123456', ... },
  { firstName: 'สมศักดิ์', lastName: 'ศรีวิไล', phone: '0901234567', ... },
  { firstName: 'รัตนา', lastName: 'มั่งคั่ง', phone: '0912345678', ... },
  { firstName: 'ธนากร', lastName: 'กล้าหาญ', phone: '0923456789', ... },
  { firstName: 'สุภาพร', lastName: 'มีสุข', phone: '0934567890', ... },
  { firstName: 'พิชัย', lastName: 'สง่า', phone: '0945678901', ... },
  { firstName: 'อารีย์', lastName: 'วัฒนา', phone: '0956789012', ... },
  { firstName: 'ดำรง', lastName: 'มั่นคง', phone: '0967890123', ... },
  { firstName: 'ผกามาศ', lastName: 'จันทร์แจ่ม', phone: '0978901234', ... },
  { firstName: 'บรรจบ', lastName: 'เจริญสุข', phone: '0989012345', ... },
  { firstName: 'สุนีย์', lastName: 'เรืองศรี', phone: '0990123456', ... },
  { firstName: 'ทวี', lastName: 'ชัยชนะ', phone: '0800123456', ... },
];
```

ให้ customer ทุกคนมี `version: 1` และสุ่ม `address`, `email` บางคน

---

## Task 4.2 — เพิ่ม Products เป็น 20 รายการ

เพิ่ม products อีก 10 รายการ จากที่มี 10 → 20:
```ts
const products = [
  // Existing 10
  { categoryId: catId, sku: 'TNK-58L', name: 'ถังแก๊ส 58L', ... },
  // ... 9 more existing ...

  // New 10
  { categoryId: catId, sku: 'TNK-120L', name: 'ถังแก๊ส 120L', unit: 'ใบ', costPrice: '6500', sellPrice: '9500', minStock: 2, currentStock: 6 },
  { categoryId: cat2Id, sku: 'INJ-8CYL', name: 'หัวฉีด 8 สูบ', unit: 'ชุด', costPrice: '5200', sellPrice: '7800', minStock: 2, currentStock: 5 },
  { categoryId: cat3Id, sku: 'ECU-GEN5', name: 'ECU รุ่น 5', unit: 'ตัว', costPrice: '8500', sellPrice: '12000', minStock: 2, currentStock: 3 },
  { categoryId: cat4Id, sku: 'HOSE-3M', name: 'สายท่อ 3 เมตร', unit: 'เส้น', costPrice: '350', sellPrice: '750', minStock: 10, currentStock: 30 },
  { categoryId: catId, sku: 'BRK-01', name: 'ชุดขายึดถัง', unit: 'ชุด', costPrice: '250', sellPrice: '550', minStock: 10, currentStock: 20 },
  { categoryId: cat2Id, sku: 'REG-01', name: 'ชุดเรกูเลเตอร์', unit: 'ชุด', costPrice: '1800', sellPrice: '3200', minStock: 5, currentStock: 12 },
  { categoryId: cat3Id, sku: 'WIR-01', name: 'ชุดสายไฟ ECU', unit: 'ชุด', costPrice: '1200', sellPrice: '2200', minStock: 5, currentStock: 15 },
  { categoryId: cat4Id, sku: 'VAL-01', name: 'วาล์วถังแก๊ส', unit: 'ตัว', costPrice: '800', sellPrice: '1500', minStock: 5, currentStock: 10 },
  { categoryId: catId, sku: 'GAS-01', name: 'มิเตอร์วัดแก๊ส', unit: 'ตัว', costPrice: '600', sellPrice: '1200', minStock: 5, currentStock: 8 },
  { categoryId: cat2Id, sku: 'MAP-01', name: 'เซ็นเซอร์ MAP', unit: 'ตัว', costPrice: '900', sellPrice: '1800', minStock: 5, currentStock: 10 },
];
```

---

## Task 4.3 — Run seed (0.05 day)

```bash
cd backend
npx tsx database/seeds/seed.ts
```

หรือถ้ามี migration system:
```bash
npm run seed
```

---

## Task 4.4 — Verify (0.05 day)

```sql
SELECT COUNT(*) FROM customers;  -- 20
SELECT COUNT(*) FROM products;   -- 20
SELECT COUNT(*) FROM categories; -- 4
```

---

## Phase 04 Checklist

- [x] `seed.ts` — เพิ่ม customers 35 ราย (รวม 40)
- [x] `seed.ts` — เพิ่ม products 30 รายการ (รวม 40)
- [x] รัน seed → ไม่มี error
- [x] Verify 40 customers + 40 products ใน DB
