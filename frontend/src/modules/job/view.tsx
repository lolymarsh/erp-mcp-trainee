import React, { useState } from 'react';
import {
  Kanban,
  List,
  Plus,
  Loader2,
  ArrowLeft,
  History,
  X,
  AlertCircle,
} from 'lucide-react';
import type { JobResponse, JobWithLogsResponse, PaginationInfo } from './model';
import type { CustomerEntity, VehicleEntity } from '../customer/model';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Textarea } from '../../components/ui/textarea';
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

const STATUS_LABELS: Record<string, string> = {
  QUEUED: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังดำเนินการ',
  COMPLETED: 'เสร็จแล้ว',
  CANCELLED: 'ยกเลิก',
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  QUEUED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const JOB_TYPE_LABELS: Record<string, string> = {
  INSTALL: 'ติดตั้ง',
  REPAIR: 'ซ่อม',
  INSPECT: 'ตรวจสอบ',
};

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'IN_PROGRESS':
      return 'default';
    case 'COMPLETED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) {
    return '-';
  }
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface JobQueueViewProps {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  statusFilter: string | null;
  jobTypeFilter: string | null;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (status: string | null) => void;
  onJobTypeFilterChange: (jobType: string | null) => void;
  onSearch: (q: string) => void;
  search: string;
  onStatusChange: (jobId: string, newStatus: string, version: number) => void;
  statusChangeError: string | null;
  onClearStatusError: () => void;
  onRowClick: (job: JobResponse) => void;
  onCreateClick: () => void;
}

export function JobQueueView({
  jobs,
  loading,
  error,
  pagination,
  statusFilter,
  jobTypeFilter,
  onPageChange,
  onStatusFilterChange,
  onJobTypeFilterChange,
  onSearch,
  search,
  onStatusChange,
  statusChangeError,
  onClearStatusError,
  onRowClick,
  onCreateClick,
}: JobQueueViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const kanbanColumns = [
    { key: 'QUEUED', title: 'รอดำเนินการ', bg: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200' },
    { key: 'IN_PROGRESS', title: 'กำลังดำเนินการ', bg: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200' },
    { key: 'COMPLETED', title: 'เสร็จสิ้น', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200' },
  ];

  const from = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalData)
    : jobs.length;

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">คิวงาน</h1>
          <Button onClick={onCreateClick} size="sm" className="flex items-center gap-1.5">
            <Plus className="size-4" />
            <span>สร้างงาน</span>
          </Button>
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-neutral-100 dark:bg-neutral-800">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex items-center gap-1.5 h-8 px-3"
          >
            <List className="size-4" />
            <span>ตาราง</span>
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="flex items-center gap-1.5 h-8 px-3"
          >
            <Kanban className="size-4" />
            <span>Kanban</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="space-y-1">
          <Label htmlFor="job-search">ค้นหาลูกค้า</Label>
          <Input
            id="job-search"
            placeholder="ค้นหาลูกค้า..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="job-status-filter">กรองสถานะ</Label>
          <Select
            id="job-status-filter"
            value={statusFilter ?? ''}
            onChange={(e) => onStatusFilterChange(e.target.value || null)}
          >
            <option value="">ทั้งหมด</option>
            <option value="QUEUED">รอดำเนินการ</option>
            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
            <option value="COMPLETED">เสร็จแล้ว</option>
            <option value="CANCELLED">ยกเลิก</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="job-type-filter">ประเภทงาน</Label>
          <Select
            id="job-type-filter"
            value={jobTypeFilter ?? ''}
            onChange={(e) => onJobTypeFilterChange(e.target.value || null)}
          >
            <option value="">ทั้งหมด</option>
            <option value="INSTALL">ติดตั้ง</option>
            <option value="REPAIR">ซ่อม</option>
            <option value="INSPECT">ตรวจสอบ</option>
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

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {kanbanColumns.map((col) => {
            const colJobs = jobs.filter((j) => j.status === col.key);
            return (
              <div
                key={col.key}
                className={`p-4 rounded-xl border min-h-[420px] ${col.bg}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm">{col.title}</h3>
                  <Badge variant="secondary">{colJobs.length}</Badge>
                </div>
                <div className="space-y-2.5">
                  {colJobs.map((job) => {
                    const transitions = ALLOWED_TRANSITIONS[job.status] ?? [];
                    return (
                      <Card
                        key={job.id}
                        onClick={() => onRowClick(job)}
                        className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-neutral-950"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-sm">
                            {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
                          </span>
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            {STATUS_LABELS[job.status] ?? job.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500">
                          ลูกค้า: {job.customerId}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          นัดหมาย: {formatDate(job.scheduledDate)}
                        </p>
                        {transitions.length > 0 && (
                          <div
                            className="mt-2.5 flex flex-wrap gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {transitions.map((t) => (
                              <Button
                                key={t}
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2"
                                onClick={() =>
                                  onStatusChange(job.id, t, job.version)
                                }
                              >
                                ไปยัง {STATUS_LABELS[t] ?? t}
                              </Button>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                  {colJobs.length === 0 && (
                    <p className="text-xs text-neutral-400 text-center py-8">
                      ไม่มีงานในสถานะนี้
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>ประเภทงาน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่นัดหมาย</TableHead>
                <TableHead>ช่าง</TableHead>
                <TableHead>สร้างเมื่อ</TableHead>
                <TableHead className="w-36">เปลี่ยนสถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} role="progressbar">
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-neutral-500">
                    ไม่พบงาน
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const transitions = ALLOWED_TRANSITIONS[job.status] ?? [];
                  return (
                    <TableRow
                      key={job.id}
                      onClick={() => onRowClick(job)}
                      className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <TableCell className="font-medium">{job.customerId}</TableCell>
                      <TableCell>{JOB_TYPE_LABELS[job.jobType] ?? job.jobType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(job.status)}
                          className={
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ''
                          }
                        >
                          {STATUS_LABELS[job.status] ?? job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(job.scheduledDate)}</TableCell>
                      <TableCell>{job.technicianId ?? '-'}</TableCell>
                      <TableCell>{formatDate(job.createdAt)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {transitions.length > 0 ? (
                          <Select
                            value=""
                            className="h-8 text-xs"
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus) {
                                onStatusChange(job.id, newStatus, job.version);
                              }
                            }}
                          >
                            <option value="" disabled>
                              เปลี่ยน...
                            </option>
                            {transitions.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s] ?? s}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className="text-xs text-neutral-400">
                            สถานะสิ้นสุด
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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

      {statusChangeError && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{statusChangeError}</span>
          <button
            type="button"
            onClick={onClearStatusError}
            className="ml-2 hover:opacity-80"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </Card>
  );
}

// ============== Job Create Dialog ==============

interface JobCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  customers: CustomerEntity[];
  vehicles: VehicleEntity[];
  customerId: string;
  vehicleId: string;
  jobType: 'INSTALL' | 'REPAIR' | 'INSPECT';
  scheduledDate: string;
  technicianId: string;
  notes: string;
  onCustomerChange: (id: string) => void;
  onVehicleChange: (id: string) => void;
  onJobTypeChange: (t: 'INSTALL' | 'REPAIR' | 'INSPECT') => void;
  onScheduledDateChange: (d: string) => void;
  onTechnicianChange: (t: string) => void;
  onNotesChange: (n: string) => void;
  onCustomerSearch: (q: string) => void;
  customerLoading: boolean;
  onLoadMoreCustomers: () => void;
  onSubmit: () => void;
}

export function JobCreateDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  customers,
  vehicles,
  customerId,
  vehicleId,
  jobType,
  scheduledDate,
  technicianId,
  notes,
  onCustomerChange,
  onVehicleChange,
  onJobTypeChange,
  onScheduledDateChange,
  onTechnicianChange,
  onNotesChange,
  onSubmit,
}: JobCreateDialogProps) {
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างงานใหม่</DialogTitle>
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
            <Label htmlFor="create-job-cust">ลูกค้า *</Label>
            <Select
              id="create-job-cust"
              value={customerId}
              onChange={(e) => onCustomerChange(e.target.value)}
              error={!!fieldErrors.customerId}
            >
              <option value="">-- เลือกลูกค้า --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.phone})
                </option>
              ))}
            </Select>
            {fieldErrors.customerId && (
              <p className="text-xs text-red-500">{fieldErrors.customerId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-job-veh">รถ</Label>
            <Select
              id="create-job-veh"
              value={vehicleId}
              onChange={(e) => onVehicleChange(e.target.value)}
              disabled={!customerId}
              error={!!fieldErrors.vehicleId}
            >
              <option value="">-- เลือกรถ --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate}
                  {v.brand ? ` - ${v.brand}` : ''}
                  {v.model ? ` ${v.model}` : ''}
                </option>
              ))}
            </Select>
            {fieldErrors.vehicleId && (
              <p className="text-xs text-red-500">{fieldErrors.vehicleId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-job-type">ประเภทงาน *</Label>
            <Select
              id="create-job-type"
              value={jobType}
              onChange={(e) =>
                onJobTypeChange(
                  e.target.value as 'INSTALL' | 'REPAIR' | 'INSPECT'
                )
              }
              error={!!fieldErrors.jobType}
            >
              <option value="INSTALL">ติดตั้ง</option>
              <option value="REPAIR">ซ่อม</option>
              <option value="INSPECT">ตรวจสอบ</option>
            </Select>
            {fieldErrors.jobType && (
              <p className="text-xs text-red-500">{fieldErrors.jobType}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-job-date">วันที่นัดหมาย</Label>
            <Input
              id="create-job-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => onScheduledDateChange(e.target.value)}
              error={!!fieldErrors.scheduledDate}
            />
            {fieldErrors.scheduledDate && (
              <p className="text-xs text-red-500">{fieldErrors.scheduledDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-job-tech">ช่างผู้รับผิดชอบ</Label>
            <Input
              id="create-job-tech"
              value={technicianId}
              onChange={(e) => onTechnicianChange(e.target.value)}
              error={!!fieldErrors.technicianId}
            />
            {fieldErrors.technicianId && (
              <p className="text-xs text-red-500">{fieldErrors.technicianId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-job-notes">หมายเหตุ</Label>
            <Textarea
              id="create-job-notes"
              rows={3}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              error={!!fieldErrors.notes}
            />
            {fieldErrors.notes && (
              <p className="text-xs text-red-500">{fieldErrors.notes}</p>
            )}
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
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'สร้างงาน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Job Detail View ==============

interface JobDetailViewProps {
  job: JobWithLogsResponse | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onStatusChange: (newStatus: string, version: number) => void;
  onHistory: () => void;
}

export function JobDetailView({
  job,
  loading,
  error,
  onBack,
  onStatusChange,
  onHistory,
}: JobDetailViewProps) {
  const [selectedStatus, setSelectedStatus] = useState('');

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

  if (!job) {
    return (
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        ไม่พบข้อมูลงาน
      </div>
    );
  }

  const transitions = ALLOWED_TRANSITIONS[job.status] ?? [];

  const handleStatusSubmit = () => {
    if (selectedStatus) {
      onStatusChange(selectedStatus, job.version);
      setSelectedStatus('');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="size-4" />
            <span>กลับ</span>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
          </h1>
          <Badge variant={getStatusBadgeVariant(job.status)}>
            {STATUS_LABELS[job.status] ?? job.status}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onHistory}
          className="flex items-center gap-1.5"
        >
          <History className="size-4" />
          <span>ประวัติการแก้ไข</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">รหัสลูกค้า</span>
          <p className="font-medium text-sm">{job.customerId}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">รหัสรถ</span>
          <p className="text-sm">{job.vehicleId || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">วันที่นัดหมาย</span>
          <p className="text-sm">{formatDate(job.scheduledDate)}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">เวลาเริ่ม</span>
          <p className="text-sm">{formatDate(job.startTime)}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">เวลาสิ้นสุด</span>
          <p className="text-sm">{formatDate(job.endTime)}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">ช่าง</span>
          <p className="text-sm">{job.technicianId || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">หมายเหตุ</span>
          <p className="text-sm">{job.notes || '-'}</p>
        </div>
      </div>

      {transitions.length > 0 && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
          <div className="w-48">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="" disabled>
                เปลี่ยนสถานะ...
              </option>
              {transitions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </Select>
          </div>
          <Button
            size="sm"
            onClick={handleStatusSubmit}
            disabled={!selectedStatus}
          >
            ยืนยัน
          </Button>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">ประวัติสถานะ</h2>
      {job.statusLogs.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400 border border-dashed rounded-md">
          ไม่มีประวัติ
        </p>
      ) : (
        <div className="space-y-2">
          {job.statusLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(log.toStatus)}>
                  {STATUS_LABELS[log.toStatus] ?? log.toStatus}
                </Badge>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {log.fromStatus
                    ? `${STATUS_LABELS[log.fromStatus] ?? log.fromStatus} → ${STATUS_LABELS[log.toStatus] ?? log.toStatus}`
                    : `เริ่มต้น: ${STATUS_LABELS[log.toStatus] ?? log.toStatus}`}
                </span>
                <span className="text-xs text-neutral-400">
                  โดย {log.changedBy}
                </span>
                {log.note && (
                  <span className="text-xs text-neutral-500">- {log.note}</span>
                )}
              </div>
              <span className="text-xs text-neutral-400">
                {formatDate(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
