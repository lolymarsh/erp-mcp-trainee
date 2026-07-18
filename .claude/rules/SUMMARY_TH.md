# Versus Thailand ERP — กฎการเขียนโค้ด (ภาษาไทย)

## 📁 โครงสร้างโปรเจกต์

```
backend/src/modules/{module}/
  entity.ts   ← DB model
  schema.ts   ← Zod validate + DTO
  handler.ts  ← Express handler
  service.ts  ← Business logic
  repo.ts     ← DB queries
  route.ts    ← Router

frontend/src/modules/{module}/
  model.ts    ← API calls (ห้าม import React)
  view.tsx    ← UI component (props only, ห้าม call API)
  controller.ts ← useXxx() hook
```

## 🚫 ห้ามละเมิด

### 1. Pagination — ทุก List ต้องมี
- ใช้ POST /api/{resource}/filter — ส่ง body { page, page_size, filters }
- Response ต้องมี pagination: { page, pageSize, totalData, totalPage, hasNextPage, hasPreviousPage }

### 2. Transaction — ทุก Multi-Table Write
- Invoice + items + stock → ต้องอยู่ใน db.transaction()
- อ่านก่อนเขียนใน transaction → ต้อง .for('update') lock row

### 3. Version Check — ทุก PATCH/PUT
- Schema ต้องมี `version: z.number().int().min(1)`
- Repo: WHERE id=? AND version=?
- Version mismatch → return 409 Conflict

### 4. Response Format
```json
{ "code": 200, "message": "success", "data": {...} }
{ "code": 200, "message": "success", "data": [...], "pagination": {...} }
{ "code": 400, "message": "error message" }
```

### 5. TypeScript
- ❌ any → ใช้ unknown + Zod
- ❌ as → ใช้ Zod parse
- ✅ ทุกฟังก์ชันมี return type

### 6. Frontend MVC
- model.ts → ไม่มี React import
- view.tsx → ไม่มี API call, รับ props อย่างเดียว
- controller.ts → useXxx() hook

## 🧪 Testing

```
backend:  npm test              (Jest + Supertest + Testcontainers)
frontend: npm test              (Vitest + RTL)
e2e:      npm run test:e2e      (Playwright)
```

ทุก CRUD endpoint ต้องมี test, ทุก PATCH/PUT ต้อง test version mismatch

## 🔄 Flow การทำงาน

```
1. docker compose up -d
2. npm test (ensure infra works)
3. เลือก module → implement backend ก่อน
4. npm test (verify backend)
5. implement frontend
6. npm test (verify frontend)
7. jj describe -m "feat: {module}"
8. ไป module ต่อไป
```
