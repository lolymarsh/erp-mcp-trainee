import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import type { ProductEntity, ProductWithMovements, PaginationResponse, FilterParams, CategoryEntity } from './model';
import { inventoryApi } from './model';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';

const createProductSchema = z.object({
  sku: z.string().min(1, 'กรุณากรอก SKU'),
  name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  description: z.string().optional(),
  unit: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ').optional(),
  sellPrice: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ').optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  currentStock: z.coerce.number().int().min(0).optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;

const stockAdjustSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.coerce.number().int().min(1, 'จำนวนต้องมากกว่า 0'),
  note: z.string().optional(),
});

export type StockAdjustFormData = z.infer<typeof stockAdjustSchema>;

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
  const debouncedSearch = useDebouncedValue(search, 400);

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

      if (debouncedSearch.length > 0) {
        params.filters = [
          { field: 'name', operator: 'contains', value: debouncedSearch },
        ];
      }

      const result = await inventoryApi.Filter(params);
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const exportCsv = useCallback(() => {
    if (products.length === 0) return;
    const headers = ['SKU', 'ชื่อสินค้า', 'ราคาขาย', 'สต็อกคงเหลือ', 'ขั้นต่ำ', 'หน่วย'];
    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.name}"`,
      `"${p.sellPrice}"`,
      `"${p.currentStock}"`,
      `"${p.minStock}"`,
      `"${p.unit ?? ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [products]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
    setPage,
    setSearch,
    exportCsv,
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

      const result = await inventoryApi.Filter(params);
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

// ====== Detail ======

export interface UseInventoryDetailReturn {
  product: ProductWithMovements | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInventoryDetail(id: string): UseInventoryDetailReturn {
  const [product, setProduct] = useState<ProductWithMovements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await inventoryApi.GetById(id);
      setProduct(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load product';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { product, loading, error, refetch: fetch };
}

// ====== Create ======

export interface UseProductCreateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  submit: (input: CreateProductFormData) => Promise<void>;
}

export function useProductCreate(onSuccess: () => void): UseProductCreateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
  }, []);

  const submit = useCallback(async (input: CreateProductFormData) => {
    const parsed = createProductSchema.safeParse(input);
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
      await inventoryApi.Create(parsed.data);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, fieldErrors, submit };
}

// ====== Update ======

export interface UseProductUpdateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  openWithData: (product: ProductWithMovements) => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: CreateProductFormData | null;
  version: number;
  submit: (input: CreateProductFormData) => Promise<void>;
}

export function useProductUpdate(id: string, onSuccess: () => void): UseProductUpdateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<CreateProductFormData | null>(null);
  const [version, setVersion] = useState(0);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
  }, []);

  const openWithData = useCallback((product: ProductWithMovements) => {
    setInitialValues({
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      description: product.description ?? '',
      unit: product.unit,
      costPrice: Number(product.costPrice),
      sellPrice: Number(product.sellPrice),
      minStock: product.minStock,
      currentStock: product.currentStock,
    });
    setVersion(product.version);
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }, []);

  const submit = useCallback(async (input: CreateProductFormData) => {
    const parsed = createProductSchema.safeParse(input);
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
      await inventoryApi.Update(id, { ...parsed.data, version });
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        onSuccess();
      } else {
        const message = err instanceof Error ? err.message : 'Failed to update product';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, version, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, fieldErrors, initialValues, version, submit };
}

// ====== Stock Adjust ======

export interface UseStockAdjustReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  submit: (input: StockAdjustFormData) => Promise<void>;
}

export function useStockAdjust(id: string, onSuccess: () => void): UseStockAdjustReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
  }, []);

  const submit = useCallback(async (input: StockAdjustFormData) => {
    const parsed = stockAdjustSchema.safeParse(input);
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
      await inventoryApi.AdjustStock(id, parsed.data);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to adjust stock';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, fieldErrors, submit };
}

// ====== Delete ======

export interface UseProductDeleteReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  submit: (version: number) => Promise<void>;
}

export function useProductDelete(
  id: string,
  onSuccess: () => void,
  onConflict?: () => void,
): UseProductDeleteReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  const submit = useCallback(async (version: number) => {
    setLoading(true);
    setError(null);
    try {
      await inventoryApi.SoftDelete(id, { version });
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        if (onConflict) onConflict();
      } else {
        const message = err instanceof Error ? err.message : 'Failed to delete product';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, onSuccess, onConflict, handleClose]);

  return { open, setOpen, handleClose, loading, error, submit };
}

// ====== Category List ======

export interface UseCategoryListReturn {
  categories: CategoryEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

export function useCategoryList(): UseCategoryListReturn {
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FilterParams = {
        page,
        pageSize: 10,
        sortBy: 'asc',
        sortName: 'name',
      };

      if (debouncedSearch.length > 0) {
        params.filters = [
          { field: 'name', operator: 'contains', value: debouncedSearch },
        ];
      }

      const result = await inventoryApi.FilterCategories(params);
      setCategories(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load categories';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return { categories, loading, error, pagination, refetch: fetch, setPage, setSearch };
}

// ====== Category Create ======

const createCategorySchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อหมวดหมู่'),
  description: z.string().optional(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

export interface UseCategoryCreateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  submit: (input: CreateCategoryFormData) => Promise<void>;
}

export function useCategoryCreate(onSuccess: () => void): UseCategoryCreateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
  }, []);

  const submit = useCallback(async (input: CreateCategoryFormData) => {
    const parsed = createCategorySchema.safeParse(input);
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
      await inventoryApi.CreateCategory(parsed.data);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, fieldErrors, submit };
}

// ====== Category Update ======

export interface UseCategoryUpdateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  openWithData: (category: CategoryEntity) => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: { name: string; description: string } | null;
  version: number;
  submit: (input: CreateCategoryFormData) => Promise<void>;
}

export function useCategoryUpdate(onSuccess: () => void): UseCategoryUpdateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<{ name: string; description: string } | null>(null);
  const [version, setVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
    setEditingId(null);
  }, []);

  const openWithData = useCallback((category: CategoryEntity) => {
    setInitialValues({
      name: category.name,
      description: category.description ?? '',
    });
    setVersion(category.version);
    setEditingId(category.id);
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }, []);

  const submit = useCallback(async (input: CreateCategoryFormData) => {
    const parsed = createCategorySchema.safeParse(input);
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
    if (!editingId) return;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await inventoryApi.UpdateCategory(editingId, { ...parsed.data, version });
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        onSuccess();
      } else {
        const message = err instanceof Error ? err.message : 'Failed to update category';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [editingId, version, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, fieldErrors, initialValues, version, submit };
}

// ====== Category Delete ======

export interface UseCategoryDeleteReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  openWithData: (category: CategoryEntity) => void;
  loading: boolean;
  error: string | null;
  categoryName: string;
  version: number;
  submit: () => Promise<void>;
}

export function useCategoryDelete(onSuccess: () => void): UseCategoryDeleteReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [version, setVersion] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setDeletingId(null);
  }, []);

  const openWithData = useCallback((category: CategoryEntity) => {
    setCategoryName(category.name);
    setVersion(category.version);
    setDeletingId(category.id);
    setError(null);
    setOpen(true);
  }, []);

  const submit = useCallback(async () => {
    if (!deletingId) return;
    setLoading(true);
    setError(null);
    try {
      await inventoryApi.DeleteCategory(deletingId, { version });
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        onSuccess();
      } else {
        const message = err instanceof Error ? err.message : 'Failed to delete category';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [deletingId, version, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, categoryName, version, submit };
}
