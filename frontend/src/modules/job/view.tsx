import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
} from "@mui/material";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import type { JobResponse, JobWithLogsResponse, PaginationInfo } from "./model";
import type { CustomerEntity, VehicleEntity } from "../customer/model";

const STATUS_COLORS: Record<string, "default" | "primary" | "success" | "error"> = {
  QUEUED: "default",
  IN_PROGRESS: "primary",
  COMPLETED: "success",
  CANCELLED: "error",
};

const STATUS_LABELS: Record<string, string> = {
  QUEUED: "รอดำเนินการ",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จแล้ว",
  CANCELLED: "ยกเลิก",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  QUEUED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const JOB_TYPE_LABELS: Record<string, string> = {
  INSTALL: "ติดตั้ง",
  REPAIR: "ซ่อม",
  INSPECT: "ตรวจสอบ",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) {
    return "-";
  }
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="h5">คิวงาน</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateClick}>
            สร้างงาน
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="ค้นหาลูกค้า"
          variant="outlined"
          size="small"
          sx={{ flex: 1 }}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel>กรองสถานะ</InputLabel>
          <Select
            value={statusFilter ?? ""}
            label="กรองสถานะ"
            onChange={(e) =>
              onStatusFilterChange(e.target.value || null)
            }
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            <MenuItem value="QUEUED">รอดำเนินการ</MenuItem>
            <MenuItem value="IN_PROGRESS">กำลังดำเนินการ</MenuItem>
            <MenuItem value="COMPLETED">เสร็จแล้ว</MenuItem>
            <MenuItem value="CANCELLED">ยกเลิก</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel>ประเภทงาน</InputLabel>
          <Select
            value={jobTypeFilter ?? ""}
            label="ประเภทงาน"
            onChange={(e) =>
              onJobTypeFilterChange(e.target.value || null)
            }
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            <MenuItem value="INSTALL">ติดตั้ง</MenuItem>
            <MenuItem value="REPAIR">ซ่อม</MenuItem>
            <MenuItem value="INSPECT">ตรวจสอบ</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ลูกค้า</TableCell>
              <TableCell>ประเภทงาน</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>วันที่นัดหมาย</TableCell>
              <TableCell>ช่าง</TableCell>
              <TableCell>สร้างเมื่อ</TableCell>
              <TableCell>เปลี่ยนสถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                </TableRow>
              ))
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  ไม่พบงาน
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const transitions = ALLOWED_TRANSITIONS[job.status] ?? [];
                return (
                  <TableRow key={job.id} hover sx={{ cursor: "pointer" }} onClick={() => onRowClick(job)}>
                    <TableCell>{job.customerId}</TableCell>
                    <TableCell>
                      {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[job.status] ?? job.status}
                        color={STATUS_COLORS[job.status] ?? "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(job.scheduledDate)}</TableCell>
                    <TableCell>{job.technicianId ?? "-"}</TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {transitions.length > 0 ? (
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value=""
                            displayEmpty
                            onChange={(e) => {
                              const newStatus = e.target.value as string;
                              if (newStatus) {
                                onStatusChange(job.id, newStatus, job.version);
                              }
                            }}
                          >
                            <MenuItem value="" disabled>
                              เปลี่ยน...
                            </MenuItem>
                            {transitions.map((s) => (
                              <MenuItem key={s} value={s}>
                                {STATUS_LABELS[s] ?? s}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          สถานะสิ้นสุด
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.totalData}
            page={pagination.page - 1}
            onPageChange={(_, newPage) => onPageChange(newPage + 1)}
            rowsPerPage={pagination.pageSize}
            rowsPerPageOptions={[pagination.pageSize]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        )}
      </TableContainer>

      <Snackbar
        open={statusChangeError !== null}
        autoHideDuration={6000}
        onClose={onClearStatusError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={onClearStatusError}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {statusChangeError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

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
  jobType: "INSTALL" | "REPAIR" | "INSPECT";
  scheduledDate: string;
  technicianId: string;
  notes: string;
  onCustomerChange: (id: string) => void;
  onVehicleChange: (id: string) => void;
  onJobTypeChange: (t: "INSTALL" | "REPAIR" | "INSPECT") => void;
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
  onCustomerSearch,
  customerLoading,
  onLoadMoreCustomers,
  onSubmit,
}: JobCreateDialogProps) {
  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>สร้างงานใหม่</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Autocomplete
            options={customers}
            getOptionLabel={(c) => `${c.firstName} ${c.lastName} (${c.phone})`}
            value={selectedCustomer}
            onChange={(_, val) => onCustomerChange(val?.id ?? "")}
            onInputChange={(_, val, reason) => {
              if (reason === 'input') onCustomerSearch(val);
            }}
            filterOptions={(x) => x}
            loading={customerLoading}
            slotProps={{
              listbox: {
                onScroll: (e: React.UIEvent<HTMLUListElement>) => {
                  const listbox = e.currentTarget;
                  if (listbox.scrollHeight - listbox.scrollTop - listbox.clientHeight < 50) {
                    onLoadMoreCustomers();
                  }
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ลูกค้า *"
                required
                error={!!fieldErrors.customerId}
                helperText={fieldErrors.customerId}
              />
            )}
          />
          <Autocomplete
            options={vehicles}
            getOptionLabel={(v) => `${v.licensePlate}${v.brand ? ` - ${v.brand}` : ""}${v.model ? ` ${v.model}` : ""}`}
            value={selectedVehicle}
            onChange={(_, val) => onVehicleChange(val?.id ?? "")}
            renderInput={(params) => (
              <TextField
                {...params}
                label="รถ"
                error={!!fieldErrors.vehicleId}
                helperText={fieldErrors.vehicleId}
              />
            )}
            disabled={!customerId}
          />
          <FormControl fullWidth error={!!fieldErrors.jobType}>
            <InputLabel>ประเภทงาน *</InputLabel>
            <Select
              value={jobType}
              label="ประเภทงาน *"
              onChange={(e) => onJobTypeChange(e.target.value as "INSTALL" | "REPAIR" | "INSPECT")}
            >
              <MenuItem value="INSTALL">ติดตั้ง</MenuItem>
              <MenuItem value="REPAIR">ซ่อม</MenuItem>
              <MenuItem value="INSPECT">ตรวจสอบ</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="วันที่นัดหมาย"
            type="date"
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!fieldErrors.scheduledDate}
            helperText={fieldErrors.scheduledDate}
          />
          <TextField
            label="ช่างผู้รับผิดชอบ"
            value={technicianId}
            onChange={(e) => onTechnicianChange(e.target.value)}
            error={!!fieldErrors.technicianId}
            helperText={fieldErrors.technicianId}
          />
          <TextField
            label="หมายเหตุ"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            error={!!fieldErrors.notes}
            helperText={fieldErrors.notes}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="contained" onClick={onSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "สร้างงาน"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
  const [selectedStatus, setSelectedStatus] = useState("");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!job) {
    return <Alert severity="info">ไม่พบข้อมูลงาน</Alert>;
  }

  const transitions = ALLOWED_TRANSITIONS[job.status] ?? [];

  const handleStatusSubmit = () => {
    if (selectedStatus) {
      onStatusChange(selectedStatus, job.version);
      setSelectedStatus("");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" onClick={onBack}>
            กลับ
          </Button>
          <Typography variant="h5">
            {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
          </Typography>
          <Chip
            label={STATUS_LABELS[job.status] ?? job.status}
            color={STATUS_COLORS[job.status] ?? "default"}
            size="small"
          />
        </Box>
        <Button variant="outlined" onClick={onHistory}>
          ประวัติการแก้ไข
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">รหัสลูกค้า</Typography>
          <Typography>{job.customerId}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">รหัสรถ</Typography>
          <Typography>{job.vehicleId || "-"}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">วันที่นัดหมาย</Typography>
          <Typography>{formatDate(job.scheduledDate)}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">เวลาเริ่ม</Typography>
          <Typography>{formatDate(job.startTime)}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">เวลาสิ้นสุด</Typography>
          <Typography>{formatDate(job.endTime)}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">ช่าง</Typography>
          <Typography>{job.technicianId || "-"}</Typography>
        </Box>
        <Box sx={{ gridColumn: "1 / -1" }}>
          <Typography variant="subtitle2" color="text.secondary">หมายเหตุ</Typography>
          <Typography>{job.notes || "-"}</Typography>
        </Box>
      </Box>

      {transitions.length > 0 && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedStatus}
              displayEmpty
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="" disabled>เปลี่ยนสถานะ...</MenuItem>
              {transitions.map((s) => (
                <MenuItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleStatusSubmit}
            disabled={!selectedStatus}
          >
            ยืนยัน
          </Button>
        </Box>
      )}

      <Typography variant="h6" gutterBottom>ประวัติสถานะ</Typography>
      {job.statusLogs.length === 0 ? (
        <Typography color="text.secondary">ไม่มีประวัติ</Typography>
      ) : (
        <Box>
          {job.statusLogs.map((log) => (
            <Box
              key={log.id}
              sx={{
                display: "flex",
                gap: 2,
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                alignItems: "center",
              }}
            >
              <Chip
                label={STATUS_LABELS[log.toStatus] ?? log.toStatus}
                color={STATUS_COLORS[log.toStatus] ?? "default"}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {log.fromStatus
                  ? `${STATUS_LABELS[log.fromStatus] ?? log.fromStatus} → ${STATUS_LABELS[log.toStatus] ?? log.toStatus}`
                  : `เริ่มต้น: ${STATUS_LABELS[log.toStatus] ?? log.toStatus}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                โดย {log.changedBy}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {log.note ? `- ${log.note}` : ""}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                {formatDate(log.createdAt)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
