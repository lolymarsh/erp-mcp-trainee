# 04 Invoice Module — Todo & Status

> **Module**: 04_invoice (Sales, Invoices, Payments & Stock Deduction)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T4.1**: Multi-table atomic write transaction (`invoices`, `invoice_items`, `stock_movements`, `products`)
- [x] **T4.2**: Invoice filtering & search endpoint with pagination (`POST /api/sales/invoices/filter`)
- [x] **T4.3**: Payment status update with optimistic version check (`PATCH /api/sales/invoices/:id/payment-status`)
- [x] **T4.4**: Today sales summary endpoint (`GET /api/sales/invoices/today-summary`)
- [x] **T4.5**: Frontend MVC structure (`model.ts`, `controller.ts`, `view.tsx`)
- [x] **T4.6**: Add Print / Export to PDF for official Invoice & Receipt
- [ ] **T4.7**: Migrate Invoice items dynamic table to shadcn/ui Data Table
- [x] **T4.8**: Add VAT / Tax calculation configuration options (Include VAT vs Exclude VAT)

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **UI Migration to shadcn/ui**:
   - แปลง `InvoiceListView`, `InvoiceCreateView`, `InvoiceDetailView`, `InvoicePaymentUpdateDialog` ให้ใช้ shadcn `Table`, `Card`, `Dialog`, `Input` แทน MUI ทั้งหมด
