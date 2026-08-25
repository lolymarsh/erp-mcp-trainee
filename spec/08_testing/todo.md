# 08 Testing & QA — Todo & Status

> **Module**: 08_testing (Unit, Integration & E2E Testing)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T8.1**: Backend Jest unit tests (421+ passing tests)
- [x] **T8.2**: Backend Supertest + Testcontainers integration test suite
- [x] **T8.3**: Frontend Vitest setup with React Testing Library
- [x] **T8.4**: Customer module test suite (22/22 tests passing)
- [x] **T8.5**: Fix remaining frontend test suites in `inventory`, `job`, and `chat`
- [x] **T8.6**: Setup and run Playwright E2E scenarios for critical paths (Auth → Customer → Invoice)
- [x] **T8.7**: Integrate test coverage thresholds (80%+ backend, 70%+ frontend) in pre-commit hooks and CI gate

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Fix Frontend Broken Tests**:
   - แก้ไข mock props และ type definitions ใน frontend unit test files ให้กลับมาผ่าน 100%
2. **Playwright E2E Run**:
   - รันและทดสอบ E2E flows จริงใน `frontend/e2e/`
