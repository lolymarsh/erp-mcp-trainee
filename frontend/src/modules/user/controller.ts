import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import { userApi, type UserEntity, type PaginationResponse, type FilterParams } from './model';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';

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

export function useUserList() {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { field: string; operator: string; value: unknown }[] = [];
      if (roleFilter) {
        filters.push({ field: 'role', operator: 'eq', value: roleFilter });
      }
      if (debouncedSearch) {
        filters.push({ field: 'username', operator: 'contains', value: debouncedSearch });
      }
      const params: FilterParams = { page, pageSize: 20, sortBy: 'asc', sortName: 'displayName', filters };
      const result = await userApi.filter(params);
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

  return { users, loading, error, pagination, refetch: fetchUsers, setPage, setRoleFilter, roleFilter, setSearch, search };
}

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

export function useUserUpdate(onSuccess: () => void) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<UpdateUserFormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
    setEditingId(null);
  }, []);

  const openWithData = useCallback((user: UserEntity) => {
    setInitialValues({ displayName: user.displayName, role: user.role, isActive: user.isActive, version: user.version });
    setEditingId(user.id);
    setOpen(true);
  }, []);

  const submit = useCallback(async (input: UpdateUserFormData) => {
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!errMap[field]) errMap[field] = issue.message;
      }
      setFieldErrors(errMap);
      return;
    }
    if (!editingId) return;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await userApi.update(editingId, parsed.data);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        onSuccess();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update user');
      }
    } finally {
      setLoading(false);
    }
  }, [editingId, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, fieldErrors, initialValues, submit };
}

export function useUserDelete(onSuccess: () => void) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [version, setVersion] = useState(0);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setDeletingId(null);
  }, []);

  const openWithData = useCallback((user: UserEntity) => {
    setDeletingId(user.id);
    setUserName(user.displayName);
    setVersion(user.version);
    setOpen(true);
  }, []);

  const submit = useCallback(async () => {
    if (!deletingId) return;
    setLoading(true);
    setError(null);
    try {
      await userApi.softDelete(deletingId, { version });
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        onSuccess();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      }
    } finally {
      setLoading(false);
    }
  }, [deletingId, version, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, submit, userName };
}

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
