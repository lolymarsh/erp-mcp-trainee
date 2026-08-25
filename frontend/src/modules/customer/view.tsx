import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Car,
  Loader2,
  History,
  Download,
  ArrowLeft,
} from 'lucide-react';
import type {
  CustomerEntity,
  CustomerWithVehicles,
  PaginationResponse,
  VehicleEntity,
} from './model';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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

// ============== Customer List ==============

interface CustomerListViewProps {
  customers: CustomerEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectCustomer: (customer: CustomerEntity) => void;
  onCreateClick: () => void;
  onExportCsv?: () => void;
}

export function CustomerListView({
  customers,
  loading,
  error,
  pagination,
  onSearch,
  onPageChange,
  onSelectCustomer,
  onCreateClick,
  onExportCsv,
}: CustomerListViewProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">รายชื่อลูกค้า</h1>
        <div className="flex items-center gap-2">
          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={customers.length === 0}
              className="flex items-center gap-1.5"
            >
              <Download className="size-4" />
              <span>ส่งออก CSV</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={onCreateClick}
            className="flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>เพิ่มลูกค้า</span>
          </Button>
        </div>
      </div>

      <div className="mb-4 space-y-1.5">
        <Label htmlFor="customer-search">ค้นหาชื่อหรือเบอร์โทร</Label>
        <Input
          id="customer-search"
          placeholder="ค้นหาชื่อหรือเบอร์โทร..."
          onChange={(e) => onSearch(e.target.value)}
        />
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
            <div key={i} className="grid grid-cols-3 gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ไม่พบข้อมูลลูกค้า
        </p>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>นามสกุล</TableHead>
                <TableHead>เบอร์โทร</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <TableCell className="font-medium">{customer.firstName}</TableCell>
                  <TableCell>{customer.lastName}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {`หน้า ${pagination.page} / ${pagination.totalPage || 1} (${pagination.totalData} รายการ)`}
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

// ============== Customer Detail ==============

interface CustomerDetailViewProps {
  customer: CustomerWithVehicles | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: (customer: CustomerWithVehicles) => void;
  onDelete: () => void;
  onHistory: () => void;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: VehicleEntity) => void;
  onDeleteVehicle: (vehicle: VehicleEntity) => void;
}

export function CustomerDetailView({
  customer,
  loading,
  error,
  onBack,
  onEdit,
  onDelete,
  onHistory,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
}: CustomerDetailViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12" role="progressbar">
        <Loader2 className="size-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {error}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        ไม่พบข้อมูลลูกค้า
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="size-4" />
            <span>กลับ</span>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {customer.firstName} {customer.lastName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => onEdit(customer)} className="flex items-center gap-1">
            <Edit className="size-4" />
            <span>แก้ไข</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            className="flex items-center gap-1"
          >
            <Trash2 className="size-4" />
            <span>ลบ</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onHistory}
            className="flex items-center gap-1"
          >
            <History className="size-4" />
            <span>ประวัติการแก้ไข</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">ชื่อ</span>
          <p className="font-medium text-sm">{customer.firstName}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">นามสกุล</span>
          <p className="font-medium text-sm">{customer.lastName}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">เบอร์โทร</span>
          <p className="font-medium text-sm">{customer.phone}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">อีเมล</span>
          <p className="font-medium text-sm">{customer.email || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">ที่อยู่</span>
          <p className="font-medium text-sm">{customer.address || '-'}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Car className="size-5" />
          <span>รถที่ลงทะเบียน</span>
        </h2>
        <Button size="sm" variant="outline" onClick={onAddVehicle} className="flex items-center gap-1.5">
          <Plus className="size-4" />
          <span>เพิ่มรถ</span>
        </Button>
      </div>

      {customer.vehicles.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400 border border-dashed rounded-md">
          ไม่พบข้อมูลรถ
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ทะเบียนรถ</TableHead>
              <TableHead>ยี่ห้อ</TableHead>
              <TableHead>รุ่น</TableHead>
              <TableHead>ปี</TableHead>
              <TableHead>ประเภทเครื่องยนต์</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customer.vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.licensePlate}</TableCell>
                <TableCell>{v.brand || '-'}</TableCell>
                <TableCell>{v.model || '-'}</TableCell>
                <TableCell>{v.year ?? '-'}</TableCell>
                <TableCell>{v.engineType || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditVehicle(v)}
                      title="แก้ไข"
                      className="size-8"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteVehicle(v)}
                      title="ลบ"
                      className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

// ============== Create Dialog ==============

interface CustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  }) => void;
}

export function CustomerCreateDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  onSubmit,
}: CustomerCreateDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (open) {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      firstName,
      lastName,
      phone,
      email: email || undefined,
      address: address || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
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
            <Label htmlFor="create-firstName">ชื่อ *</Label>
            <Input
              id="create-firstName"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={!!fieldErrors.firstName}
            />
            {fieldErrors.firstName && (
              <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-lastName">นามสกุล *</Label>
            <Input
              id="create-lastName"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={!!fieldErrors.lastName}
            />
            {fieldErrors.lastName && (
              <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-phone">เบอร์โทร *</Label>
            <Input
              id="create-phone"
              required
              value={phone}
              placeholder="เช่น 0812345678"
              onChange={(e) => setPhone(e.target.value)}
              error={!!fieldErrors.phone}
            />
            {fieldErrors.phone && (
              <p className="text-xs text-red-500">{fieldErrors.phone}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-email">อีเมล</Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-address">ที่อยู่</Label>
            <Textarea
              id="create-address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
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

interface CustomerEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  } | null;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  }) => void;
}

export function CustomerEditDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  initialValues,
  onSubmit,
}: CustomerEditDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (open && initialValues) {
      setFirstName(initialValues.firstName);
      setLastName(initialValues.lastName);
      setPhone(initialValues.phone);
      setEmail(initialValues.email ?? '');
      setAddress(initialValues.address ?? '');
    }
  }, [open, initialValues]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      firstName,
      lastName,
      phone,
      email: email || undefined,
      address: address || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>แก้ไขลูกค้า</DialogTitle>
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
            <Label htmlFor="edit-firstName">ชื่อ *</Label>
            <Input
              id="edit-firstName"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={!!fieldErrors.firstName}
            />
            {fieldErrors.firstName && (
              <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-lastName">นามสกุล *</Label>
            <Input
              id="edit-lastName"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={!!fieldErrors.lastName}
            />
            {fieldErrors.lastName && (
              <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">เบอร์โทร *</Label>
            <Input
              id="edit-phone"
              required
              value={phone}
              placeholder="เช่น 0812345678"
              onChange={(e) => setPhone(e.target.value)}
              error={!!fieldErrors.phone}
            />
            {fieldErrors.phone && (
              <p className="text-xs text-red-500">{fieldErrors.phone}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">อีเมล</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-address">ที่อยู่</Label>
            <Textarea
              id="edit-address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
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

interface DeleteConfirmDialogProps {
  open: boolean;
  customerName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  customerName,
  loading,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
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
          คุณต้องการลบลูกค้า "{customerName}" ใช่หรือไม่?
        </p>
        <DialogFooter className="pt-4">
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

// ============== Vehicle Create Dialog ==============

interface VehicleCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  customerId: string;
  onSubmit: (data: {
    customerId: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => void;
}

export function VehicleCreateDialog({
  open,
  onClose,
  loading,
  error,
  customerId,
  onSubmit,
}: VehicleCreateDialogProps) {
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [engineType, setEngineType] = useState('');
  const [fuelType, setFuelType] = useState('');

  useEffect(() => {
    if (open) {
      setLicensePlate('');
      setBrand('');
      setModel('');
      setYear('');
      setEngineType('');
      setFuelType('');
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      customerId,
      licensePlate,
      brand: brand || null,
      model: model || null,
      year: year || null,
      engineType: engineType || null,
      fuelType: fuelType || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มรถ</DialogTitle>
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
            <Label htmlFor="veh-plate">ทะเบียนรถ *</Label>
            <Input
              id="veh-plate"
              required
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-brand">ยี่ห้อ</Label>
            <Input
              id="veh-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-model">รุ่น</Label>
            <Input
              id="veh-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-year">ปี</Label>
            <Input
              id="veh-year"
              type="number"
              value={year}
              onChange={(e) =>
                setYear(e.target.value ? parseInt(e.target.value) : '')
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-engine">ประเภทเครื่องยนต์</Label>
            <Input
              id="veh-engine"
              value={engineType}
              onChange={(e) => setEngineType(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-fuel">ประเภทเชื้อเพลิง</Label>
            <Input
              id="veh-fuel"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            />
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
            <Button type="submit" disabled={loading || !licensePlate.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Vehicle Edit Dialog ==============

interface VehicleEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  initialValues: {
    licensePlate: string;
    brand: string;
    model: string;
    year: number | null;
    engineType: string;
    fuelType: string;
  } | null;
  onSubmit: (data: {
    licensePlate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => void;
}

export function VehicleEditDialog({
  open,
  onClose,
  loading,
  error,
  initialValues,
  onSubmit,
}: VehicleEditDialogProps) {
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [engineType, setEngineType] = useState('');
  const [fuelType, setFuelType] = useState('');

  useEffect(() => {
    if (open && initialValues) {
      setLicensePlate(initialValues.licensePlate);
      setBrand(initialValues.brand);
      setModel(initialValues.model);
      setYear(initialValues.year ?? '');
      setEngineType(initialValues.engineType);
      setFuelType(initialValues.fuelType);
    }
  }, [open, initialValues]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      licensePlate,
      brand: brand || null,
      model: model || null,
      year: year || null,
      engineType: engineType || null,
      fuelType: fuelType || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>แก้ไขรถ</DialogTitle>
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
            <Label htmlFor="veh-edit-plate">ทะเบียนรถ *</Label>
            <Input
              id="veh-edit-plate"
              required
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-edit-brand">ยี่ห้อ</Label>
            <Input
              id="veh-edit-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-edit-model">รุ่น</Label>
            <Input
              id="veh-edit-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-edit-year">ปี</Label>
            <Input
              id="veh-edit-year"
              type="number"
              value={year}
              onChange={(e) =>
                setYear(e.target.value ? parseInt(e.target.value) : '')
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-edit-engine">ประเภทเครื่องยนต์</Label>
            <Input
              id="veh-edit-engine"
              value={engineType}
              onChange={(e) => setEngineType(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="veh-edit-fuel">ประเภทเชื้อเพลิง</Label>
            <Input
              id="veh-edit-fuel"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            />
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
            <Button type="submit" disabled={loading || !licensePlate.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Vehicle Delete Confirm Dialog ==============

interface VehicleDeleteConfirmDialogProps {
  open: boolean;
  licensePlate: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function VehicleDeleteConfirmDialog({
  open,
  licensePlate,
  loading,
  error,
  onCancel,
  onConfirm,
}: VehicleDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
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
          คุณต้องการลบรถทะเบียน "{licensePlate}" ใช่หรือไม่?
        </p>
        <DialogFooter className="pt-4">
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
