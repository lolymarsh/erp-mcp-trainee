# Prompt — Phase 01: Invoice Search + Filter + Payment Update

implement phase 01 ตาม spec/2026-07-19_problems2/01_INVOICE_SEARCH_FILTER.md

อ่าน AGENTS.md ก่อนเริ่ม
ตามกฎ: R3 Version Check, R4 Unified Response, R5 TypeScript Strict, R6 Error Handling

สิ่งที่ต้องทำ:

Task 1.1 — Backend: Payment Update Endpoint:
  modules/invoice/schema.ts: เพิ่ม updatePaymentStatusSchema (paymentStatus, paymentMethod?, version)
  modules/invoice/repo.ts: IInvoiceRepository เพิ่ม updatePaymentStatus, implement with version check
  modules/invoice/service.ts: IInvoiceService เพิ่ม updatePaymentStatus, version check + audit log
  modules/invoice/handler.ts: เพิ่ม updatePaymentStatus handler (try/catch + AppError + ZodError)
  modules/invoice/route.ts: เพิ่ม PATCH /:id/payment-status

Task 1.2 — Frontend: Invoice List Search + Filters:
  modules/invoice/model.ts: เพิ่ม updatePaymentStatus API call ใน invoiceApi
  modules/invoice/controller.ts: useInvoiceList เพิ่ม search + statusFilter + paymentMethodFilter + useDebouncedValue
  modules/invoice/view.tsx: InvoiceListView เพิ่ม search TextField + status Select + paymentMethod Select
  router.tsx: ส่ง props ใหม่ให้ InvoiceListView

Task 1.3 — Frontend: Invoice Detail Payment Update:
  modules/invoice/view.tsx:
    - InvoiceDetailViewProps เพิ่ม onUpdatePayment
    - InvoiceDetailView header เพิ่มปุ่ม "อัพเดทสถานะชำระเงิน"
    - สร้าง InvoicePaymentUpdateDialog (status select + method select + submit)
  modules/invoice/controller.ts: เพิ่ม useInvoicePaymentUpdate hook
  router.tsx: InvoiceDetailRoute เชื่อม dialog

ห้าม:
  - เปลี่ยน transaction logic
  - ลบ audit log

อย่าลืม:
  - ลอก pattern จาก modules/job/handler.ts (updateStatus pattern)
  - npm run typecheck + npm test ต้องผ่าน
