# 02 — Customer & Vehicle Management

> **Priority**: 🔴 High
> **Estimate**: 1–2 days
> **Depends on**: Phase 01 (Foundation)

---

## Overview

Customer module manages customer profiles and their registered vehicles. Each customer can have multiple vehicles. The module supports full CRUD with optimistic locking (version check), paginated filtering, soft delete, and frontend management UI with MUI DataGrid.

---

## Architecture Patterns

| Layer | Pattern | Key Points |
|-------|---------|------------|
| Backend | Go-style Domain Module | `modules/customer/` — entity, schema, handler, service, repo, route |
| Frontend | React MVC | `modules/customer/` — model.ts, controller.ts, view.tsx |
| DB | MySQL (Drizzle ORM) | 2 tables: `customers`, `vehicles` |
| Locking | Optimistic (version column) | PATCH/DELETE require `version`; mismatch → 409 |
| Pagination | POST `/filter` | `{ page, page_size, sort_name, sort_by, filters[] }` |

---

## Flow

```
User → CustomerListView (search + pagination)
         │
         ├── Click row → CustomerDetailView (info + vehicles)
         │                   │
         │                   ├── [Edit] → EditCustomerDialog (version check)
         │                   ├── [Delete] → DeleteCustomerConfirm (version check)
         │                   ├── [Add Vehicle] → VehicleCreateDialog
         │                   ├── [Edit Vehicle] → VehicleEditDialog
         │                   └── [Delete Vehicle] → VehicleDeleteConfirm
         │
         └── [Create] → CreateCustomerDialog
```

---

## Backend Tasks

### Customer CRUD

| File | Key Points |
|------|------------|
| `entity.ts` | `CustomerEntity`, `VehicleEntity` |
| `schema.ts` | `createCustomerSchema`, `updateCustomerSchema` (with version), `deleteCustomerSchema`, `CustomerResponse`, `FilterRequest` |
| `handler.ts` | `filter()`, `getById()`, `create()`, `update()`, `softDelete()` |
| `service.ts` | `ICustomerService` + `CustomerService` — CRUD + filter with pagination |
| `repo.ts` | `ICustomerRepository` + `CustomerRepository` — Drizzle queries with version check |
| `route.ts` | `POST /filter`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |

**Routes**:
```
POST   /api/customers/filter    ← { page, page_size, filters[] } → { data[], pagination }
GET    /api/customers/:id       ← single customer with vehicles
POST   /api/customers           ← create customer
PATCH  /api/customers/:id       ← update (body must include version)
DELETE /api/customers/:id       ← soft delete (body must include version)
```

**Acceptance**:
- `POST /filter` returns paginated customers with `PaginationResponse`
- `PATCH` returns 409 on version mismatch
- Vehicle data included in `GET /:id`
- Soft delete sets `deleted_at` instead of hard delete

### Vehicle CRUD

| File | Key Points |
|------|------------|
| `schema.ts` | `createVehicleSchema`, `updateVehicleSchema`, `deleteVehicleSchema`, `VehicleResponse` |
| `repo.ts` | `findVehicleById`, `createVehicle`, `updateVehicle`, `deleteVehicle` |
| `service.ts` | `createVehicle` (validates customer exists), `updateVehicle`, `deleteVehicle` (audit log) |
| `handler.ts` | `createVehicle`, `updateVehicle`, `deleteVehicle` handlers |
| `route.ts` | `POST /vehicles`, `PATCH /vehicles/:id`, `DELETE /vehicles/:id` |

**Routes**:
```
POST   /api/customers/vehicles          ← create vehicle for customer
PATCH  /api/customers/vehicles/:id      ← update vehicle
DELETE /api/customers/vehicles/:id      ← delete vehicle
```

**Acceptance**:
- `POST /api/customers/vehicles` — create vehicle, returns 404 if customer not found
- `PATCH /api/customers/vehicles/:id` — update vehicle fields
- `DELETE /api/customers/vehicles/:id` — hard delete vehicle
- Audit log recorded for all vehicle operations

---

## Frontend Tasks

### Customer Pages

| File | Key Points |
|------|------------|
| `model.ts` | `customerApi`: getAll, getById, create, update, softDelete; `CustomerEntity`, `VehicleEntity` types |
| `controller.ts` | `useCustomerList()` — pagination state, search debounce, refetch; `useCustomerDetail()` — single customer + vehicles; `useCustomerUpdate()`, `useCustomerDelete()` |
| `view.tsx` | `CustomerListView` — MUI DataGrid + search + pagination; `CustomerDetailView` — info card + vehicles table |

**Acceptance**:
- Customer list renders with MUI DataGrid
- Pagination works (next/prev page, page size)
- Search by name/phone filters results
- Click row → navigate to customer detail
- Edit customer with version check
- Soft delete with confirmation

### Vehicle CRUD Dialogs

| Component | Description |
|-----------|-------------|
| `VehicleCreateDialog` | Form: license plate*, brand, model, year, engine type, fuel type |
| `VehicleEditDialog` | Pre-filled form, same fields |
| `VehicleDeleteConfirmDialog` | Confirm + show license plate |

**Acceptance**:
- "Add Vehicle" button in `CustomerDetailView` header
- Edit/Delete icon buttons per vehicle row
- Create dialog resets on open
- Edit dialog pre-fills current values
- All dialogs show loading + error states

### Route Wiring

Wire in `frontend/src/router.tsx`:
- `VehicleCreateDialog`, `VehicleEditDialog`, `VehicleDeleteConfirmDialog` in `CustomerDetailRoute`
- Connect controller hooks (`useVehicleCreate`, `useVehicleUpdate`, `useVehicleDelete`) → refetch on success

---

## API Contract

### Unified Response Format

```ts
// Success
{ "code": 200, "message": "success", "data": { ... } }
// List with pagination
{ "code": 200, "message": "success", "data": [...], "pagination": { ... } }
// Error
{ "code": 400, "message": "error description" }
// Conflict
{ "code": 409, "message": "Version mismatch" }
```

### PaginationResponse

```ts
{
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

---

## Checklist

### Backend — Customer CRUD
- [x] `POST /api/customers/filter` → paginated response with pagination metadata
- [x] `POST /api/customers` → 201 created
- [x] `GET /api/customers/:id` → customer + vehicles
- [x] `PATCH /api/customers/:id` → 200 updated
- [x] `PATCH /api/customers/:id` (wrong version) → 409
- [x] `DELETE /api/customers/:id` → soft delete (sets deleted_at)
- [x] Integration tests for all endpoints

### Backend — Vehicle CRUD
- [x] `POST /api/customers/vehicles` → create vehicle for customer
- [x] `PATCH /api/customers/vehicles/:id` → update vehicle
- [x] `DELETE /api/customers/vehicles/:id` → delete vehicle
- [x] Audit log for create/update/delete vehicle

### Frontend
- [x] Customer list with pagination + search
- [x] Customer detail with vehicle list
- [x] Create/edit/delete customer dialogs with version
- [x] Create/edit/delete vehicle dialogs
- [x] `npm run typecheck` — pass
- [x] `npm run lint` — no new errors
