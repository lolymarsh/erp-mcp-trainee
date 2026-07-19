# Prompt — Phase 03: Job Customer Selection Overhaul

implement phase 03 ตาม spec/2026-07-19_problems/03_JOB_CUSTOMER.md

อ่าน AGENTS.md ก่อนเริ่ม
ตามกฎ: frontend MVC, debounce pattern เหมือน invoice/controller.ts

สิ่งที่ต้องทำ:
  frontend/src/modules/job/controller.ts:
    - เพิ่ม refs: customerSearchTerm, customerPageRef, customerTotalPagesRef, customerLoadingRef, customerDebounceRef
    - เพิ่ม searchCustomers(search, page, append) — paginated, ใช้ customerApi.filter, pageSize=10
    - เปลี่ยน handleCustomerSearch → debounce 300ms + reset page
    - เพิ่ม loadMoreCustomers() — infinite scroll
    - เปลี่ยน useEffect ตอนเปิด dialog: reset state + searchCustomers('',1,false)
    - เพิ่ม cleanup effect
    - return { customerLoading, loadMoreCustomers } ใน object

  frontend/src/modules/job/view.tsx:
    - JobCreateDialogProps เพิ่ม customerLoading: boolean, onLoadMoreCustomers: () => void
    - Autocomplete: เพิ่ม filterOptions={(x)=>x}, loading={customerLoading}
    - Autocomplete: เพิ่ม slotProps.listbox.onScroll → infinite scroll
    - loadVehicles fallback: result.data.vehicles ?? []

  frontend/src/router.tsx:
    - JobCreateDialog ส่ง props: customerLoading={createCtl.customerLoading}, onLoadMoreCustomers={createCtl.loadMoreCustomers}

อย่าลืม:
  - ลอก pattern จาก invoice/controller.ts (searchCustomers, loadMoreCustomers, handleCustomerSearch)
  - npm run typecheck + npm run lint ต้องผ่าน
