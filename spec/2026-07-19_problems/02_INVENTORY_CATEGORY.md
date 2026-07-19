# Phase 02 — Inventory: Category Name + Category CRUD

> **Priority**: 🔴 P0 — UX บกพร่อง (แสดง UUID แทนชื่อ) + จัดการหมวดหมู่ไม่ได้
> **Estimate**: 1 day
> **Depends on**: Nothing

---

## Problem Summary

1. หน้า `/inventory/:id` แสดง `product.categoryId` (UUID) แทนชื่อหมวดหมู่
2. หมวดหมู่ (categories) มีแค่ read-only (`GET /categories`) — ไม่มี create/update/delete ทั้ง backend และ frontend

---

## Task 2.1 — Backend: Add categoryName to ProductResponse

### `backend/src/modules/inventory/entity.ts`
```ts
export interface ProductEntity {
  categoryName?: string;
}
```

### `backend/src/modules/inventory/schema.ts`
```ts
export interface ProductResponse {
  categoryName: string;
}
```

### `backend/src/modules/inventory/repo.ts`
```ts
// findFiltered, findById, findByIds — ทุกอันที่ return products → JOIN categories
// จาก select().from(products) → เปลี่ยนเป็น:
this.db
  .select({
    ...products,
    categoryName: categories.name,
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
```

---

## Task 2.2 — Frontend: Show categoryName

### `frontend/src/modules/inventory/model.ts`
```ts
export interface ProductEntity {
  categoryName: string;
}
```

### `frontend/src/modules/inventory/view.tsx`
```tsx
// InventoryDetailView — line 267-268
{product.categoryName}   // ← จากเดิม {product.categoryId}
```

---

## Task 2.3 — Backend: Category CRUD Endpoints

### `backend/src/modules/inventory/schema.ts`
```ts
export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  version: z.number().int().min(1),
});

export const deleteCategorySchema = z.object({
  version: z.number().int().min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
```

### `backend/src/modules/inventory/repo.ts`
```ts
export interface IInventoryRepository {
  // ... existing ...
  findCategoryById(id: string): Promise<CategoryEntity | null>;
  createCategory(data: { id: string; name: string; description: string | null }): Promise<CategoryEntity>;
  updateCategory(id: string, data: Partial<{ name: string; description: string | null }>, version: number): Promise<CategoryEntity | null>;
  deleteCategory(id: string, version: number): Promise<boolean>;
}

// Implement:
async findCategoryById(id: string): Promise<CategoryEntity | null> {
  const result = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] ?? null;
}

async createCategory(data: { id: string; name: string; description: string | null }): Promise<CategoryEntity> {
  await this.db.insert(categories).values(data);
  return this.findCategoryById(data.id) as Promise<CategoryEntity>;
}

async updateCategory(id: string, data: Partial<{ name: string; description: string | null }>, version: number): Promise<CategoryEntity | null> {
  const result = await this.db
    .update(categories)
    .set({ ...data, version: version + 1 })
    .where(and(eq(categories.id, id), eq(categories.version, version)));
  if (result[0].affectedRows === 0) return null;
  return this.findCategoryById(id);
}

async deleteCategory(id: string, version: number): Promise<boolean> {
  const result = await this.db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.version, version)));
  return result[0].affectedRows > 0;
}
```

> **Note**: `categories` ตารางไม่มี `deletedAt` — ใช้ hard delete (หรือถ้าต้องการ soft delete → เพิ่ม `deletedAt` column ก่อน)

### `backend/src/modules/inventory/service.ts`
```ts
export interface IInventoryService {
  // ... existing ...
  createCategory(input: CreateCategoryInput, userId: string, meta?: AuditMeta): Promise<CategoryResponse>;
  updateCategory(id: string, input: UpdateUserCategory, userId: string, meta?: AuditMeta): Promise<CategoryResponse>;
  deleteCategory(id: string, input: DeleteCategoryInput, userId: string, meta?: AuditMeta): Promise<void>;
}

async createCategory(input: CreateCategoryInput, userId: string, meta?: AuditMeta): Promise<CategoryResponse> {
  const entity = await this.repo.createCategory({ id: uuidv4(), name: input.name, description: input.description ?? null });
  this.auditService.insertAuditLog("CREATE", "categories", entity.id, userId, null, entity, meta);
  return { id: entity.id, name: entity.name, description: entity.description };
}

async updateCategory(id: string, input: UpdateCategoryInput, userId: string, meta?: AuditMeta): Promise<CategoryResponse> {
  const existing = await this.repo.findCategoryById(id);
  if (!existing) throw new NotFoundError("Category not found");
  const updated = await this.repo.updateCategory(id, input, input.version);
  if (!updated) throw new ConflictError("Version mismatch");
  this.auditService.insertAuditLog("UPDATE", "categories", id, userId, existing, updated, meta);
  return { id: updated.id, name: updated.name, description: updated.description };
}

async deleteCategory(id: string, input: DeleteCategoryInput, userId: string, meta?: AuditMeta): Promise<void> {
  const existing = await this.repo.findCategoryById(id);
  if (!existing) throw new NotFoundError("Category not found");
  const deleted = await this.repo.deleteCategory(id, input.version);
  if (!deleted) throw new ConflictError("Version mismatch");
  this.auditService.insertAuditLog("DELETE", "categories", id, userId, existing, null, meta);
}
```

### `backend/src/modules/inventory/handler.ts`
```ts
createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const input = createCategorySchema.parse(req.body);
    const result = await this.svc.createCategory(input, req.user?.userId ?? "system", req.auditMeta);
    sendSuccess(res, 201, "created", { data: result });
  } catch (err) { /* ... */ }
};

updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const input = updateCategorySchema.parse(req.body);
    const result = await this.svc.updateCategory(id, input, req.user?.userId ?? "system", req.auditMeta);
    sendSuccess(res, 200, "success", { data: result });
  } catch (err) { /* ... */ }
};

deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const input = deleteCategorySchema.parse(req.body);
    await this.svc.deleteCategory(id, input, req.user?.userId ?? "system", req.auditMeta);
    sendSuccess(res, 200, "deleted");
  } catch (err) { /* ... */ }
};
```

### `backend/src/modules/inventory/route.ts`
```ts
router.post("/categories", auth(), handler.createCategory);
router.patch("/categories/:id", auth(), handler.updateCategory);
router.delete("/categories/:id", auth(), handler.deleteCategory);
```

---

## Task 2.4 — Frontend: Category Management UI

### `frontend/src/modules/inventory/model.ts`

เพิ่ม API calls:
```ts
export const inventoryApi = {
  // ... existing ...
  createCategory: async (input: { name: string; description?: string | null }): Promise<{...}> => {
    const { data } = await api.post('/inventory/categories', input);
    return data;
  },
  updateCategory: async (id: string, input: { name?: string; description?: string | null; version: number }): Promise<{...}> => {
    const { data } = await api.patch(`/inventory/categories/${id}`, input);
    return data;
  },
  deleteCategory: async (id: string, input: { version: number }): Promise<{...}> => {
    const { data } = await api.delete(`/inventory/categories/${id}`, { data: input });
    return data;
  },
};
```

### `frontend/src/modules/inventory/controller.ts`

เพิ่ม hooks:
- `useCategoryList()` — fetch categories + refetch
- `useCategoryCreate(onSuccess)` — Zod schema + API call
- `useCategoryUpdate(onSuccess)` — pre-fill + version
- `useCategoryDelete(onSuccess)` — confirmation + version

### `frontend/src/modules/inventory/view.tsx`

เพิ่ม components:
- `CategoryManageDialog` — Dialog ที่มีตาราง categories + ปุ่มเพิ่ม/แก้ไข/ลบ
  - เปิดจากปุ่ม "จัดการหมวดหมู่" ใน InventoryListView header
  - แสดงรายการ categories ในตาราง
  - ปุ่ม "เพิ่มหมวดหมู่" → `CategoryCreateDialog`
  - ปุ่มแก้ไข → `CategoryEditDialog`
  - ปุ่มลบ → confirm

- `CategoryCreateDialog` — form: ชื่อหมวดหมู่*, คำอธิบาย

- `CategoryEditDialog` — form: ชื่อหมวดหมู่*, คำอธิบาย, pre-filled

- `CategoryDeleteConfirmDialog` — confirm + version

### `frontend/src/modules/inventory/view.tsx` — InventoryListView

เพิ่มปุ่มใน header:
```tsx
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography variant="h5">คลังสินค้า</Typography>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Button variant="outlined" onClick={onManageCategoriesClick}>
      จัดการหมวดหมู่
    </Button>
    <Button variant="contained" onClick={onCreateClick}>
      เพิ่มสินค้า
    </Button>
  </Box>
</Box>
```

### `frontend/src/router.tsx`

เพิ่ม state + dialog ใน `InventoryListRoute`:
```tsx
const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
const createCategoryCtl = useCategoryCreate(() => { refetchCategories(); });
// ...
<CategoryManageDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} ... />
```

---

## Task 2.5 — เพิ่ม version column ใน categories table

ปัจจุบัน `categories` ตารางอาจไม่มี `version` column — ถ้าไม่มี ต้องเพิ่มก่อน:

**Migration** หรือแก้ schema:
```sql
ALTER TABLE categories ADD COLUMN version INT NOT NULL DEFAULT 1;
```

และอัปเดท seed ที่มีอยู่ให้มี `version: 1`

---

## Phase 02 Checklist

### Task 2.1 — Backend: categoryName in ProductResponse
- [x] `backend/inventory/entity.ts` — เพิ่ม `categoryName?: string`
- [x] `backend/inventory/schema.ts` — เพิ่ม `categoryName` ใน `ProductResponse`
- [x] `backend/inventory/repo.ts` — `findFiltered`/`findById`/`findByIds`/`findBySku` JOIN categories → `categoryName`
- [x] `backend/inventory/service.ts` — `toProductResponse` รวม `categoryName`

### Task 2.2 — Frontend: Show categoryName
- [x] `frontend/inventory/model.ts` — เพิ่ม `categoryName` ใน `ProductEntity`
- [x] `frontend/inventory/view.tsx` — `InventoryDetailView` ใช้ `product.categoryName` แทน UUID (`product.categoryId` fallback)

### Task 2.3 — Backend: Category CRUD Endpoints
- [x] `backend/inventory/schema.ts` — `createCategorySchema`, `updateCategorySchema`, `deleteCategorySchema`
- [x] `backend/inventory/repo.ts` — `findCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`
- [x] `backend/inventory/service.ts` — `createCategory`, `updateCategory`, `deleteCategory` (audit log + version check)
- [x] `backend/inventory/handler.ts` — `createCategory`, `updateCategory`, `deleteCategory` handlers
- [x] `backend/inventory/route.ts` — `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`

### Task 2.4 — Frontend: Category Management UI
- [x] `frontend/inventory/model.ts` — `createCategory`, `updateCategory`, `deleteCategory` + `filterCategories` API calls
- [x] `frontend/inventory/controller.ts` — `useCategoryList` (pagination + search debounce), `useCategoryCreate`, `useCategoryUpdate`, `useCategoryDelete`
- [x] `frontend/inventory/view.tsx` — `CategoryManageView` (full page) + `CategoryCreateDialog` + `CategoryEditDialog` + `CategoryDeleteConfirmDialog`
- [x] `frontend/inventory/view.tsx` — `InventoryListView` เพิ่มปุ่ม "จัดการหมวดหมู่" → navigate `/inventory/categories`
- [x] `frontend/router.tsx` — `/inventory/categories` route (before `inventory/:id`) + `InventoryCategoryRoute` component

### Task 2.5 — version column
- [x] `backend/config/schema.ts` — เพิ่ม `version` column ใน Drizzle schema
- [x] `backend/drizzle/0001_add_version_to_categories.sql` — migration SQL
- [ ] **⚠️ ต้องรัน migration: `ALTER TABLE categories ADD COLUMN version INT NOT NULL DEFAULT 1;`**

### เพิ่มเติม (ตาม user feedback)
- [x] Pagination + search สำหรับ category list (`POST /categories/filter`)
- [x] `backend/inventory/route.ts` — `POST /categories/filter`
- [x] `frontend/inventory/view.tsx` — `CategoryManageView` (เปลี่ยนจาก Dialog → Paper full page)
- [x] `frontend/inventory/view.tsx` — ปุ่ม "ประวัติ" ต่อแถว → `AuditLogDialog` (`tableName="categories"`)
- [x] `frontend/router.tsx` — `AuditLogDialog` เชื่อมกับ `InventoryCategoryRoute`

### Verification
- [x] `npm run typecheck` (backend + frontend) — pass
- [x] `npm test` (backend) — 43 suites, 402 tests — pass
- [ ] ทดสอบ manual: รัน migration → สร้างหมวดหมู่ → แก้ไข → ลบ → ดูประวัติ → เห็นผลใน product create/edit dialog
