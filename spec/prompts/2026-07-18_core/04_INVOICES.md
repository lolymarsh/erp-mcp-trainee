# Prompt — Phase 04: Invoices (Sales + Payments)

```
implement phase 04 ตาม spec/2026-07-18_core/04_INVOICES.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: DI (constructor), version check, pagination, transaction (MUST!)

สิ่งที่ต้องทำ:
  backend:  modules/invoice/ (entity, schema, handler, service, repo, route, test)
  frontend: modules/invoice/ (model, controller, view)
  tests:    integration + unit + component

CRITICAL — Create Invoice Transaction:
  db.transaction(async (tx) => {
    1. INSERT invoices
    2. INSERT invoice_items (loop)
    3. SELECT products FOR UPDATE (lock rows)
    4. UPDATE products.current_stock (deduct)
    5. INSERT stock_movements (type: OUT)
    → any throw = full rollback
  })

อย่าลืม:
  - Validation ก่อน transaction: customer exists, stock เพียงพอ
  - ถ้าสต็อกไม่พอ → 400 + rollback (no partial changes)
  - POST /filter ต้อง return pagination
  - GET /today-summary return { totalAmount, count }
  - Frontend: InvoiceForm มี customer selector + product dropdown + auto-calculate
```
