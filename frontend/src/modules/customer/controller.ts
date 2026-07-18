import { useState, useEffect, useCallback } from 'react';
import type { CustomerEntity, PaginationResponse, FilterParams } from './model';
import { customerApi } from './model';

interface UseCustomerListReturn {
  customers: CustomerEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

export function useCustomerList(): UseCustomerListReturn {
  const [customers, setCustomers] = useState<CustomerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FilterParams = {
        page,
        pageSize: 20,
        sortBy: 'desc',
        sortName: 'createdAt',
      };

      if (search.length > 0) {
        params.filters = [
          { field: 'firstName', operator: 'contains', value: search },
        ];
      }

      const result = await customerApi.filter(params);
      setCustomers(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load customers';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    pagination,
    refetch: fetchCustomers,
    setPage,
    setSearch,
  };
}
