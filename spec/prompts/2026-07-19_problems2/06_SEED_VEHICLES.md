# Prompt — Phase 06: Seed Data Vehicles 2-5 per Customer

implement phase 06 ตาม spec/2026-07-19_problems2/06_SEED_VEHICLES.md

อ่าน AGENTS.md + backend/database/seeds/seed.ts ก่อนเริ่ม

สิ่งที่ต้องทำ:
  backend/database/seeds/seed.ts:
    - ลบ vehicleData array เดิม (5 คัน)
    - สร้าง vehicle templates (brand + models) — 10 แบรนด์ๆ ละ 2-5 รุ่น
    - generate vehicleData ใหม่:
      - แต่ละ customer ได้ 2-5 คัน (2 + (i % 4))
      - licensePlate สุ่มแบบ กข1234 (unique)
      - brand, model, year (2018-2024), engineType, fuelType สุ่มจาก templates
    - ใช้ Set เพื่อกัน licensePlate ซ้ำ

  รัน seed: npx tsx database/seeds/seed.ts
  verify: customers ทุกคนมี 2-5 vehicles

ห้าม:
  - ลบ customers, products, invoices ที่มีอยู่แล้ว
  - เปลี่ยน invoiceItems หรือ invoice logic

อย่าลืม:
  - รัน seed แล้ว verify ด้วย SQL
