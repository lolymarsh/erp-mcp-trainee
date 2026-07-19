# Phase 06 — Seed Data: Vehicles 2-5 per Customer

> **Priority**: 🟡 P1 — จำเป็นสำหรับ test และ UX จริง
> **Estimate**: 0.5 day
> **Depends on**: Nothing

---

## Task 6.1 — เพิ่ม Vehicles ใน Seed (0.4 day)

### `backend/database/seeds/seed.ts`

ปัจจุบันมี vehicles 5 คันสำหรับ 5 customers แรก — ต้องเพิ่มให้ลูกค้าทุกคนมี 2-5 คัน

เปลี่ยน `vehicleData` จาก array 5 รายการ → generate แบบกระจาย:

```ts
// Vehicle templates สำหรับสุ่ม
const vehicleTemplates = [
  { brand: 'Toyota', models: ['Hilux Revo', 'Fortuner', 'Camry', 'Yaris', 'Corolla'] },
  { brand: 'Honda', models: ['Civic', 'CR-V', 'HR-V', 'Accord', 'Jazz'] },
  { brand: 'Isuzu', models: ['D-Max', 'MU-X'] },
  { brand: 'Mitsubishi', models: ['Triton', 'Pajero Sport', 'Attrage'] },
  { brand: 'Ford', models: ['Ranger', 'Everest', 'Focus'] },
  { brand: 'Nissan', models: ['Navara', 'Almera', 'Terra'] },
  { brand: 'Mazda', models: ['CX-5', 'BT-50', 'Mazda 2'] },
  { brand: 'MG', models: ['ZS', 'MG5', 'MG4'] },
  { brand: 'Hyundai', models: ['Elantra', 'Tucson', 'H-1'] },
  { brand: 'BYD', models: ['Atto 3', 'Dolphin', 'Seal'] },
];

const engineTypes = ['VVT-i', 'i-VTEC', '4JJ1', '4N15', '2.0L TDCi', 'BluePower', 'SkyActiv', 'eMotion', 'Smartstream', 'Blade'];
const fuelTypes = ['Gasoline', 'Diesel', 'Gasoline', 'Gasoline', 'Diesel', 'Electric']; // weighted

// กำหนดให้แต่ละ customer มี vehicle 2-5 คัน
const vehicleData: {
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  engineType: string;
  fuelType: string;
}[] = [];

const usedPlates = new Set<string>();

function randomLicensePlate(): string {
  const consonants = 'กขคงจชซดตถทนบปพยรลวสหอ';
  const numbers = '0123456789';
  let plate: string;
  do {
    const c1 = consonants[Math.floor(Math.random() * consonants.length)];
    const c2 = consonants[Math.floor(Math.random() * consonants.length)];
    const n1 = numbers[Math.floor(Math.random() * numbers.length)];
    const n2 = numbers[Math.floor(Math.random() * numbers.length)];
    const n3 = numbers[Math.floor(Math.random() * numbers.length)];
    const n4 = numbers[Math.floor(Math.random() * numbers.length)];
    plate = `${c1}${c2}${n1}${n2}${n3}${n4}`;
  } while (usedPlates.has(plate));
  usedPlates.add(plate);
  return plate;
}

for (let i = 0; i < customerData.length; i++) {
  const vehicleCount = 2 + (i % 4); // 2, 3, 4, 5 ซ้ำกันไป
  for (let j = 0; j < vehicleCount; j++) {
    const template = vehicleTemplates[Math.floor(Math.random() * vehicleTemplates.length)];
    const model = template.models[Math.floor(Math.random() * template.models.length)];
    vehicleData.push({
      customerId: customerIds[i],
      licensePlate: randomLicensePlate(),
      brand: template.brand,
      model,
      year: 2018 + Math.floor(Math.random() * 7), // 2018-2024
      engineType: engineTypes[Math.floor(Math.random() * engineTypes.length)],
      fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
    });
  }
}
```

ลบ `vehicleData` แบบเก่า (5 คัน) และใช้ logic ใหม่แทน

---

## Task 6.2 — รัน seed + verify (0.1 day)

```bash
cd backend
npx tsx database/seeds/seed.ts
```

Verify:
```sql
SELECT c.firstName, c.lastName, COUNT(v.id) as vehicle_count
FROM customers c
LEFT JOIN vehicles v ON v.customer_id = c.id
GROUP BY c.id;
-- ทุกคนควรมี 2-5 คัน
```

---

## Phase 06 Checklist

- [ ] `backend/database/seeds/seed.ts` — ลบ vehicleData เดิม 5 คัน
- [ ] `backend/database/seeds/seed.ts` — เพิ่ม logic generate 2-5 คันต่อ customer
- [ ] รัน seed — ไม่มี error
- [ ] Verify: ทุก customer มี vehicles 2-5 คัน
