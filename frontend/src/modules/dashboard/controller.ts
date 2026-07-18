import { useState, useEffect, useCallback, useRef } from 'react';
import {
  dashboardApi,
  type DashboardSummary,
} from './model';

const AUTO_REFRESH_MS = 300_000;

interface UseDashboardReturn {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardApi.getSummary();
      setSummary(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();

    intervalRef.current = setInterval(() => {
      void fetchSummary();
    }, AUTO_REFRESH_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
