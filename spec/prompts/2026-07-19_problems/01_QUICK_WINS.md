# Prompt — Phase 01: Quick Wins (ไทย + Invoice Props + Job API Leak)

implement phase 01 ตาม spec/2026-07-19_problems/01_QUICK_WINS.md

อ่าน AGENTS.md ก่อนเริ่ม

สิ่งที่ต้องทำ:

Task 1.1 — ภาษาไทย:
  frontend/src/modules/invoice/view.tsx:
    - InvoiceListView: "Invoices"→"ใบแจ้งหนี้", "New Invoice"→"สร้างใบแจ้งหนี้", "Invoice Number"→"เลขที่ใบแจ้งหนี้", "Total"→"ยอดรวม", "Payment Status"→"สถานะชำระเงิน", "Payment Method"→"วิธีการชำระ", "Date"→"วันที่", "No invoices found"→"ไม่พบใบแจ้งหนี้"
    - InvoiceCreateView: "Create Invoice"→"สร้างใบแจ้งหนี้", "Customer"→"ลูกค้า", "Product"→"สินค้า", "Qty"→"จำนวน", "Add Item"→"เพิ่มสินค้า", "Discount"→"ส่วนลด", "Cancel"→"ยกเลิก", "Unit Price"→"ราคาต่อหน่วย", "None"→"ไม่มี", "Cash"→"เงินสด", "Bank Transfer"→"โอนเงิน", "Credit"→"เครดิต", "PromptPay"→"พร้อมเพย์"
    - InvoiceDetailView: ตรวจสอบ label อังกฤษที่เหลือ

  frontend/src/modules/job/view.tsx:
    - JobQueueView: "Job Queue"→"คิวงาน", "Status Filter"→"กรองสถานะ", "Customer"→"ลูกค้า", "Job Type"→"ประเภทงาน", "Status"→"สถานะ", "Scheduled"→"วันที่นัดหมาย", "Technician"→"ช่าง", "Created"→"สร้างเมื่อ", "Change Status"→"เปลี่ยนสถานะ", "No jobs found"→"ไม่พบงาน", "All"→"ทั้งหมด", "Queued"→"รอดำเนินการ", "In Progress"→"กำลังดำเนินการ", "Completed"→"เสร็จแล้ว", "Cancelled"→"ยกเลิก", "Terminal"→"สถานะสิ้นสุด", "Change..."→"เปลี่ยน...", "Install"→"ติดตั้ง", "Repair"→"ซ่อม", "Inspect"→"ตรวจสอบ"
    - JobCreateDialog + JobDetailView: ตรวจสอบ label อังกฤษที่เหลือ

Task 1.2 — Fix Invoice Modal Props:
  frontend/src/router.tsx:
    - InvoiceCreateView เพิ่ม props: customerLoading={createCtl.customerLoading}, productLoading={createCtl.productLoading}, onCustomerSearch={createCtl.handleCustomerSearch}, onProductSearch={createCtl.handleProductSearch}, onLoadMoreCustomers={createCtl.loadMoreCustomers}, onLoadMoreProducts={createCtl.loadMoreProducts}

Task 1.3 — Fix Job API Leak:
  frontend/src/modules/job/controller.ts:
    - เพิ่ม customerDebounceRef = useRef<ReturnType<typeof setTimeout>>()
    - เปลี่ยน handleCustomerSearch ให้ clearTimeout + setTimeout 300ms ก่อนเรียก loadCustomers
    - เพิ่ม cleanup effect ตอน unmount

ห้าม:
  - เปลี่ยน logic อื่นๆ ที่ไม่เกี่ยวกับ label/props/debounce
  - แก้ backend

อย่าลืม:
  - npm run typecheck + npm run lint ต้องผ่าน
