import { useState, useEffect, useCallback } from 'react';
import type { ProductEntity, PaginationResponse, FilterParams } from './model';
import { inventoryApi } from './model';

interface UseInventoryListReturn {
  products: ProductEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

export function useInventoryList(): UseInventoryListReturn {
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async () => {
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
          { field: 'name', operator: 'contains', value: search },
        ];
      }

      const result = await inventoryApi.filter(params);
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
    setPage,
    setSearch,
  };
}

interface UseLowStockAlertsReturn {
  lowStockProducts: ProductEntity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLowStockAlerts(): UseLowStockAlertsReturn {
  const [lowStockProducts, setLowStockProducts] = useState<ProductEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FilterParams = {
        page: 1,
        pageSize: 100,
        sortBy: 'asc',
        sortName: 'currentStock',
      };

      const result = await inventoryApi.filter(params);
      setLowStockProducts(
        result.data.filter((p) => p.currentStock <= p.minStock),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load low stock alerts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  return {
    lowStockProducts,
    loading,
    error,
    refetch: fetchLowStock,
  };
}
