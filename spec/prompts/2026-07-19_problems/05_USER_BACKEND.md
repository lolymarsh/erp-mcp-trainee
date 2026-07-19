# Prompt — Phase 05: User Management Backend

implement phase 05 ตาม spec/2026-07-19_problems/05_USER_BACKEND.md

อ่าน AGENTS.md + existing modules/user/* (entity, schema, handler, service, repo, route) + modules/inventory/repo.ts (pattern สำหรับ findFiltered) ก่อนเริ่ม

ตามกฎ:
  - R1: Pagination — POST /users/filter ต้อง return { code, data, pagination }
  - R3: Version Check — PATCH/DELETE ต้องมี version + 409
  - R4: Unified Response Format
  - R5: TypeScript Strict
  - R6: Error Handling

สิ่งที่ต้องทำ:
  modules/user/schema.ts:
    - เพิ่ม updateUserSchema (displayName?, role?, isActive?, version)
    - เพิ่ม deleteUserSchema (version)
    - import filterRequestSchema จาก shared/pagination/schema

  modules/user/repo.ts:
    - IUserRepository: เพิ่ม findFiltered(input), softDelete(id, version)
    - UserRepository.findFiltered: select().from(users) + filters + orderBy + limit/offset
    - UserRepository.softDelete: update set deletedAt + version check

  modules/user/service.ts:
    - IUserService: เพิ่ม filter(), update(), softDelete(), deactivate()
    - filter: เรียก repo.findFiltered → map toResponse + build PaginationResponse
    - update: check exist → repo.update (version check) → audit log
    - softDelete: check exist → repo.softDelete (version check) → audit log
    - deactivate: toggle isActive → repo.update → audit log

  modules/user/handler.ts:
    - filter, update, softDelete, deactivate methods
    - try/catch + AppError + ZodError + sendSuccess/sendError

  modules/user/route.ts:
    - POST /users/filter (ADMIN)
    - PATCH /users/:id (ADMIN)
    - DELETE /users/:id (ADMIN)
    - PATCH /users/:id/deactivate (ADMIN)

อย่าลืม:
  - import ConflictError, NotFoundError จาก shared/errors/AppError
  - npm run typecheck + npm test ต้องผ่าน
