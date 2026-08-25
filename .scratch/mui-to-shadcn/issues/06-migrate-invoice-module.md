# 06: Migrate Invoice Module Views & Printable Template

**What to build:**
Replace all MUI components in `frontend/src/modules/invoice/view.tsx` with shadcn `Table`, `Card`, `Badge`, `Input`, `Select`, `Button`, and Lucide icons (`Receipt`, `Printer`, `Plus`, `Trash2`). Ensure invoice creation items table and printable receipt view render cleanly.

**Blocked by:** 01: Expand UI Primitives Layer (shadcn/ui & Lucide)

**Status:** ready-for-agent

- [ ] Migrate `InvoiceListView`, `InvoiceCreateView`, `InvoiceDetailView`, `InvoicePaymentUpdateDialog`
- [ ] Ensure print CSS and action work cleanly with `window.print()`
- [ ] Ensure all 27+ tests in `src/modules/invoice/` pass
