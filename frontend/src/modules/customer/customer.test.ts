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

import { customerApi } from './model';

const mockCustomer = {
  id: 'c1',
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  phone: '0812345678',
  email: 'somchai@test.com',
  address: 'Bangkok',
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockVehicle = {
  id: 'v1',
  customerId: 'c1',
  licensePlate: 'กข1234',
  brand: 'Toyota',
  model: 'Camry',
  year: 2023,
  engineType: 'Gasoline',
  fuelType: 'Gasoline',
};

describe('customerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filter sends POST to /customers/filter with params', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: [mockCustomer],
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

    const result = await customerApi.Filter({
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/customers/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].firstName).toBe('สมชาย');
    expect(result.pagination.totalData).toBe(1);
  });

  it('filter sends search filter when search term is provided', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: [mockCustomer],
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

    const result = await customerApi.Filter({
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
      filters: [{ field: 'firstName', operator: 'contains', value: 'สมชาย' }],
    });

    expect(mockApi.post).toHaveBeenCalledWith('/customers/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
      filters: [{ field: 'firstName', operator: 'contains', value: 'สมชาย' }],
    });
    expect(result.data).toHaveLength(1);
  });

  it('getById sends GET to /customers/:id', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: { ...mockCustomer, vehicles: [mockVehicle] },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await customerApi.GetById('c1');

    expect(mockApi.get).toHaveBeenCalledWith('/customers/c1');
    expect(result.data.vehicles).toHaveLength(1);
    expect(result.data.vehicles[0].licensePlate).toBe('กข1234');
  });

  it('create sends POST to /customers with input', async () => {
    const apiResponse = {
      data: { code: 201, message: 'created', data: mockCustomer },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    const result = await customerApi.Create({
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phone: '0812345678',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/customers', {
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phone: '0812345678',
    });
    expect(result.data.id).toBe('c1');
  });

  it('create with optional fields sends POST with all fields', async () => {
    const apiResponse = {
      data: { code: 201, message: 'created', data: mockCustomer },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    await customerApi.Create({
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phone: '0812345678',
      email: 'test@test.com',
      address: 'Bangkok',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/customers', {
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phone: '0812345678',
      email: 'test@test.com',
      address: 'Bangkok',
    });
  });

  it('update sends PATCH to /customers/:id with input', async () => {
    const apiResponse = {
      data: { code: 200, message: 'updated', data: { ...mockCustomer, firstName: 'สมชาย updated' } },
    };
    mockApi.patch.mockResolvedValue(apiResponse);

    const result = await customerApi.Update('c1', {
      firstName: 'สมชาย updated',
      version: 1,
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/customers/c1', {
      firstName: 'สมชาย updated',
      version: 1,
    });
    expect(result.data.firstName).toBe('สมชาย updated');
  });

  it('softDelete sends DELETE to /customers/:id with version', async () => {
    const apiResponse = {
      data: { code: 200, message: 'deleted' },
    };
    mockApi.delete.mockResolvedValue(apiResponse);

    const result = await customerApi.SoftDelete('c1', { version: 1 });

    expect(mockApi.delete).toHaveBeenCalledWith('/customers/c1', {
      data: { version: 1 },
    });
    expect(result.message).toBe('deleted');
  });

  it('getById returns empty vehicles array when customer has no vehicles', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: { ...mockCustomer, vehicles: [] },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await customerApi.GetById('c1');

    expect(result.data.vehicles).toHaveLength(0);
  });
});
