# Prompt — Phase 05: Admin Users Button + Search

implement phase 05 ตาม spec/2026-07-19_problems2/05_ADMIN_USERS.md

อ่าน AGENTS.md + frontend/src/modules/user/* (controller, view) + router.tsx ก่อนเริ่ม

backend API รองรับการ filter ด้วย username (contains) อยู่แล้ว

สิ่งที่ต้องทำ:
  frontend/src/modules/user/controller.ts:
    - useUserList: เพิ่ม search state + useDebouncedValue
    - เพิ่ม filters.username ใน API call
    - reset page เมื่อ search เปลี่ยน
    - return { setSearch, search }

  frontend/src/modules/user/view.tsx:
    - UserListViewProps เพิ่ม: onSearch, search
    - header: เพิ่ม search TextField "ค้นหาชื่อผู้ใช้หรือชื่อที่แสดง"
    - "จัดการ" column: เปลี่ยน IconButtons → Buttons (ประวัติ, แก้ไข, ปิด/เปิดใช้งาน, ลบ)
    - Buttons ขนาดเล็ก size="small" variant="outlined"/"contained"
    - history button: "ประวัติ"
    - edit button: "แก้ไข" variant="contained"
    - toggle button: "ปิดใช้งาน"/"เปิดใช้งาน" color="warning"/"success"
    - delete button: "ลบ" color="error"

  frontend/src/router.tsx:
    - UserListRoute ส่ง props: onSearch={...}, search={...}

ห้าม:
  - เปลี่ยน structure ของ controller หรือ view ที่มีอยู่เดิม
  - แก้ backend

อย่าลืม:
  - npm run typecheck + npm run lint ต้องผ่าน
