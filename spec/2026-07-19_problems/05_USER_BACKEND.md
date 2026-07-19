# Phase 05 — User Management: Backend

> **Priority**: 🔴 P0 — ฟีเจอร์ใหม่, ต้องมีก่อนสร้าง UI
> **Estimate**: 1.5 day
> **Depends on**: Nothing

---

## Problem Summary

Backend มีแค่ `POST /auth/login`, `GET /auth/profile`, `POST /users` (create) — ขาด CRUD สำหรับจัดการผู้ใช้งาน:
- ไม่มี list/filter with pagination
- ไม่มี update (เปลี่ยน role, displayName)
- ไม่มี soft delete
- ไม่มี deactivate/activate

---

## Task 5.1 — Schema: เพิ่ม validation schemas (0.15 day)

### `backend/src/modules/user/schema.ts`
```ts
import { filterRequestSchema } from "../../shared/pagination/schema";

// filter schema (ใช้ filterRequestSchema จาก shared)

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "TECHNICIAN"]).optional(),
  isActive: z.boolean().optional(),
  version: z.number().int().min(1),
});

export const deleteUserSchema = z.object({
  version: z.number().int().min(1),
});

// Re-export filterRequestSchema for user use
export type FilterUserInput = z.infer<typeof filterRequestSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
```

---

## Task 5.2 — Repo: เพิ่ม findFiltered + softDelete (0.25 day)

### `backend/src/modules/user/repo.ts`
```ts
import { count, isNull, inArray } from "drizzle-orm";
import type { FilterRequestInput } from "../../shared/pagination/schema";

export interface IUserRepository {
  // ... existing ...
  findFiltered(input: FilterRequestInput): Promise<{ data: UserEntity[]; total: number }>;
  softDelete(id: string, version: number): Promise<boolean>;
  findAll(): Promise<UserEntity[]>;
}

export class UserRepository implements IUserRepository {
  // ... existing methods ...

  async findFiltered(input: FilterRequestInput): Promise<{ data: UserEntity[]; total: number }> {
    const conditions = [isNull(users.deletedAt)];
    // Apply filters if any
    if (input.filters) {
      for (const f of input.filters) {
        if (f.field === 'role' && f.operator === 'eq') {
          conditions.push(eq(users.role, String(f.value)));
        }
        if (f.field === 'isActive' && f.operator === 'eq') {
          conditions.push(eq(users.isActive, Boolean(f.value)));
        }
        if (f.field === 'displayName' && f.operator === 'contains') {
          conditions.push(like(users.displayName, `%${String(f.value)}%`));
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(users)
      .where(whereClause);
    const total = totalResult[0]?.count ?? 0;

    const sortFn = input.sortBy === 'asc' ? asc : desc;
    const orderClause = input.sortName === 'displayName'
      ? sortFn(users.displayName)
      : input.sortName === 'role'
        ? sortFn(users.role)
        : sortFn(users.createdAt);

    const offset = (input.page - 1) * input.pageSize;
    const rows = await this.db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(input.pageSize)
      .offset(offset);

    return { data: rows, total };
  }

  async softDelete(id: string, version: number): Promise<boolean> {
    const result = await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.version, version)));

    return result[0].affectedRows > 0;
  }
}
```

---

## Task 5.3 — Service: เพิ่ม business logic (0.5 day)

### `backend/src/modules/user/service.ts`

```ts
export interface IUserService {
  // ... existing ...
  filter(input: FilterRequestInput): Promise<{ data: UserResponse[]; pagination: PaginationResponse }>;
  update(id: string, input: UpdateUserInput, adminUserId: string, meta?: AuditMeta): Promise<UserResponse>;
  softDelete(id: string, input: DeleteUserInput, adminUserId: string, meta?: AuditMeta): Promise<void>;
  deactivate(id: string, adminUserId: string, meta?: AuditMeta): Promise<UserResponse>;
}

export class UserService implements IUserService {
  // ... existing constructor ...

  async filter(input: FilterRequestInput): Promise<{ data: UserResponse[]; pagination: PaginationResponse }> {
    const { data, total } = await this.repo.findFiltered(input);
    const totalPage = Math.ceil(total / input.pageSize);

    return {
      data: data.map(u => this.toResponse(u)),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalData: total,
        totalPage,
        hasNextPage: input.page < totalPage,
        hasPreviousPage: input.page > 1,
      },
    };
  }

  async update(id: string, input: UpdateUserInput, adminUserId: string, meta?: AuditMeta): Promise<UserResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');

    const updated = await this.repo.update(id, {
      displayName: input.displayName,
      role: input.role,
      isActive: input.isActive,
    }, input.version);

    if (!updated) throw new ConflictError('Version mismatch');

    this.auditService.insertAuditLog('UPDATE', 'users', id, adminUserId, existing, updated, meta);
    return this.toResponse(updated);
  }

  async softDelete(id: string, input: DeleteUserInput, adminUserId: string, meta?: AuditMeta): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');

    const deleted = await this.repo.softDelete(id, input.version);
    if (!deleted) throw new ConflictError('Version mismatch');

    this.auditService.insertAuditLog('DELETE', 'users', id, adminUserId, existing, null, meta);
  }

  async deactivate(id: string, adminUserId: string, meta?: AuditMeta): Promise<UserResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');

    const newStatus = !existing.isActive;
    const updated = await this.repo.update(id, { isActive: newStatus } as Partial<UserEntity>, existing.version);
    if (!updated) throw new ConflictError('Version mismatch');

    this.auditService.insertAuditLog(
      newStatus ? 'ACTIVATE' : 'DEACTIVATE',
      'users', id, adminUserId, existing, updated, meta,
    );
    return this.toResponse(updated);
  }
}
```

> **Note**: ต้อง import `PaginationResponse` type (หรือ define เอง)

---

## Task 5.4 — Handler: เพิ่ม endpoints (0.3 day)

### `backend/src/modules/user/handler.ts`

```ts
filter = async (req: Request, res: Response): Promise<void> => {
  try {
    const input = filterRequestSchema.parse(req.body);
    const result = await this.svc.filter(input);
    sendSuccess(res, 200, 'success', { data: result.data, pagination: result.pagination });
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message); return; }
    if (err instanceof ZodError) { sendError(res, 400, formatZodError(err)); return; }
    logger.error({ err }, 'User filter failed');
    sendError(res, 500, 'Internal server error');
  }
};

update = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const input = updateUserSchema.parse(req.body);
    const adminUserId = req.user?.userId ?? 'system';
    const meta = req.auditMeta;
    const user = await this.svc.update(id, input, adminUserId, meta);
    sendSuccess(res, 200, 'success', { data: user });
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message); return; }
    if (err instanceof ZodError) { sendError(res, 400, formatZodError(err)); return; }
    logger.error({ err }, 'User update failed');
    sendError(res, 500, 'Internal server error');
  }
};

softDelete = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const input = deleteUserSchema.parse(req.body);
    const adminUserId = req.user?.userId ?? 'system';
    const meta = req.auditMeta;
    await this.svc.softDelete(id, input, adminUserId, meta);
    sendSuccess(res, 200, 'deleted');
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message); return; }
    if (err instanceof ZodError) { sendError(res, 400, formatZodError(err)); return; }
    logger.error({ err }, 'User delete failed');
    sendError(res, 500, 'Internal server error');
  }
};

deactivate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const adminUserId = req.user?.userId ?? 'system';
    const meta = req.auditMeta;
    const user = await this.svc.deactivate(id, adminUserId, meta);
    sendSuccess(res, 200, 'success', { data: user });
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message); return; }
    logger.error({ err }, 'User deactivate failed');
    sendError(res, 500, 'Internal server error');
  }
};
```

---

## Task 5.5 — Route: ลงทะเบียน endpoints (0.1 day)

### `backend/src/modules/user/route.ts`
```ts
router.post("/filter", auth("ADMIN"), handler.filter);
router.patch("/:id", auth("ADMIN"), handler.update);
router.delete("/:id", auth("ADMIN"), handler.softDelete);
router.patch("/:id/deactivate", auth("ADMIN"), handler.deactivate);
```

---

## Task 5.6 — Tests (0.2 day)

เพิ่ม tests ใน `user.test.ts` หรือสร้าง `user.repo.test.ts`, `user.handler.test.ts` สำหรับ:
- `POST /users/filter` → returns list with pagination
- `PATCH /users/:id` → updates user, version conflict → 409
- `DELETE /users/:id` → soft delete, version conflict → 409
- `PATCH /users/:id/deactivate` → toggle isActive

---

## Phase 05 Checklist

- [ ] `user/schema.ts` — เพิ่ม `updateUserSchema`, `deleteUserSchema`
- [ ] `user/repo.ts` — เพิ่ม `findFiltered()` with pagination
- [ ] `user/repo.ts` — เพิ่ม `softDelete()`
- [ ] `user/service.ts` — เพิ่ม `filter()`, `update()`, `softDelete()`, `deactivate()`
- [ ] `user/handler.ts` — เพิ่ม `filter`, `update`, `softDelete`, `deactivate` methods
- [ ] `user/route.ts` — เพิ่ม routes
- [ ] `npm run typecheck` — pass
- [ ] `npm test` — all pass
- [ ] ทดสอบ manual: `POST /users/filter` → returns 200 with pagination
- [ ] ทดสอบ manual: `PATCH /users/:id` → updates + version check
- [ ] ทดสอบ manual: `DELETE /users/:id` → soft delete
- [ ] ทดสอบ manual: `PATCH /users/:id/deactivate` → toggle
