# Prompt — Phase 04: Seed Data (20 Customers + 20 Products)

implement phase 04 ตาม spec/2026-07-19_problems/04_SEED_DATA.md

อ่าน AGENTS.md + backend/database/seeds/seed.ts ก่อนเริ่ม

สิ่งที่ต้องทำ:
  backend/database/seeds/seed.ts:
    - เพิ่ม customers อีก 15 ราย (รวม 20) — firstName แบบไทย, phone ครบ 10 หลัก, version=1
    - เพิ่ม products อีก 10 รายการ (รวม 20) — ของติดตั้งแก๊ส, categoryId จาก categories ที่มีอยู่แล้ว
    - รัน seed: npx tsx database/seeds/seed.ts

รูปแบบ customer:
  { firstName, lastName, phone, email: string|null, address: string|null }
  ใช้ uuidv4() สำหรับ id, version=1

รูปแบบ product:
  { categoryId, sku, name, unit, costPrice, sellPrice, minStock, currentStock }
  ใช้ uuidv4() สำหรับ id, version=1

ห้าม:
  - ลบ seed ที่มีอยู่แล้ว (append ต่อ)

อย่าลืม:
  - รัน seed แล้ว verify: SELECT COUNT(*) FROM customers = 20, products = 20
