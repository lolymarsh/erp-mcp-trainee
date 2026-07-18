# Prompt — Phase 01: Service Layer Refactor

implement phase 01 ตาม spec/2026-07-18_problems/01_SERVICE_FIX.md

อ่าน AGENTS.md + ARCHITECTURE.md + .agent/rules/ServicePatterns.md ก่อนเริ่ม
ตามกฎ: ServicePatterns Rule 7 — ห้าม service เรียก db ตรงๆ

สิ่งที่ต้องทำ:
  backend:
    - invoice/service.ts: ลบ db parameter ออกจาก constructor, inject ICustomerRepository + IInventoryRepository แทน
    - invoice/service.ts: แทนที่ this.db.select().from(customers) ด้วย this.customerRepo.findById()
    - invoice/service.ts: แทนที่ this.db.select().from(products) ด้วย this.inventoryRepo.findByIds()
    - invoice/service.ts: ลบ import eq, and, isNull จาก drizzle-orm, ลบ import customers, products จาก schema
    - inventory/repo.ts: เพิ่ม findByIds(ids[]) method (batch lookup)
    - job/service.ts: ลบ db parameter, inject ICustomerRepository
    - job/service.ts: แทนที่ this.db.select().from(customers) + .from(vehicles) ด้วย repo calls
    - customer/repo.ts: เพิ่ม findVehicleById(id) method
    - อัพเดท DI wiring ใน route.ts ทุกไฟล์ที่เกี่ยวข้อง
    - รัน npm run typecheck + npm test — ต้องผ่าน

ห้าม:
  - เปลี่ยน transaction logic (transaction อยู่ใน repo ถูกต้องแล้ว)
  - inject db เข้า service ใหม่
  - ใช้ import db global ในไฟล์ไหนก็ตาม

อย่าลืม:
  - InvoiceService constructor ใหม่: (repo, customerRepo, inventoryRepo, redis)
  - JobService constructor ใหม่: (repo, customerRepo, redis)
  - vehicle validation ย้ายไปใช้ repo (CustomerRepository.findVehicleById)
  - npm run lint ต้องผ่านด้วย
