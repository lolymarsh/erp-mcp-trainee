import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import type { UserEntity, PaginationResponse } from './model';
import { GetRoleLabel } from './model';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

// ============== User List ==============

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
  onHistory: (user: UserEntity) => void;
  onCreateClick: () => void;
  onSearch: (q: string) => void;
  search: string;
}

export function UserListView({
  users,
  loading,
  error,
  pagination,
  roleFilter,
  onPageChange,
  onRoleFilterChange,
  onEdit,
  onDelete,
  onToggleActive,
  onHistory,
  onCreateClick,
  onSearch,
  search,
}: UserListViewProps) {
  const from = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalData)
    : users.length;

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">จัดการผู้ใช้งาน</h1>
        <Button onClick={onCreateClick} className="flex items-center gap-1.5">
          <UserPlus className="size-4" />
          <span>เพิ่มผู้ใช้งาน</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <Label htmlFor="user-search">ค้นหาชื่อผู้ใช้หรือชื่อที่แสดง</Label>
          <Input
            id="user-search"
            placeholder="ค้นหาชื่อผู้ใช้หรือชื่อที่แสดง..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="user-role-filter">บทบาท</Label>
          <Select
            id="user-role-filter"
            value={roleFilter ?? ''}
            onChange={(e) => onRoleFilterChange(e.target.value || null)}
          >
            <option value="">ทั้งหมด</option>
            <option value="ADMIN">{GetRoleLabel('ADMIN')}</option>
            <option value="MANAGER">{GetRoleLabel('MANAGER')}</option>
            <option value="STAFF">{GetRoleLabel('STAFF')}</option>
            <option value="TECHNICIAN">{GetRoleLabel('TECHNICIAN')}</option>
          </Select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div role="progressbar" className="flex flex-col gap-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ไม่พบข้อมูลผู้ใช้งาน
        </p>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อผู้ใช้</TableHead>
                <TableHead>ชื่อที่แสดง</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">{user.username}</TableCell>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell>{GetRoleLabel(user.role)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? 'secondary' : 'outline'}
                      className={
                        user.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit'
                          : 'text-neutral-500 flex items-center gap-1 w-fit'
                      }
                    >
                      {user.isActive ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <Ban className="size-3" />
                      )}
                      <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onHistory(user)}
                        className="h-8 text-xs px-2.5"
                      >
                        ประวัติ
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onEdit(user)}
                        className="h-8 text-xs px-2.5"
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleActive(user.id)}
                        className={`h-8 text-xs px-2.5 ${
                          user.isActive
                            ? 'text-amber-600 border-amber-300 hover:bg-amber-50'
                            : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(user)}
                        className="h-8 text-xs px-2.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        ลบ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {`${from}-${to} จาก ${pagination.totalData}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => onPageChange(pagination.page - 1)}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange(pagination.page + 1)}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============== Create Dialog ==============

interface UserCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    username: string;
    password: string;
    displayName: string;
    role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
  }) => void;
}

export function UserCreateDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  onSubmit,
}: UserCreateDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'>('STAFF');

  useEffect(() => {
    if (open) {
      setUsername('');
      setPassword('');
      setDisplayName('');
      setRole('STAFF');
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({ username, password, displayName, role });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มผู้ใช้งาน</DialogTitle>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-user-username">ชื่อผู้ใช้ *</Label>
            <Input
              id="create-user-username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!fieldErrors.username}
            />
            {fieldErrors.username && (
              <p className="text-xs text-red-500">{fieldErrors.username}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-user-password">รหัสผ่าน *</Label>
            <Input
              id="create-user-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!fieldErrors.password}
            />
            {fieldErrors.password ? (
              <p className="text-xs text-red-500">{fieldErrors.password}</p>
            ) : (
              <p className="text-[11px] text-neutral-400">อย่างน้อย 6 ตัวอักษร</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-user-displayname">ชื่อที่แสดง *</Label>
            <Input
              id="create-user-displayname"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={!!fieldErrors.displayName}
            />
            {fieldErrors.displayName && (
              <p className="text-xs text-red-500">{fieldErrors.displayName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-user-role">บทบาท *</Label>
            <Select
              id="create-user-role"
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value as 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'
                )
              }
            >
              <option value="ADMIN">{GetRoleLabel('ADMIN')}</option>
              <option value="MANAGER">{GetRoleLabel('MANAGER')}</option>
              <option value="STAFF">{GetRoleLabel('STAFF')}</option>
              <option value="TECHNICIAN">{GetRoleLabel('TECHNICIAN')}</option>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Edit Dialog ==============

interface UserEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: {
    displayName?: string;
    role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
    isActive?: boolean;
    version: number;
  } | null;
  onSubmit: (data: {
    displayName?: string;
    role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
    isActive?: boolean;
    version: number;
  }) => void;
}

export function UserEditDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  initialValues,
  onSubmit,
}: UserEditDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'>('STAFF');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (open && initialValues) {
      setDisplayName(initialValues.displayName ?? '');
      setRole(initialValues.role ?? 'STAFF');
      setVersion(initialValues.version);
    }
  }, [open, initialValues]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({ displayName, role, version });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขผู้ใช้งาน</DialogTitle>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-displayname">ชื่อที่แสดง *</Label>
            <Input
              id="edit-user-displayname"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={!!fieldErrors.displayName}
            />
            {fieldErrors.displayName && (
              <p className="text-xs text-red-500">{fieldErrors.displayName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-user-role">บทบาท *</Label>
            <Select
              id="edit-user-role"
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value as 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'
                )
              }
            >
              <option value="ADMIN">{GetRoleLabel('ADMIN')}</option>
              <option value="MANAGER">{GetRoleLabel('MANAGER')}</option>
              <option value="STAFF">{GetRoleLabel('STAFF')}</option>
              <option value="TECHNICIAN">{GetRoleLabel('TECHNICIAN')}</option>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Delete Confirm Dialog ==============

interface UserDeleteConfirmDialogProps {
  open: boolean;
  userName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UserDeleteConfirmDialog({
  open,
  userName,
  loading,
  error,
  onCancel,
  onConfirm,
}: UserDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          คุณต้องการลบผู้ใช้งาน &ldquo;{userName}&rdquo; ใช่หรือไม่?
        </p>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'ลบ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
