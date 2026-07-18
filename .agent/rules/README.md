# Versus Thailand ERP — Rules & Patterns

## Rules (10 files)

### 1. OpenCodeStandards.md
Core standards: error handling, handler/service/repo/repo patterns, transaction, pagination, MVC

### 2. CodingStandards.md
TypeScript strict rules, no any/no as, function length, naming conventions, imports order

### 3. ProjectStructure.md
Backend (Go-style domain modules) + Frontend (MVC) layout, file responsibilities, naming

### 4. HandlerPatterns.md
Express handler class, standard flow (validate→service→response), filter/create/update patterns

### 5. ServicePatterns.md
Service interface+impl, CRUD, filter+pagination, transaction coordination, private helpers

### 6. RepositoryPatterns.md
MySQL repo: find, filter+count, create, update with optimistic lock, soft delete, transaction, MongoDB repo

### 7. ResponsePatterns.md
Unified response format, PaginationResponse, sendSuccess/sendError helpers, filter schema

### 8. TestingStandards.md
Integration tests (Testcontainers), component tests, E2E (Playwright), coverage targets, test rules

### 9. TemplateGuide.md
Creating new backend/frontend modules step-by-step, checklist before commit

### 10. LoggingStandards.md
When to log (errors, batch ops), when NOT to log (normal CRUD, validation), logger usage

---

## Key Rules Summary

| # | Rule | Penalty |
|---|------|---------|
| 1 | Pagination: POST /filter body + return PaginationResponse | PR rejected |
| 2 | Transaction: multi-table write → db.transaction() | Data corruption |
| 3 | Version: update schema must have version, repo WHERE version=? | Lost update |
| 4 | Response: { code, message, data } always | Inconsistent API |
| 5 | No `any`: use unknown + Zod | Type safety |
| 6 | MVC: model.ts no React, view.tsx no API, controller.ts hook | Architecture violation |
| 7 | Soft delete only | Data loss |
| 8 | Test coverage: 100% CRUD endpoints | Untested code |

---

## Related Files

```
spec/plan.md             — Master plan, modules, endpoints, roadmap
spec/ARCHITECTURE.md     — Full architecture, Go→TS mapping, data flows, coding rules section 9
AGENTS.md                — Single-file summary for AI (auto-loaded by OpenCode)
docker-compose.yml       — MySQL, MongoDB, Redis, RabbitMQ
```
