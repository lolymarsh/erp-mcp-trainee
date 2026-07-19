import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import {
  jobApi,
  type JobResponse,
  type JobWithLogsResponse,
  type TodayQueueResponse,
  type FilterRequest,
  type PaginatedJobs,
  type CreateJobInput,
} from "./model";
import { customerApi } from "../customer/model";
import type { CustomerEntity, VehicleEntity, FilterParams } from "../customer/model";

const createJobSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  vehicleId: z.string().optional(),
  jobType: z.enum(["INSTALL", "REPAIR", "INSPECT"]),
  scheduledDate: z.string().optional(),
  technicianId: z.string().optional(),
  notes: z.string().optional(),
});

interface UseJobQueueReturn {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedJobs["pagination"] | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setStatusFilter: (status: string | null) => void;
  statusFilter: string | null;
}

export function useJobQueue(): UseJobQueueReturn {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    PaginatedJobs["pagination"] | null
  >(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: FilterRequest = {
        page,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      };
      if (statusFilter) {
        filter.filters = [
          { field: "status", operator: "eq", value: statusFilter },
        ];
      }
      const result = await jobApi.filter(filter);
      setJobs(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load jobs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    pagination,
    refetch: fetchJobs,
    setPage,
    setStatusFilter,
    statusFilter,
  };
}

interface UseJobDetailReturn {
  job: JobWithLogsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobDetail(id: string | null): UseJobDetailReturn {
  const [job, setJob] = useState<JobWithLogsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await jobApi.getById(id);
      setJob(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load job";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchJob();
  }, [fetchJob]);

  return { job, loading, error, refetch: fetchJob };
}

interface UseStatusUpdateReturn {
  updating: boolean;
  error: string | null;
  updateStatus: (id: string, status: string, version: number) => Promise<boolean>;
  resetError: () => void;
}

export function useStatusUpdate(onSuccess?: () => void): UseStatusUpdateReturn {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);

  const updateStatus = useCallback(
    async (
      id: string,
      status: string,
      version: number,
    ): Promise<boolean> => {
      setUpdating(true);
      setError(null);
      try {
        await jobApi.updateStatus(id, {
          status: status as "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
          version,
        });
        onSuccess?.();
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update status";
        setError(message);
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [onSuccess],
  );

  return { updating, error, updateStatus, resetError };
}

interface UseTodayQueueReturn {
  queue: TodayQueueResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTodayQueue(): UseTodayQueueReturn {
  const [queue, setQueue] = useState<TodayQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await jobApi.getTodayQueue();
      setQueue(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load queue";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { queue, loading, error, refetch: fetch };
}

interface UseJobCreateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
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
  setCustomerId: (id: string) => void;
  setVehicleId: (id: string) => void;
  setJobType: (t: "INSTALL" | "REPAIR" | "INSPECT") => void;
  setScheduledDate: (d: string) => void;
  setTechnicianId: (t: string) => void;
  setNotes: (n: string) => void;
  handleCustomerSearch: (q: string) => void;
  submit: () => Promise<void>;
}

export function useJobCreate(onSuccess: () => void): UseJobCreateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [customerId, setCustomerIdState] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [jobType, setJobType] = useState<"INSTALL" | "REPAIR" | "INSPECT">("INSTALL");
  const [scheduledDate, setScheduledDate] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [notes, setNotes] = useState("");

  const [customers, setCustomers] = useState<CustomerEntity[]>([]);
  const [vehicles, setVehicles] = useState<VehicleEntity[]>([]);

  const loadCustomers = useCallback(async (search?: string) => {
    try {
      const params: FilterParams = {
        page: 1,
        pageSize: 100,
        sortName: "firstName",
        sortBy: "asc",
      };
      if (search) {
        params.filters = [{ field: "firstName", operator: "contains", value: search }];
      }
      const result = await customerApi.filter(params);
      setCustomers(result.data);
    } catch {
      setCustomers([]);
    }
  }, []);

  const loadVehicles = useCallback(async (id: string) => {
    try {
      const result = await customerApi.getById(id);
      setVehicles(result.data.vehicles);
    } catch {
      setVehicles([]);
    }
  }, []);

  const setCustomerId = useCallback((id: string) => {
    setCustomerIdState(id);
    setVehicleId("");
    if (id) {
      void loadVehicles(id);
    } else {
      setVehicles([]);
    }
  }, [loadVehicles]);

  const handleCustomerSearch = useCallback((q: string) => {
    void loadCustomers(q);
  }, [loadCustomers]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
    setCustomerIdState("");
    setVehicleId("");
    setJobType("INSTALL");
    setScheduledDate("");
    setTechnicianId("");
    setNotes("");
    setVehicles([]);
  }, []);

  useEffect(() => {
    if (open) {
      void loadCustomers();
    }
  }, [open, loadCustomers]);

  const submit = useCallback(async () => {
    const parsed = createJobSchema.safeParse({
      customerId,
      vehicleId: vehicleId || undefined,
      jobType,
      scheduledDate: scheduledDate || undefined,
      technicianId: technicianId || undefined,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!errMap[field]) {
          errMap[field] = issue.message;
        }
      }
      setFieldErrors(errMap);
      return;
    }
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const input: CreateJobInput = {
        customerId: parsed.data.customerId,
        vehicleId: parsed.data.vehicleId ?? "",
        jobType: parsed.data.jobType,
        scheduledDate: parsed.data.scheduledDate ?? null,
        technicianId: parsed.data.technicianId ?? null,
        notes: parsed.data.notes ?? null,
      };
      await jobApi.create(input);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create job";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [customerId, vehicleId, jobType, scheduledDate, technicianId, notes, onSuccess, handleClose]);

  return {
    open,
    setOpen,
    handleClose,
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
    setCustomerId,
    setVehicleId,
    setJobType,
    setScheduledDate,
    setTechnicianId,
    setNotes,
    handleCustomerSearch,
    submit,
  };
}
