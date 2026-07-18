---
trigger: always_on
---

# API Response Patterns

## 1. Success — Single Resource

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "CUS_abc123",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "phone": "0812345678"
  }
}
```

## 2. Success — List with Pagination

```json
{
  "code": 200,
  "message": "success",
  "data": [{ ... }, { ... }],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalData": 42,
    "totalPage": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## 3. Success — Created

```json
{
  "code": 201,
  "message": "created",
  "data": { ... }
}
```

## 4. Error Responses

```json
// 400 — Validation
{ "code": 400, "message": "Validation error" }

// 401 — Unauthorized
{ "code": 401, "message": "Invalid credentials" }

// 403 — Forbidden
{ "code": 403, "message": "Permission denied" }

// 404 — Not Found
{ "code": 404, "message": "Customer not found" }

// 409 — Conflict (version mismatch)
{ "code": 409, "message": "Version mismatch — data was modified by another user" }

// 500 — Internal
{ "code": 500, "message": "Internal server error" }
```

## 5. Response Helpers

```ts
// shared/response/handler.ts
import { Response } from 'express';

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function sendSuccess(res: Response, code: number, message: string, extra?: Record<string, any>) {
  return res.status(code).json({ code, message, ...extra });
}

export function sendError(res: Response, code: number, message: string, data?: any) {
  return res.status(code).json({ code, message, ...(data ? { data } : {}) });
}

export function calculatePagination(page: number, pageSize: number, totalData: number): PaginationResponse {
  const totalPage = Math.ceil(totalData / pageSize);
  return {
    page,
    pageSize,
    totalData,
    totalPage,
    hasNextPage: page < totalPage,
    hasPreviousPage: page > 1,
  };
}
```

## 6. Pagination Request Schema

```ts
// Every filter endpoint uses this
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  sortName: z.string().optional(),
  sortBy: z.enum(['asc', 'desc']).optional(),
});

export const filterSchema = z.object({
  field: z.string().min(1).max(50),
  value: z.string().max(255).optional(),
  values: z.array(z.string()).max(100).optional(),
  greaterThan: z.number().optional(),
  lessThan: z.number().optional(),
  fromDate: z.number().optional(),
  toDate: z.number().optional(),
});

export const filterRequestSchema = paginationSchema.extend({
  filters: z.array(filterSchema).max(20).optional(),
});

export type FilterRequest = z.infer<typeof filterRequestSchema>;
```

## 7. Rules

- ✅ Every response: `{ code, message, ... }`
- ✅ List responses: include `pagination` object
- ✅ Filter endpoints: `POST /api/{resource}/filter` with body
- ❌ No plain JSON without `{ code, message }` wrapper
- ❌ No query string pagination — use POST body
