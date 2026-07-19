# Prompt — Phase 03: Vehicle CRUD Backend

implement phase 03 ตาม spec/2026-07-19_problems2/03_VEHICLE_BACKEND.md

อ่าน AGENTS.md + backend/src/modules/customer/* (entity, schema, handler, service, repo, route) ก่อนเริ่ม

ตามกฎ:
  - R4: Unified Response Format
  - R5: TypeScript Strict
  - R6: Error Handling (NotFoundError, AppError)
  - version check: vehicles ไม่มี version column (hard delete) — ใช้แค่ findById ก่อน delete

สิ่งที่ต้องทำ:
  modules/customer/schema.ts:
    - เพิ่ม createVehicleSchema, updateVehicleSchema, deleteVehicleSchema
    - เพิ่ม VehicleResponse interface

  modules/customer/repo.ts:
    - ICustomerRepository: เพิ่ม findVehicleById, createVehicle, updateVehicle, deleteVehicle
    - implement ทั้ง 4 methods

  modules/customer/service.ts:
    - ICustomerService: เพิ่ม createVehicle, updateVehicle, deleteVehicle
    - createVehicle: check customer exist → create → audit log
    - updateVehicle: check exist → update → audit log
    - deleteVehicle: check exist → delete → audit log
    - helper toVehicleResponse

  modules/customer/handler.ts:
    - เพิ่ม createVehicle, updateVehicle, deleteVehicle handlers
    - try/catch + AppError + ZodError

  modules/customer/route.ts:
    - POST /vehicles
    - PATCH /vehicles/:id
    - DELETE /vehicles/:id

อย่าลืม:
  - import uuidv4 สำหรับ generate id
  - npm run typecheck + npm test ต้องผ่าน
