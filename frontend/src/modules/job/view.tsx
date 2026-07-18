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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
} from "@mui/material";
import type { JobResponse, PaginationInfo } from "./model";

const STATUS_COLORS: Record<string, "default" | "primary" | "success" | "error"> = {
  QUEUED: "default",
  IN_PROGRESS: "primary",
  COMPLETED: "success",
  CANCELLED: "error",
};

const STATUS_LABELS: Record<string, string> = {
  QUEUED: "Queued",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  QUEUED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const JOB_TYPE_LABELS: Record<string, string> = {
  INSTALL: "Install",
  REPAIR: "Repair",
  INSPECT: "Inspect",
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
  onPageChange: (page: number) => void;
  onStatusFilterChange: (status: string | null) => void;
  onStatusChange: (jobId: string, newStatus: string, version: number) => void;
  statusChangeError: string | null;
  onClearStatusError: () => void;
}

export function JobQueueView({
  jobs,
  loading,
  error,
  pagination,
  statusFilter,
  onPageChange,
  onStatusFilterChange,
  onStatusChange,
  statusChangeError,
  onClearStatusError,
}: JobQueueViewProps) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Job Queue</Typography>

        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter ?? ""}
            label="Status Filter"
            onChange={(e) =>
              onStatusFilterChange(e.target.value || null)
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="QUEUED">Queued</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
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
              <TableCell>Customer</TableCell>
              <TableCell>Job Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Scheduled</TableCell>
              <TableCell>Technician</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Change Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const transitions = ALLOWED_TRANSITIONS[job.status] ?? [];
                return (
                  <TableRow key={job.id} hover>
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
                    <TableCell>
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
                              Change...
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
                          Terminal
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
