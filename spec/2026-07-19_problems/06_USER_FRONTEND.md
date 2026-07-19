# Phase 06 — User Management: Frontend

> **Priority**: 🔴 P0 — ฟีเจอร์ใหม่ ต้องมี UI
> **Estimate**: 1.5 day
> **Depends on**: Phase 05 (User Backend)

---

## Overview

สร้าง `frontend/src/modules/user/` ใหม่ — model, controller, view สำหรับ User Management

---

## Task 6.1 — model.ts (0.2 day)

### `frontend/src/modules/user/model.ts`

```ts
import { api } from '../../config/api';

export interface UserEntity {
  id: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
  isActive: boolean;
  version: number;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  displayName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
}

export interface UpdateUserInput {
  displayName?: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
  isActive?: boolean;
  version: number;
}

export interface DeleteUserInput {
  version: number;
}

export interface FilterParams {
  page: number;
  pageSize: number;
  sortName?: string;
  sortBy?: 'asc' | 'desc';
  filters?: { field: string; operator: string; value: unknown }[];
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  STAFF: 'พนักงาน',
  TECHNICIAN: 'ช่าง',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export const userApi = {
  filter: async (params: FilterParams): Promise<{
    code: number; message: string; data: UserEntity[]; pagination: PaginationResponse;
  }> => {
    const { data } = await api.post('/users/filter', params);
    return data;
  },

  create: async (input: CreateUserInput): Promise<{
    code: number; message: string; data: UserEntity;
  }> => {
    const { data } = await api.post('/users', input);
    return data;
  },

  update: async (id: string, input: UpdateUserInput): Promise<{
    code: number; message: string; data: UserEntity;
  }> => {
    const { data } = await api.patch(`/users/${id}`, input);
    return data;
  },

  softDelete: async (id: string, input: DeleteUserInput): Promise<{
    code: number; message: string;
  }> => {
    const { data } = await api.delete(`/users/${id}`, { data: input });
    return data;
  },

  deactivate: async (id: string): Promise<{
    code: number; message: string; data: UserEntity;
  }> => {
    const { data } = await api.patch(`/users/${id}/deactivate`);
    return data;
  },
};
```

---

## Task 6.2 — controller.ts (0.4 day)

### `frontend/src/modules/user/controller.ts`

```ts
import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { userApi, type UserEntity, type PaginationResponse, type FilterParams } from './model';

const createUserSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว'),
  displayName: z.string().min(1, 'กรุณากรอกชื่อที่แสดง'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN']),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1, 'กรุณากรอกชื่อที่แสดง').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN']).optional(),
  isActive: z.boolean().optional(),
  version: z.number().int().min(1),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// useUserList
export function useUserList() {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FilterParams = { page, pageSize: 20, sortBy: 'asc', sortName: 'displayName' };
      if (roleFilter) {
        params.filters = [{ field: 'role', operator: 'eq', value: roleFilter }];
      }
      const result = await userApi.filter(params);
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, error, pagination, refetch: fetchUsers, setPage, setRoleFilter, roleFilter };
}

// useUserCreate
export function useUserCreate(onSuccess: () => void) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => { setOpen(false); setError(null); setFieldErrors({}); }, []);

  const submit = useCallback(async (input: CreateUserFormData) => {
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!errMap[field]) errMap[field] = issue.message;
      }
      setFieldErrors(errMap);
      return;
    }
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await userApi.create(parsed.data);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, fieldErrors, submit };
}

// useUserUpdate
export function useUserUpdate(id: string, onSuccess: () => void) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<UpdateUserFormData | null>(null);

  const handleClose = useCallback(() => { setOpen(false); setError(null); setFieldErrors({}); }, []);
  const openWithData = useCallback((user: UserEntity) => {
    setInitialValues({ displayName: user.displayName, role: user.role, isActive: user.isActive, version: user.version });
    setOpen(true);
  }, []);

  const submit = useCallback(async (input: UpdateUserFormData) => {
    if (!input.version) return;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await userApi.update(id, input);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }, [id, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, fieldErrors, initialValues, submit };
}

// useUserDelete
export function useUserDelete(id: string, onSuccess: () => void) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => { setOpen(false); setError(null); }, []);

  const submit = useCallback(async (version: number) => {
    setLoading(true);
    setError(null);
    try {
      await userApi.softDelete(id, { version });
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  }, [id, onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, submit };
}

// useUserToggleActive
export function useUserToggleActive(onSuccess: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await userApi.deactivate(id);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle user status');
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { toggle, loading, error };
}
```

---

## Task 6.3 — view.tsx (0.5 day)

### `frontend/src/modules/user/view.tsx`

Components:
- `UserListView` — ตาราง: username, displayName, role (ไทย), isActive (chip), actions (edit, delete, deactivate)
- `UserCreateDialog` — form: username, password, displayName, role
- `UserEditDialog` — form: displayName, role (username ไม่แก้, password ไม่แก้)
- `UserDeleteConfirmDialog` — confirm deletion

```tsx
// UserListView — main component
interface UserListViewProps {
  users: UserEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  roleFilter: string | null;
  onPageChange: (page: number) => void;
  onRoleFilterChange: (role: string | null) => void;
  onEdit: (user: UserEntity) => void;
  onDelete: (user: UserEntity) => void;
  onToggleActive: (id: string) => void;
  onCreateClick: () => void;
}

// Table columns: ชื่อผู้ใช้, ชื่อที่แสดง, บทบาท, สถานะ, จัดการ
// Role filter: Select dropdown (ทั้งหมด, ADMIN, MANAGER, STAFF, TECHNICIAN)
// Pagination: TablePagination
// Actions: Edit button, Deactivate/Activate toggle, Delete button
// ทุก label เป็นภาษาไทย
```

---

## Task 6.4 — Router (0.2 day)

### `frontend/src/router.tsx`

เพิ่ม route:
```tsx
import { UserListView, UserCreateDialog, UserEditDialog, UserDeleteConfirmDialog } from './modules/user/view';
import { useUserList, useUserCreate, useUserUpdate, useUserDelete, useUserToggleActive } from './modules/user/controller';

function UserListRoute() {
  // ... similar pattern to CustomerListRoute
  const { users, loading, error, pagination, setPage, setRoleFilter, roleFilter, refetch } = useUserList();
  const createCtl = useUserCreate(refetch);
  const updateCtl = useUserUpdate(selectedUserId, refetch);
  const deleteCtl = useUserDelete(selectedUserId, refetch);
  const toggleCtl = useUserToggleActive(refetch);
  // ...
}

// ใน router:
{ path: 'admin/users', element: <UserListRoute /> }
```

---

## Task 6.5 — Sidebar/Navigation (0.1 day)

ถ้า Layout มี sidebar navigation → เพิ่ม link:
```
"จัดการผู้ใช้งาน" → /admin/users
```
เฉพาะ Admin เท่านั้น

---

## Task 6.6 — Tests (0.1 day)

สร้าง `frontend/src/modules/user/user.test.ts`:
- `userApi.filter` — sends POST to /users/filter
- `userApi.create` — sends POST to /users
- `userApi.update` — sends PATCH to /users/:id
- `userApi.softDelete` — sends DELETE to /users/:id
- `userApi.deactivate` — sends PATCH to /users/:id/deactivate

---

## Phase 06 Checklist

- [ ] `frontend/src/modules/user/model.ts` — interfaces + API calls
- [ ] `frontend/src/modules/user/controller.ts` — hooks (list, create, update, delete, toggleActive)
- [ ] `frontend/src/modules/user/view.tsx` — UserListView, UserCreateDialog, UserEditDialog, UserDeleteConfirmDialog
- [ ] `router.tsx` — เพิ่ม route `/admin/users`
- [ ] Layout sidebar — เพิ่ม link (Admin only)
- [ ] ทุก label เป็นภาษาไทย
- [ ] `npm run typecheck` — pass
- [ ] `npm run lint` — no new errors
- [ ] ทดสอบ manual: Login as admin → /admin/users → list, create, edit, deactivate, delete
