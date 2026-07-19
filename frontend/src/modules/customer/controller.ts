import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import type { CustomerEntity, CustomerWithVehicles, PaginationResponse, FilterParams } from './model';
import { customerApi } from './model';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';

const customerFormSchema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  phone: z.string().min(10, 'เบอร์โทรต้องอย่างน้อย 10 หลัก').regex(/^0\d{9}$/, 'รูปแบบเบอร์โทรไม่ถูกต้อง'),
  email: z.string().email('อีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  address: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

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
  const debouncedSearch = useDebouncedValue(search, 400);

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

      if (debouncedSearch.length > 0) {
        params.filters = [
          { field: 'firstName', operator: 'contains', value: debouncedSearch },
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
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

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

// ====== Detail ======

export interface UseCustomerDetailReturn {
  customer: CustomerWithVehicles | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCustomerDetail(id: string): UseCustomerDetailReturn {
  const [customer, setCustomer] = useState<CustomerWithVehicles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await customerApi.getById(id);
      setCustomer(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load customer';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { customer, loading, error, refetch: fetch };
}

// ====== Create ======

export interface UseCustomerCreateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  submit: (input: CustomerFormData) => Promise<void>;
}

export function useCustomerCreate(onSuccess: () => void): UseCustomerCreateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
  }, []);

  const submit = useCallback(async (input: CustomerFormData) => {
    const parsed = customerFormSchema.safeParse(input);
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
      await customerApi.create(parsed.data);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create customer';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, fieldErrors, submit };
}

// ====== Update ======

export interface UseCustomerUpdateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  openWithData: (customer: CustomerWithVehicles) => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: CustomerFormData | null;
  submit: (input: CustomerFormData) => Promise<void>;
}

export function useCustomerUpdate(id: string, onSuccess: () => void): UseCustomerUpdateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<CustomerFormData | null>(null);
  const [version, setVersion] = useState(0);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setFieldErrors({});
  }, []);

  const openWithData = useCallback((customer: CustomerWithVehicles) => {
    setInitialValues({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
    });
    setVersion(customer.version);
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }, []);

  const submit = useCallback(async (input: CustomerFormData) => {
    const parsed = customerFormSchema.safeParse(input);
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
      await customerApi.update(id, { ...parsed.data, version });
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        onSuccess();
      } else {
        const message = err instanceof Error ? err.message : 'Failed to update customer';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, version, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, fieldErrors, initialValues, submit };
}

// ====== Delete ======

export interface UseCustomerDeleteReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  submit: (version: number) => Promise<void>;
}

export function useCustomerDelete(
  id: string,
  onSuccess: () => void,
  onConflict?: () => void,
): UseCustomerDeleteReturn {
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
      await customerApi.softDelete(id, { version });
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณาลองใหม่');
        if (onConflict) onConflict();
      } else {
        const message = err instanceof Error ? err.message : 'Failed to delete customer';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, onSuccess, onConflict, handleClose]);

  return { open, setOpen, handleClose, loading, error, submit };
}
