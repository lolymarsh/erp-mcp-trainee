# Prompt — Phase 04: Vehicle CRUD Frontend + Seed

implement phase 04 ตาม spec/2026-07-19_problems2/04_VEHICLE_FRONTEND_SEED.md

อ่าน AGENTS.md + frontend/src/modules/customer/* (model, controller, view) + router.tsx ก่อนเริ่ม

backend API พร้อมแล้ว (POST /customers/vehicles, PATCH /customers/vehicles/:id, DELETE /customers/vehicles/:id)

ตามกฎ: frontend MVC, Zod validation (optional สำหรับ vehicle form)

สิ่งที่ต้องทำ:
  frontend/src/modules/customer/model.ts:
    - customerApi เพิ่ม createVehicle, updateVehicle, deleteVehicle

  frontend/src/modules/customer/controller.ts:
    - useVehicleCreate(onSuccess) — form state + submit
    - useVehicleUpdate(onSuccess) — openWithData + pre-fill + submit
    - useVehicleDelete(onSuccess) — openWithData + confirm + submit

  frontend/src/modules/customer/view.tsx:
    - CustomerDetailViewProps เพิ่ม: onAddVehicle, onEditVehicle, onDeleteVehicle
    - CustomerDetailView: เพิ่มปุ่ม "เพิ่มรถ" ถัดจากหัวข้อ "รถที่ลงทะเบียน"
    - CustomerDetailView: เพิ่ม Edit/Delete IconButton ในแต่ละแถว vehicles
    - VehicleCreateDialog — form: ทะเบียนรถ*, ยี่ห้อ, รุ่น, ปี, ประเภทเครื่องยนต์, ประเภทเชื้อเพลิง
    - VehicleEditDialog — form เหมือน create แต่ pre-fill
    - VehicleDeleteConfirmDialog — confirm + licensePlate แสดง

  frontend/src/router.tsx:
    - CustomerDetailRoute: import + ใช้ vehicle hooks + เชื่อม dialogs

ห้าม:
  - ลบ customer CRUD ที่มีอยู่แล้ว

อย่าลืม:
  - ลอก dialog pattern จาก CustomerCreateDialog / CustomerEditDialog
  - npm run typecheck + npm run lint ต้องผ่าน
