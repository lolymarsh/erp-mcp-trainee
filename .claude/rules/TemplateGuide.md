---
trigger: always_on
description: |
  Guide for creating new modules in the Versus Thailand ERP project.
  Follow these steps exactly.
---

# Template Guide — Creating New Modules

## 1. Backend Module — Step by Step

### Step 1: Create Folder

```bash
mkdir -p backend/src/modules/{module_name}
```

### Step 2: entity.ts — DB Model

```ts
// modules/{module}/entity.ts
export interface {Module}Entity {
  id: string;
  // ... fields matching DB columns
  version: number;        // ← always include for optimistic locking
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // ← soft delete
}
```

### Step 3: schema.ts — Zod + DTOs

```ts
// Use: create schema, update schema (with version), filter schema, response DTO
import { z } from 'zod';

export const create{Module}Schema = z.object({
  name: z.string().min(1).max(255),
  // ... other required fields
});

export const update{Module}Schema = z.object({
  name: z.string().min(1).max(255).optional(),
  version: z.number().int().min(1), // ← REQUIRED
});

export interface {Module}Response {
  id: string;
  name: string;
  createdAt: string;
}
```

### Step 4: repo.ts — DB Queries

```ts
// Interface + Implementation — follow RepositoryPatterns.md
```

### Step 5: service.ts — Business Logic

```ts
// Interface + Implementation — follow ServicePatterns.md
```

### Step 6: handler.ts — HTTP Handlers

```ts
// Class with constructor injection — follow HandlerPatterns.md
```

### Step 7: route.ts — Register Routes

```ts
import { Router } from 'express';
import { {Module}Handler } from './handler';
import { authMiddleware } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validator';
import { create{Module}Schema, update{Module}Schema } from './schema';

export function register{Module}Routes(handler: {Module}Handler): Router {
  const router = Router();

  router.post('/filter', authMiddleware, handler.filter);
  router.get('/:id', authMiddleware, handler.getById);
  router.post('/', authMiddleware, validate(create{Module}Schema), handler.create);
  router.patch('/:id', authMiddleware, validate(update{Module}Schema), handler.update);
  router.delete('/:id', authMiddleware, handler.softDelete);

  return router;
}
```

### Step 8: Wire in router.ts

```ts
// backend/src/router.ts
import { {Module}Handler } from './modules/{module}/handler';
import { {Module}Service } from './modules/{module}/service';
import { {Module}Repository } from './modules/{module}/repo';
import { register{Module}Routes } from './modules/{module}/route';

// In setupRoutes():
const {module}Repo = new {Module}Repository();
const {module}Svc = new {Module}Service({module}Repo);
const {module}Handler = new {Module}Handler({module}Svc);
app.use('/api/{module_plural}', register{Module}Routes({module}Handler));
```

### Step 9: Write Tests

```ts
// modules/{module}/{module}.test.ts
// Follow TestingStandards.md — cover all CRUD + pagination + version check
```

## 2. Frontend Module — Step by Step

### Step 1: model.ts — API Calls

```ts
// modules/{module}/model.ts — NO React imports
import { api } from '../../config/api';

export interface {Module}Entity { ... }

export const {module}Api = {
  getAll: async (params) => { const { data } = await api.post('/{module}/filter', params); return data; },
  getById: async (id) => { const { data } = await api.get(`/{module}/${id}`); return data.data; },
  create: async (input) => { const { data } = await api.post('/{module}', input); return data.data; },
  update: async (id, input) => { const { data } = await api.patch(`/{module}/${id}`, input); return data.data; },
};
```

### Step 2: controller.ts — Custom Hook

```ts
// modules/{module}/controller.ts
export function use{Module}List() {
  const [items, setItems] = useState<{Module}Entity[]>([]);
  const [loading, setLoading] = useState(true);
  // ... state, fetch, pagination logic
  return { items, loading, ... };
}
```

### Step 3: view.tsx — UI Component

```tsx
// modules/{module}/view.tsx — Props only, NO API calls
interface {Module}ListViewProps {
  items: {Module}Entity[];
  loading: boolean;
  onSelect: (item: {Module}Entity) => void;
  // ...
}

export function {Module}ListView({ items, loading, onSelect }: {Module}ListViewProps) {
  // JSX only — NO useState for business data, NO useEffect with API calls
}
```

### Step 4: Wire in Router

```tsx
// router.tsx
function {Module}ListPage() {
  const { items, loading } = use{Module}List();  // controller
  return <{Module}ListView items={items} loading={loading} />; // view
}
```

## 3. Checklist Before Commit

```
[ ] entity.ts has `version`, `deletedAt`
[ ] schema.ts has `version: z.number().int().min(1)` in update schema
[ ] repo.ts update uses `WHERE version = ?`
[ ] service.ts throws `ConflictError` on version mismatch
[ ] handler.ts try/catch wraps every method
[ ] route.ts has POST /filter for list (not GET)
[ ] All list responses include pagination
[ ] Multi-table writes use db.transaction()
[ ] Tests cover CRUD + pagination + version mismatch
[ ] No `any` types, no `as` assertions
[ ] TypeScript compiles: npx tsc --noEmit
[ ] Tests pass: npm test
```
