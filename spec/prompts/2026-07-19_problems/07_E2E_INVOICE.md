# Prompt — Phase 07: E2E Invoice Full Flow

implement phase 07 ตาม spec/2026-07-19_problems/07_E2E_INVOICE.md

อ่าน frontend/e2e/invoice.spec.ts + frontend/e2e/helpers.ts + frontend/e2e/login.spec.ts ก่อนเริ่ม

สิ่งที่ต้องทำ:
  frontend/e2e/invoice.spec.ts — เขียนใหม่ทั้งหมด (ไม่ใช่แก้ต่อ)

  test 1: create invoice
    - login → navigate to /sales/invoices
    - click "สร้างใบแจ้งหนี้"
    - select customer จาก autocomplete
    - select payment method "เงินสด"
    - select product จาก autocomplete
    - add item (qty=2)
    - submit → verify invoice shows in list

  test 2: view invoice detail
    - login → navigate to /sales/invoices
    - click first row → verify detail page shows invoice data

  test 3: check history
    - login → navigate to /sales/invoices → click first row
    - click "ประวัติการแก้ไข" → verify dialog opens

ใช้ label ไทยตามที่แก้ใน Phase 01

อย่าลืม:
  - ใช้ loginAsAdmin() จาก helpers
  - รัน npm run test:e2e ต้องผ่าน
