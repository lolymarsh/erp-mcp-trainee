# Prompt — Phase 08: E2E Job Full Flow + User Management

implement phase 08 ตาม spec/2026-07-19_problems/08_E2E_JOB_USER.md

อ่าน frontend/e2e/invoice.spec.ts + frontend/e2e/helpers.ts + frontend/e2e/login.spec.ts ก่อนเริ่ม

สิ่งที่ต้องทำ:

  frontend/e2e/jobs.spec.ts — สร้างใหม่:
    test 1: create job
      - login → navigate to /jobs → click "สร้างงาน"
      - select customer, select vehicle (ถ้ามี), select job type, set date, set technician
      - submit → verify job in list

    test 2: view job detail
      - login → navigate to /jobs → click first row
      - verify detail page shows status history section

    test 3: change job status
      - login → navigate to /jobs → click first row
      - change QUEUED → IN_PROGRESS → verify

  frontend/e2e/user.spec.ts — สร้างใหม่:
    test 1: list users
      - login → navigate to /admin/users
      - verify table shows users

    test 2: create user
      - login → navigate to /admin/users
      - click "เพิ่มผู้ใช้" → fill form → submit
      - verify user in list

    test 3: edit user
      - login → navigate to /admin/users
      - click edit → change role → submit

    test 4: deactivate user
      - login → navigate to /admin/users
      - click "ปิดใช้งาน" → verify chip changes

ใช้ label ไทยตามที่แก้ใน Phase 01 + 06

อย่าลืม:
  - backend + frontend ต้องรันพร้อมกันตอน test
  - npm run test:e2e ต้องผ่าน
