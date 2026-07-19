# Prompt — Phase 02: Job Search + JobType Filter

implement phase 02 ตาม spec/2026-07-19_problems2/02_JOB_SEARCH_FILTER.md

อ่าน AGENTS.md + frontend/src/modules/job/controller.ts + frontend/src/modules/job/view.tsx + router.tsx ก่อนเริ่ม

ตามกฎ: frontend MVC, debounce pattern เหมือน customer/controller.ts

สิ่งที่ต้องทำ:
  frontend/src/modules/job/controller.ts:
    - useJobQueue: เพิ่ม search state + jobTypeFilter state + useDebouncedValue
    - รวม filters (status, jobType) ส่งไป API
    - reset page เมื่อ filter เปลี่ยน
    - return { setJobTypeFilter, jobTypeFilter, setSearch, search }

  frontend/src/modules/job/view.tsx:
    - JobQueueViewProps เพิ่ม: jobTypeFilter, onJobTypeFilterChange, onSearch, search
    - header section: เพิ่ม search TextField "ค้นหาลูกค้า" + jobType Select dropdown (ทั้งหมด/ติดตั้ง/ซ่อม/ตรวจสอบ)

  frontend/src/router.tsx:
    - JobListRoute ส่ง props ใหม่ให้ JobQueueView

ห้าม:
  - แก้ backend (backend รองรับ jobType filter อยู่แล้ว)
  - เปลี่ยน logic หลักของ useJobQueue

อย่าลืม:
  - ลอก filter pattern จาก statusFilter
  - npm run typecheck + npm run lint ต้องผ่าน
