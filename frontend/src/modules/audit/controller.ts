import { useState, useCallback } from 'react';
import { auditApi } from './model';
import type { AuditLogDetailResponse, AuditLogResponse, PaginationResponse } from './model';

export interface UseAuditHistoryReturn {
  logs: AuditLogDetailResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAuditHistory(
  tableName: string,
  recordId: string,
): UseAuditHistoryReturn {
  const [logs, setLogs] = useState<AuditLogDetailResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!tableName || !recordId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await auditApi.GetDetail(tableName, recordId);
      setLogs(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load audit history';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tableName, recordId]);

  return { logs, loading, error, refetch: fetchLogs };
}

export interface UseAuditLogListReturn {
  logs: AuditLogResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  setPage: (page: number) => void;
  refetch: () => void;
}

export function useAuditLogList(): UseAuditLogListReturn {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditApi.Filter({ page, pageSize: 20 });
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  return { logs, loading, error, pagination, setPage, refetch: fetchLogs };
}
