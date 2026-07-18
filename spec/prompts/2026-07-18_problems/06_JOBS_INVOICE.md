# Prompt — Phase 06: Jobs CRUD + Invoice Detail + Pagination

implement phase 06 ตาม spec/2026-07-18_problems/06_JOBS_INVOICE.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: frontend MVC, Zod validation, MUI TablePagination, version check

สิ่งที่ต้องทำ:
  frontend:
    # Jobs
    - modules/job/controller.ts: useJobCreate(onSuccess) — Zod (customerId, vehicleId?, jobType, scheduledDate?, technicianId?, notes?)
    - modules/job/view.tsx: JobCreateDialog — customer Autocomplete + vehicle Autocomplete (filter by customer) + jobType Select + scheduled date + technician + notes
    - modules/job/view.tsx: JobDetailView — job info + status badge + status logs timeline + action buttons
    - JobQueueView: add "สร้างงาน" Button
    - router.tsx: register /jobs/:id route

    # Invoice
    - modules/invoice/view.tsx: InvoiceDetailView — invoice info + items table + totals + action buttons
    - router.tsx: register /sales/invoices/:id route

    # Pagination Standardization
    - CustomerListView: replace custom <button> ก่อนหน้า/ถัดไป → MUI <TablePagination>
    - InventoryListView: same → <TablePagination>

CRITICAL — Job Create Form:
  - customer Autocomplete: load from customerApi.filter() (search only)
  - vehicle Autocomplete: filter by selected customer (ถ้า customer มี vehicles)
  - jobType: INSTALL, REPAIR, INSPECT
  - scheduled date: ใช้ TextField type="date" หรือ DatePicker

CRITICAL — MUI TablePagination:
  - component="div" (not default table footer)
  - page={pagination.page - 1} (MUI 0-indexed)
  - rowsPerPage={pagination.pageSize}
  - onPageChange={(_, newPage) => onPageChange(newPage + 1)}
  - rowsPerPageOptions={[pagination.pageSize]} (fixed — ไม่ให้เปลี่ยน)
  - count={pagination.totalData}
  - labelDisplayedRows: "{from}-{to} จาก {count}"

อย่าลืม:
  - Job status flow — ALLOWED_TRANSITIONS (state machine) ใน controller ต้องตรงกับ backend
  - Invoice detail แสดง items table (product, qty, unitPrice, lineTotal)
  - Invoice ไม่มี edit/delete — create เท่านั้นตาม spec
  - npm run typecheck — ผ่าน
