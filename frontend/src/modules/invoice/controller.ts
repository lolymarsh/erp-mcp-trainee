import { useState, useEffect, useCallback } from 'react';
import {
  invoiceApi,
  type InvoiceResponse,
  type InvoiceWithItemsResponse,
  type CreateInvoiceInput,
  type PaginatedInvoices,
  type FilterRequest,
  type TodaySummaryResponse,
  type CreateInvoiceItemInput,
} from './model';
import type { CustomerEntity } from '../customer/model';
import type { ProductEntity } from '../inventory/model';
import { customerApi } from '../customer/model';
import { inventoryApi } from '../inventory/model';

interface UseInvoiceListReturn {
  invoices: InvoiceResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedInvoices['pagination'] | null;
  refetch: () => void;
  setPage: (page: number) => void;
}

export function useInvoiceList(): UseInvoiceListReturn {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedInvoices['pagination'] | null>(null);
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: FilterRequest = { page, pageSize: 20, sortBy: 'desc' };
      const result = await invoiceApi.filter(filter);
      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load invoices';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, loading, error, pagination, refetch: fetchInvoices, setPage };
}

interface UseInvoiceCreateReturn {
  submitting: boolean;
  error: string | null;
  customers: CustomerEntity[];
  products: ProductEntity[];
  items: CreateInvoiceItemInput[];
  selectedCustomerId: string;
  selectedPaymentMethod: string;
  discount: number;
  grandTotal: number;
  submit: () => Promise<InvoiceWithItemsResponse | null>;
  reset: () => void;
  setSelectedCustomerId: (id: string) => void;
  setSelectedPaymentMethod: (method: string) => void;
  setDiscount: (d: number) => void;
  addItem: (productId: string, quantity: number) => void;
  removeItem: (index: number) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  loadLookups: () => Promise<void>;
}

export function useInvoiceCreate(): UseInvoiceCreateReturn {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerEntity[]>([]);
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [items, setItems] = useState<CreateInvoiceItemInput[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [discount, setDiscount] = useState(0);

  const grandTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return sum;
    }
    return sum + parseFloat(product.sellPrice) * item.quantity;
  }, 0) - discount;

  const loadLookups = useCallback(async () => {
    try {
      const custResult = await customerApi.filter({
        page: 1,
        pageSize: 200,
        sortBy: 'asc',
        sortName: 'firstName',
        filters: [],
      });

      const prodResult = await inventoryApi.filter({
        page: 1,
        pageSize: 200,
        sortBy: 'asc',
        sortName: 'name',
        filters: [],
      });

      setCustomers(custResult.data);
      setProducts(prodResult.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    }
  }, []);

  const addItem = useCallback(
    (productId: string, quantity: number) => {
      const existing = items.findIndex((i) => i.productId === productId);
      if (existing >= 0) {
        const updated = [...items];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + quantity };
        setItems(updated);
        return;
      }
      setItems([...items, { productId, quantity }]);
    },
    [items],
  );

  const removeItem = useCallback(
    (index: number) => {
      setItems(items.filter((_, i) => i !== index));
    },
    [items],
  );

  const updateItemQuantity = useCallback(
    (index: number, quantity: number) => {
      const updated = [...items];
      updated[index] = { ...updated[index], quantity };
      setItems(updated);
    },
    [items],
  );

  const reset = useCallback(() => {
    setItems([]);
    setSelectedCustomerId('');
    setSelectedPaymentMethod('');
    setDiscount(0);
    setError(null);
  }, []);

  const submit = useCallback(async (): Promise<InvoiceWithItemsResponse | null> => {
    if (!selectedCustomerId) {
      setError('Please select a customer');
      return null;
    }
    if (items.length === 0) {
      setError('Please add at least one item');
      return null;
    }

    setSubmitting(true);
    setError(null);

    try {
      const input: CreateInvoiceInput = {
        customerId: selectedCustomerId,
        items,
      };
      if (discount > 0) {
        input.discount = discount;
      }
      if (selectedPaymentMethod) {
        input.paymentMethod = selectedPaymentMethod as 'CASH' | 'BANK_TRANSFER' | 'CREDIT' | 'PROMPTPAY';
      }

      const result = await invoiceApi.create(input);
      reset();
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [selectedCustomerId, items, discount, selectedPaymentMethod, reset]);

  return {
    submitting,
    error,
    customers,
    products,
    items,
    selectedCustomerId,
    selectedPaymentMethod,
    discount,
    grandTotal,
    submit,
    reset,
    setSelectedCustomerId,
    setSelectedPaymentMethod,
    setDiscount,
    addItem,
    removeItem,
    updateItemQuantity,
    loadLookups,
  };
}

interface UseTodaySummaryReturn {
  summary: TodaySummaryResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTodaySummary(): UseTodaySummaryReturn {
  const [summary, setSummary] = useState<TodaySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoiceApi.getTodaySummary();
      setSummary(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load summary';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { summary, loading, error, refetch: fetch };
}
