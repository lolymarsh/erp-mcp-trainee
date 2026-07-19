# Phase 03 — Vehicle CRUD: Backend

> **Priority**: 🔴 P0 — จำเป็นต้องมี endpoints ก่อนทำ frontend
> **Estimate**: 1 day
> **Depends on**: Nothing

---

## Problem Summary

ปัจจุบัน `vehicles` (customer_car) มีแค่ read-only ผ่าน `GET /customers/:id` — ไม่มี create/update/delete endpoints

---

## Task 3.1 — Schema: เพิ่ม validation schemas (0.15 day)

### `backend/src/modules/customer/schema.ts`

เพิ่ม:
```ts
export const createVehicleSchema = z.object({
  customerId: z.string().min(1).max(36),
  licensePlate: z.string().min(1).max(50),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  engineType: z.string().optional().nullable(),
  fuelType: z.string().optional().nullable(),
});

export const updateVehicleSchema = z.object({
  licensePlate: z.string().min(1).max(50).optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  engineType: z.string().optional().nullable(),
  fuelType: z.string().optional().nullable(),
});

export const deleteVehicleSchema = z.object({});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type DeleteVehicleInput = z.infer<typeof deleteVehicleSchema>;
```

---

## Task 3.2 — Repo: เพิ่ม vehicle CRUD (0.25 day)

### `backend/src/modules/customer/repo.ts`

เพิ่ม interface และ implement:
```ts
export interface ICustomerRepository {
  // ... existing ...
  createVehicle(data: {
    id: string;
    customerId: string;
    licensePlate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    engineType: string | null;
    fuelType: string | null;
  }): Promise<VehicleEntity>;

  updateVehicle(
    id: string,
    data: {
      licensePlate?: string;
      brand?: string | null;
      model?: string | null;
      year?: number | null;
      engineType?: string | null;
      fuelType?: string | null;
    },
  ): Promise<VehicleEntity | null>;

  deleteVehicle(id: string): Promise<boolean>;

  findVehicleById(id: string): Promise<VehicleEntity | null>;
}

// Implement
async findVehicleById(id: string): Promise<VehicleEntity | null> {
  const result = await this.db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);
  return (result[0] as VehicleEntity) ?? null;
}

async createVehicle(data: {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType: string | null;
  fuelType: string | null;
}): Promise<VehicleEntity> {
  await this.db.insert(vehicles).values(data);
  return this.findVehicleById(data.id) as Promise<VehicleEntity>;
}

async updateVehicle(
  id: string,
  data: {
    licensePlate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  },
): Promise<VehicleEntity | null> {
  await this.db
    .update(vehicles)
    .set(data)
    .where(eq(vehicles.id, id));

  return this.findVehicleById(id);
}

async deleteVehicle(id: string): Promise<boolean> {
  const result = await this.db
    .delete(vehicles)
    .where(eq(vehicles.id, id));
  return result[0].affectedRows > 0;
}
```

---

## Task 3.3 — Service: เพิ่ม business logic (0.25 day)

### `backend/src/modules/customer/service.ts`

เพิ่ม interface และ implement:
```ts
export interface ICustomerService {
  // ... existing ...
  createVehicle(input: CreateVehicleInput, userId: string, meta?: AuditMeta): Promise<VehicleResponse>;
  updateVehicle(id: string, input: UpdateVehicleInput, userId: string, meta?: AuditMeta): Promise<VehicleResponse>;
  deleteVehicle(id: string, input: DeleteVehicleInput, userId: string, meta?: AuditMeta): Promise<void>;
}

// Implement
async createVehicle(input: CreateVehicleInput, userId: string, meta?: AuditMeta): Promise<VehicleResponse> {
  const customer = await this.repo.findById(input.customerId);
  if (!customer) throw new NotFoundError('Customer not found');

  const entity = await this.repo.createVehicle({
    id: uuidv4(),
    customerId: input.customerId,
    licensePlate: input.licensePlate,
    brand: input.brand ?? null,
    model: input.model ?? null,
    year: input.year ?? null,
    engineType: input.engineType ?? null,
    fuelType: input.fuelType ?? null,
  });

  this.auditService.insertAuditLog('CREATE', 'vehicles', entity.id, userId, null, entity, meta);
  return this.toVehicleResponse(entity);
}

async updateVehicle(id: string, input: UpdateVehicleInput, userId: string, meta?: AuditMeta): Promise<VehicleResponse> {
  const existing = await this.repo.findVehicleById(id);
  if (!existing) throw new NotFoundError('Vehicle not found');

  const updated = await this.repo.updateVehicle(id, {
    licensePlate: input.licensePlate,
    brand: input.brand,
    model: input.model,
    year: input.year,
    engineType: input.engineType,
    fuelType: input.fuelType,
  });
  if (!updated) throw new NotFoundError('Vehicle not found after update');

  this.auditService.insertAuditLog('UPDATE', 'vehicles', id, userId, existing, updated, meta);
  return this.toVehicleResponse(updated);
}

async deleteVehicle(id: string, _input: DeleteVehicleInput, userId: string, meta?: AuditMeta): Promise<void> {
  const existing = await this.repo.findVehicleById(id);
  if (!existing) throw new NotFoundError('Vehicle not found');

  await this.repo.deleteVehicle(id);
  this.auditService.insertAuditLog('DELETE', 'vehicles', id, userId, existing, null, meta);
}

// Helper
private toVehicleResponse(entity: VehicleEntity): VehicleResponse {
  return {
    id: entity.id,
    customerId: entity.customerId,
    licensePlate: entity.licensePlate,
    brand: entity.brand,
    model: entity.model,
    year: entity.year,
    engineType: entity.engineType,
    fuelType: entity.fuelType,
  };
}
```

### Schema type สำหรับ VehicleResponse:
```ts
export interface VehicleResponse {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType: string | null;
  fuelType: string | null;
}
```

---

## Task 3.4 — Handler: เพิ่ม endpoints (0.2 day)

### `backend/src/modules/customer/handler.ts`

```ts
createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const input = createVehicleSchema.parse(req.body);
    const userId = req.user?.userId ?? "system";
    const meta = req.auditMeta;
    const result = await this.svc.createVehicle(input, userId, meta);
    sendSuccess(res, 201, "created", { data: result });
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message, err.details); return; }
    if (err instanceof ZodError) { sendError(res, 400, formatZodError(err)); return; }
    logger.error({ err }, "Customer createVehicle failed");
    sendError(res, 500, "Internal server error");
  }
};

updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const input = updateVehicleSchema.parse(req.body);
    const userId = req.user?.userId ?? "system";
    const meta = req.auditMeta;
    const result = await this.svc.updateVehicle(id, input, userId, meta);
    sendSuccess(res, 200, "success", { data: result });
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message, err.details); return; }
    if (err instanceof ZodError) { sendError(res, 400, formatZodError(err)); return; }
    logger.error({ err }, "Customer updateVehicle failed");
    sendError(res, 500, "Internal server error");
  }
};

deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const input = deleteVehicleSchema.parse(req.body);
    const userId = req.user?.userId ?? "system";
    const meta = req.auditMeta;
    await this.svc.deleteVehicle(id, input, userId, meta);
    sendSuccess(res, 200, "deleted");
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message, err.details); return; }
    if (err instanceof ZodError) { sendError(res, 400, formatZodError(err)); return; }
    logger.error({ err }, "Customer deleteVehicle failed");
    sendError(res, 500, "Internal server error");
  }
};
```

---

## Task 3.5 — Route: ลงทะเบียน endpoints (0.1 day)

### `backend/src/modules/customer/route.ts`

```ts
router.post("/vehicles", auth(), handler.createVehicle);
router.patch("/vehicles/:id", auth(), handler.updateVehicle);
router.delete("/vehicles/:id", auth(), handler.deleteVehicle);
```

---

## Task 3.6 — Tests (0.05 day)

เพิ่ม test cases สำหรับ vehicle CRUD ใน `customer.test.ts`:
- `POST /customers/vehicles` — create vehicle for customer
- `PATCH /customers/vehicles/:id` — update vehicle
- `DELETE /customers/vehicles/:id` — delete vehicle

---

## Phase 03 Checklist

- [x] `backend/customer/schema.ts` — เพิ่ม `createVehicleSchema`, `updateVehicleSchema`, `deleteVehicleSchema`, `VehicleResponse`
- [x] `backend/customer/repo.ts` — เพิ่ม `findVehicleById`, `createVehicle`, `updateVehicle`, `deleteVehicle`
- [x] `backend/customer/service.ts` — เพิ่ม `createVehicle`, `updateVehicle`, `deleteVehicle` (audit log)
- [x] `backend/customer/handler.ts` — เพิ่ม handlers
- [x] `backend/customer/route.ts` — เพิ่ม routes
- [x] `npm run typecheck` — pass
- [x] `npm test` — pass
