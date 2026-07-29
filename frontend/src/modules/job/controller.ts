import { useState, useEffect, useCallback, useRef } from "react";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
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
import type { CustomerEntity, VehicleEntity } from "../customer/model";

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
  setJobTypeFilter: (jobType: string | null) => void;
  jobTypeFilter: string | null;
  setSearch: (search: string) => void;
  search: string;
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
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const _debouncedSearch = useDebouncedValue(search, 400);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { field: string; operator: string; value: unknown }[] =
        [];
      if (statusFilter) {
        filters.push({ field: "status", operator: "eq", value: statusFilter });
      }
      if (jobTypeFilter) {
        filters.push({
          field: "jobType",
          operator: "eq",
          value: jobTypeFilter,
        });
      }

      const filter: FilterRequest = {
        page,
        pageSize: 20,
        sortBy: "desc",
        filters,
      };
      const result = await jobApi.Filter(filter);
      setJobs(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load jobs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, jobTypeFilter]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, jobTypeFilter]);

  return {
    jobs,
    loading,
    error,
    pagination,
    refetch: fetchJobs,
    setPage,
    setStatusFilter,
    statusFilter,
    setJobTypeFilter,
    jobTypeFilter,
    setSearch,
    search,
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
      const result = await jobApi.GetById(id);
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
        await jobApi.UpdateStatus(id, {
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
      const result = await jobApi.GetTodayQueue();
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
  loadMoreCustomers: () => void;
  customerLoading: boolean;
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
  const [customerLoading, setCustomerLoading] = useState(false);

  const customerSearchTerm = useRef('');
  const customerPageRef = useRef(1);
  const customerTotalPagesRef = useRef(1);
  const customerLoadingRef = useRef(false);
  const customerDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchCustomers = useCallback(async (search: string, page: number, append: boolean) => {
    if (customerLoadingRef.current) return;
    customerLoadingRef.current = true;
    setCustomerLoading(true);
    try {
      const filters = search
        ? [{ field: 'firstName', operator: 'contains' as const, value: search }]
        : [];
      const result = await customerApi.Filter({
        page,
        pageSize: 10,
        sortBy: 'asc',
        sortName: 'firstName',
        filters,
      });
      if (append) {
        setCustomers(prev => [...prev, ...result.data]);
      } else {
        setCustomers(result.data);
      }
      customerTotalPagesRef.current = result.pagination.totalPage;
      customerPageRef.current = page;
    } catch {
      // silent
    } finally {
      customerLoadingRef.current = false;
      setCustomerLoading(false);
    }
  }, []);

  const loadVehicles = useCallback(async (id: string) => {
    try {
      const result = await customerApi.GetById(id);
      setVehicles(result.data.vehicles ?? []);
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
    customerSearchTerm.current = q;
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
    customerDebounceRef.current = setTimeout(() => {
      void searchCustomers(q, 1, false);
    }, 300);
  }, [searchCustomers]);

  const loadMoreCustomers = useCallback(() => {
    if (customerPageRef.current < customerTotalPagesRef.current && !customerLoadingRef.current) {
      void searchCustomers(customerSearchTerm.current, customerPageRef.current + 1, true);
    }
  }, [searchCustomers]);

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
      customerSearchTerm.current = '';
      customerPageRef.current = 1;
      void searchCustomers('', 1, false);
    }
  }, [open, searchCustomers]);

  useEffect(() => {
    return () => {
      if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
    };
  }, []);

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
        scheduledDate: parsed.data.scheduledDate
        ? `${parsed.data.scheduledDate}T00:00:00.000Z`
        : null,
        technicianId: parsed.data.technicianId ?? null,
        notes: parsed.data.notes ?? null,
      };
      await jobApi.Create(input);
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
    loadMoreCustomers,
    customerLoading,
    submit,
  };
}
