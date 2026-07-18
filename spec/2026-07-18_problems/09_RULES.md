# Phase 09 — Rules Update

> **Priority**: 🔴 P0 — Prevent future violations
> **Estimate**: 0.25 day
> **Depends on**: Nothing

---

## Task 9.1 — Update `ServicePatterns.md`

ต้องอัพเดททั้ง `.agent/rules/` และ `.claude/rules/`

### Add Section 7: Service MUST NOT Access DB Directly

```md
## 7. Service MUST NOT access DB directly

- ❌ Do NOT inject `db: MySql2Database` into service constructor
- ❌ Do NOT import `drizzle-orm` helpers (`eq`, `and`, `isNull`, `inArray`) in service
- ❌ Do NOT import schema tables (`customers`, `products`, `vehicles`) in service
- ✅ Cross-module entity validation → inject other repo interfaces (e.g., `ICustomerRepository`)
- ✅ Pre-validation logic → call `repo.findById()` / `repo.checkExists()`
- ✅ Transaction → handled by repo internally (`db.transaction()`) — service just delegates
- ✅ Exception: Chat module — AI generates dynamic SQL → raw `mysql2/promise` Pool is required
```

---

## Task 9.2 — Update `RepositoryPatterns.md`

### Add Section 10: Cross-Module Repository Queries

```md
## 10. Cross-Module Repository Queries

When a repo (or its service) needs to validate entities from other modules:

```ts
// Option A: Service injects other repo interfaces (preferred)
export class InvoiceService implements IInvoiceService {
  constructor(
    private repo: IInvoiceRepository,
    private customerRepo: ICustomerRepository,  // ✅ injected
    private inventoryRepo: IInventoryRepository, // ✅ injected
    private redis: Redis,
  ) {}
}

// Option B: Add cross-table methods to the repo interface
export interface IInvoiceRepository {
  checkCustomerActive(customerId: string): Promise<boolean>;
  getProductsByIds(ids: string[]): Promise<ProductEntity[]>;
}
```

- ✅ Prefer Option A (Service injects other repos) — cleaner separation
- ✅ Use Option B when the cross-table query is tightly coupled to the repo's domain
- ❌ Never import another module's schema/tables directly in repo or service
```

---

## Task 9.3 — Update `OpenCodeStandards.md`

### Add Service Dependencies Section

```md
## Service Dependencies

A service constructor may receive:
- ✅ Repository interfaces (same module or cross-module)
- ✅ Other Service interfaces
- ✅ Infrastructure: Redis (`ioredis`), RabbitMQ (`amqplib`)

A service constructor MUST NOT receive:
- ❌ Raw DB connection (`MySql2Database`, `Pool`, `Connection`)
- ❌ Drizzle ORM helpers (`eq`, `and`, `isNull`, `inArray`)
- ❌ Schema/DTO objects from other modules
- ❌ Express `Request`/`Response` objects

**Exception:** Chat module — uses raw `mysql2/promise` `Pool` for AI-generated dynamic SQL (not Drizzle). This is the only exception.
```

---

## Task 9.4 — Files to Update

ต้องอัพเดททั้งสอง path (`.agent/` และ `.claude/`):

| File | Path |
|------|------|
| `ServicePatterns.md` | `.agent/rules/ServicePatterns.md` |
| `ServicePatterns.md` | `.claude/rules/ServicePatterns.md` |
| `RepositoryPatterns.md` | `.agent/rules/RepositoryPatterns.md` |
| `RepositoryPatterns.md` | `.claude/rules/RepositoryPatterns.md` |
| `OpenCodeStandards.md` | `.agent/rules/OpenCodeStandards.md` |
| `OpenCodeStandards.md` | `.claude/rules/OpenCodeStandards.md` |

---

## Phase 09 Checklist

- [ ] `.agent/rules/ServicePatterns.md` — add Section 7 (no DB in service)
- [ ] `.claude/rules/ServicePatterns.md` — same
- [ ] `.agent/rules/RepositoryPatterns.md` — add Section 10 (cross-module queries)
- [ ] `.claude/rules/RepositoryPatterns.md` — same
- [ ] `.agent/rules/OpenCodeStandards.md` — add Service Dependencies section
- [ ] `.claude/rules/OpenCodeStandards.md` — same
