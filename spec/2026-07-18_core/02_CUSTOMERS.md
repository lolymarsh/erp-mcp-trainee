# Phase 02 — Customers + Vehicles (CRM)

> **Priority**: 🔴 High
> **Estimate**: 1-2 days
> **Depends on**: Phase 01 (Foundation)

---

## Task 2.1 — Customer Backend (1 day)

**Files**: `backend/src/modules/customer/`

| File | Key Points |
|------|-----------|
| `entity.ts` | CustomerEntity, VehicleEntity |
| `schema.ts` | createCustomer, updateCustomer (with version), CustomerResponse, FilterRequest |
| `handler.ts` | filter(), getById(), create(), update(), softDelete() |
| `service.ts` | ICustomerService + CustomerService — CRUD + filter with pagination |
| `repo.ts` | ICustomerRepository + CustomerRepository — Drizzle queries with version check |
| `route.ts` | POST /filter, GET /:id, POST /, PATCH /:id, DELETE /:id |

**Routes**:
```
POST   /api/customers/filter    ← body: { page, page_size, filters[] } → { data[], pagination }
GET    /api/customers/:id       ← single customer with vehicles
POST   /api/customers           ← create customer
PATCH  /api/customers/:id       ← update (body must include version)
DELETE /api/customers/:id       ← soft delete (body must include version)
```

**Acceptance**:
- POST /filter returns paginated customers
- PATCH returns 409 on version mismatch
- Vehicle data included in GET /:id

---

## Task 2.2 — Customer Frontend (1 day)

**Files**: `frontend/src/modules/customer/`

| File | Key Points |
|------|-----------|
| `model.ts` | customerApi: getAll, getById, create, update, CustomerEntity |
| `controller.ts` | useCustomerList() — pagination state, search, refetch |
| `view.tsx` | CustomerListView — MUI DataGrid + search + pagination |

**Acceptance**:
- Customer list renders with MUI DataGrid
- Pagination works (next/prev page)
- Search by name/phone filters results
- Click row → navigate to detail (Phase 02b or later)

---

## Phase 02 Checklist

```
[x] POST /api/customers/filter → paginated response
[x] POST /api/customers → 201 created
[x] GET /api/customers/:id → customer + vehicles
[x] PATCH /api/customers/:id → 200 updated
[x] PATCH /api/customers/:id (wrong version) → 409
[x] DELETE /api/customers/:id → soft delete
[x] Frontend: customer list with pagination + search
[ ] Integration tests for all endpoints
[ ] Component tests for CustomerListView
```

> **Next**: Phase 03 — Inventory
