import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { invoiceApi } from './model';

const mockInvoice = {
  id: 'inv1',
  invoiceNumber: 'INV-2025-001',
  customerId: 'c1',
  vehicleId: null,
  totalAmount: '500.00',
  discount: '0.00',
  tax: '35.00',
  grandTotal: '535.00',
  paymentStatus: 'PENDING',
  paymentMethod: null,
  createdBy: 'admin',
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockInvoiceItem = {
  id: 'ii1',
  invoiceId: 'inv1',
  productId: 'p1',
  quantity: 2,
  unitPrice: '250.00',
  total: '500.00',
};

describe('invoiceApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filter sends POST to /sales/invoices/filter and returns paginated data', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: [mockInvoice],
        pagination: {
          page: 1,
          pageSize: 20,
          totalData: 1,
          totalPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    const result = await invoiceApi.Filter({
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/sales/invoices/filter',
      { page: 1, pageSize: 20, sortBy: 'desc' },
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].invoiceNumber).toBe('INV-2025-001');
    expect(result.pagination.totalData).toBe(1);
  });

  it('filter with sortName and filters sends correct payload', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: [mockInvoice],
        pagination: {
          page: 1,
          pageSize: 20,
          totalData: 1,
          totalPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    await invoiceApi.Filter({
      page: 1,
      pageSize: 20,
      sortBy: 'asc',
      sortName: 'createdAt',
      filters: [{ field: 'paymentStatus', operator: 'eq', value: 'PENDING' }],
    });

    expect(mockApi.post).toHaveBeenCalledWith('/sales/invoices/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'asc',
      sortName: 'createdAt',
      filters: [{ field: 'paymentStatus', operator: 'eq', value: 'PENDING' }],
    });
  });

  it('getById sends GET to /sales/invoices/:id with items', async () => {
    const apiResponse = {
      data: {
        data: { ...mockInvoice, items: [mockInvoiceItem] },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await invoiceApi.GetById('inv1');

    expect(mockApi.get).toHaveBeenCalledWith('/sales/invoices/inv1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe('p1');
    expect(result.grandTotal).toBe('535.00');
  });

  it('create sends POST to /sales/invoices with customerId and items', async () => {
    const apiResponse = {
      data: {
        data: { ...mockInvoice, items: [mockInvoiceItem] },
      },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    const result = await invoiceApi.Create({
      customerId: 'c1',
      items: [{ productId: 'p1', quantity: 2 }],
    });

    expect(mockApi.post).toHaveBeenCalledWith('/sales/invoices', {
      customerId: 'c1',
      items: [{ productId: 'p1', quantity: 2 }],
    });
    expect(result.invoiceNumber).toBe('INV-2025-001');
    expect(result.items).toHaveLength(1);
  });

  it('create with all optional fields sends full payload', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        data: { ...mockInvoice, items: [mockInvoiceItem] },
      },
    });

    await invoiceApi.Create({
      customerId: 'c1',
      vehicleId: 'v1',
      items: [{ productId: 'p1', quantity: 2 }],
      discount: 50,
      paymentMethod: 'CASH',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/sales/invoices', {
      customerId: 'c1',
      vehicleId: 'v1',
      items: [{ productId: 'p1', quantity: 2 }],
      discount: 50,
      paymentMethod: 'CASH',
    });
  });

  it('getTodaySummary sends GET to /sales/invoices/today-summary', async () => {
    const apiResponse = {
      data: {
        data: { totalAmount: '15000.00', count: 5 },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await invoiceApi.GetTodaySummary();

    expect(mockApi.get).toHaveBeenCalledWith('/sales/invoices/today-summary');
    expect(result.totalAmount).toBe('15000.00');
    expect(result.count).toBe(5);
  });

  it('getTodaySummary returns zero values when there are no sales', async () => {
    const apiResponse = {
      data: {
        data: { totalAmount: '0.00', count: 0 },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await invoiceApi.GetTodaySummary();

    expect(result.totalAmount).toBe('0.00');
    expect(result.count).toBe(0);
  });
});
