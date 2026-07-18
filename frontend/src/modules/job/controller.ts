import { useState, useEffect, useCallback } from "react";
import {
  jobApi,
  type JobResponse,
  type JobWithLogsResponse,
  type TodayQueueResponse,
  type FilterRequest,
  type PaginatedJobs,
} from "./model";

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
