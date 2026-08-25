# 12 Refactor Naming Convention — Todo & Status

> **Module**: 12_refactor-naming (Go-style Naming: PascalCase Public / camelCase Private)  
> **Status**: 🟢 95% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T12.1**: Backend Entities, Schemas, Services, Repositories, Handlers refactored to Go-style (Public = PascalCase, Private = camelCase)
- [x] **T12.2**: Frontend Models & APIs refactored to Go-style (e.g. `customerApi.Filter`, `customerApi.Create`)
- [x] **T12.3**: React hooks named `useXxx` and component functions named `PascalCase`
- [x] **T12.4**: Updated `AGENTS.md` and spec documents to enforce Go-style naming rule
- [ ] **T12.5**: Audit and maintain Go-style naming consistency for all newly introduced shadcn UI components

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Verify New UI Components**:
   - ตรวจสอบว่า Component และ Helpers ที่สร้างใหม่ (เช่น `lib/utils.ts`, `components/ui/*`) ปฏิบัติตาม Naming Conventions อย่างถูกต้อง
