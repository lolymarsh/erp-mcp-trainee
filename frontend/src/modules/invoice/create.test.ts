import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}));

vi.mock('axios', () => ({
  default: {
    ...mockApi,
    create: vi.fn(() => mockApi),
  },
}));

import { useInvoiceCreate } from './controller';

const mockCustomer = {
  id: 'c1',
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  phone: '0812345678',
  email: null,
  address: null,
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockProduct = {
  id: 'p1',
  categoryId: 'cat1',
  sku: 'OIL-001',
  name: 'น้ำมันเครื่อง 5W30',
  description: null,
  unit: 'ลิตร',
  costPrice: '100.00',
  sellPrice: '250.00',
  minStock: 10,
  currentStock: 50,
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockFilterResponse = {
  data: {
    code: 200,
    message: 'success',
    data: [mockCustomer],
    pagination: {
      page: 1, pageSize: 200, totalData: 1, totalPage: 1,
      hasNextPage: false, hasPreviousPage: false,
    },
  },
};

const mockProductFilterResponse = {
  data: {
    code: 200,
    message: 'success',
    data: [mockProduct],
    pagination: {
      page: 1, pageSize: 200, totalData: 1, totalPage: 1,
      hasNextPage: false, hasPreviousPage: false,
    },
  },
};

describe('useInvoiceCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadLookups fetches customers and products', async () => {
    mockApi.post
      .mockResolvedValueOnce(mockFilterResponse)
      .mockResolvedValueOnce(mockProductFilterResponse);

    const { result } = renderHook(() => useInvoiceCreate());

    await act(async () => {
      await result.current.loadLookups();
    });

    expect(mockApi.post).toHaveBeenCalledTimes(2);
    expect(mockApi.post).toHaveBeenCalledWith('/customers/filter', {
      page: 1, pageSize: 200, sortBy: 'asc', sortName: 'firstName', filters: [],
    });
    expect(mockApi.post).toHaveBeenCalledWith('/inventory/products/filter', {
      page: 1, pageSize: 200, sortBy: 'asc', sortName: 'name', filters: [],
    });
    expect(result.current.customers).toHaveLength(1);
    expect(result.current.products).toHaveLength(1);
  });

  it('handles loadLookups error', async () => {
    mockApi.post.mockRejectedValue(new Error('Failed to load data'));

    const { result } = renderHook(() => useInvoiceCreate());

    await act(async () => {
      await result.current.loadLookups();
    });

    expect(result.current.error).toBe('Failed to load data');
  });

  it('addItem adds new item to list', () => {
    const { result } = renderHook(() => useInvoiceCreate());

    act(() => {
      result.current.addItem('p1', 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({ productId: 'p1', quantity: 2 });
  });

  it('addItem increments quantity for existing product', () => {
    const { result } = renderHook(() => useInvoiceCreate());

    act(() => {
      result.current.addItem('p1', 2);
    });

    act(() => {
      result.current.addItem('p1', 3);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removeItem removes item at index', () => {
    const { result } = renderHook(() => useInvoiceCreate());

    act(() => {
      result.current.addItem('p1', 2);
    });

    act(() => {
      result.current.addItem('p2', 1);
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.removeItem(0);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe('p2');
  });

  it('updateItemQuantity updates quantity at index', () => {
    const { result } = renderHook(() => useInvoiceCreate());

    act(() => {
      result.current.addItem('p1', 2);
    });

    act(() => {
      result.current.updateItemQuantity(0, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
  });

  it('calculates grandTotal correctly with products loaded', async () => {
    mockApi.post
      .mockResolvedValueOnce(mockFilterResponse)
      .mockResolvedValueOnce(mockProductFilterResponse);

    const { result } = renderHook(() => useInvoiceCreate());

    await act(async () => {
      await result.current.loadLookups();
    });

    act(() => {
      result.current.addItem('p1', 2);
    });

    expect(result.current.grandTotal).toBe(500);
  });

  it('grandTotal accounts for discount', async () => {
    mockApi.post
      .mockResolvedValueOnce(mockFilterResponse)
      .mockResolvedValueOnce(mockProductFilterResponse);

    const { result } = renderHook(() => useInvoiceCreate());

    await act(async () => {
      await result.current.loadLookups();
    });

    act(() => {
      result.current.addItem('p1', 2);
      result.current.setDiscount(50);
    });

    expect(result.current.grandTotal).toBe(450);
  });

  it('submit fails validation when no customer selected', async () => {
    const { result } = renderHook(() => useInvoiceCreate());

    let invoice = null;
    await act(async () => {
      invoice = await result.current.submit();
    });
    expect(invoice).toBeNull();
    expect(result.current.error).toBe('Please select a customer');
  });

  it('submit fails validation when no items added', async () => {
    const { result } = renderHook(() => useInvoiceCreate());

    act(() => {
      result.current.setSelectedCustomerId('c1');
    });

    let invoice = null;
    await act(async () => {
      invoice = await result.current.submit();
    });
    expect(invoice).toBeNull();
    expect(result.current.error).toBe('Please add at least one item');
  });

  it('submit calls API and resets state on success', async () => {
    mockApi.post
      .mockResolvedValueOnce(mockFilterResponse)
      .mockResolvedValueOnce(mockProductFilterResponse);

    mockApi.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'inv1',
          invoiceNumber: 'INV-2025-001',
          items: [],
        },
      },
    });

    const { result } = renderHook(() => useInvoiceCreate());

    await act(async () => {
      await result.current.loadLookups();
    });

    act(() => {
      result.current.setSelectedCustomerId('c1');
      result.current.setSelectedPaymentMethod('CASH');
      result.current.setDiscount(50);
      result.current.addItem('p1', 2);
    });

    let invoice: unknown = null;
    await act(async () => {
      invoice = await result.current.submit();
    });
    expect(invoice).not.toBeNull();
    expect((invoice as { invoiceNumber: string })?.invoiceNumber).toBe('INV-2025-001');
    expect(mockApi.post).toHaveBeenCalledWith('/sales/invoices', {
      customerId: 'c1',
      items: [{ productId: 'p1', quantity: 2 }],
      discount: 50,
      paymentMethod: 'CASH',
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.selectedCustomerId).toBe('');
    expect(result.current.discount).toBe(0);
  });

  it('submit handles API error', async () => {
    mockApi.post
      .mockResolvedValueOnce(mockFilterResponse)
      .mockResolvedValueOnce(mockProductFilterResponse);

    mockApi.post.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useInvoiceCreate());

    await act(async () => {
      await result.current.loadLookups();
    });

    act(() => {
      result.current.setSelectedCustomerId('c1');
      result.current.addItem('p1', 2);
    });

    let invoice = null;
    await act(async () => {
      invoice = await result.current.submit();
    });
    expect(invoice).toBeNull();
    expect(result.current.error).toBe('API Error');
  });

  it('reset clears all state', () => {
    const { result } = renderHook(() => useInvoiceCreate());

    act(() => {
      result.current.setSelectedCustomerId('c1');
      result.current.setSelectedPaymentMethod('CASH');
      result.current.setDiscount(100);
      result.current.addItem('p1', 2);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.selectedCustomerId).toBe('');
    expect(result.current.selectedPaymentMethod).toBe('');
    expect(result.current.discount).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
