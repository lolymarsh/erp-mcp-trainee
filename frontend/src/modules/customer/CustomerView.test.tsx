import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerListView } from './view';
import type { CustomerEntity, PaginationResponse } from './model';

const mockCustomers: CustomerEntity[] = [
  {
    id: 'c1',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    phone: '0812345678',
    email: null,
    address: null,
    version: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'c2',
    firstName: 'สมหญิง',
    lastName: 'รักดี',
    phone: '0898765432',
    email: 'somying@test.com',
    address: 'Chiang Mai',
    version: 1,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];

const mockPagination: PaginationResponse = {
  page: 1,
  pageSize: 20,
  totalData: 2,
  totalPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe('CustomerListView', () => {
  const onSearch = vi.fn();
  const onPageChange = vi.fn();
  const onSelectCustomer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer list with data', () => {
    render(
      <CustomerListView
        customers={mockCustomers}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    expect(screen.getByText('สมชาย')).toBeInTheDocument();
    expect(screen.getByText('สมหญิง')).toBeInTheDocument();
    expect(screen.getByText('0812345678')).toBeInTheDocument();
  });

  it('renders loading spinner when loading', () => {
    render(
      <CustomerListView
        customers={[]}
        loading={true}
        error={null}
        pagination={null}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state when no customers', () => {
    render(
      <CustomerListView
        customers={[]}
        loading={false}
        error={null}
        pagination={null}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    expect(screen.getByText('ไม่พบข้อมูลลูกค้า')).toBeInTheDocument();
  });

  it('renders error alert when error is present', () => {
    render(
      <CustomerListView
        customers={[]}
        loading={false}
        error="Network error"
        pagination={null}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('calls onSearch when text field changes', () => {
    render(
      <CustomerListView
        customers={mockCustomers}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    fireEvent.change(screen.getByLabelText(/ค้นหาชื่อหรือเบอร์โทร/), {
      target: { value: 'สมชาย' },
    });

    expect(onSearch).toHaveBeenCalledWith('สมชาย');
  });

  it('calls onSelectCustomer when customer row is clicked', () => {
    render(
      <CustomerListView
        customers={mockCustomers}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    fireEvent.click(screen.getByText('สมชาย'));

    expect(onSelectCustomer).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('shows pagination buttons', () => {
    render(
      <CustomerListView
        customers={mockCustomers}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    expect(screen.getByText('หน้า 1 / 1 (2 รายการ)')).toBeInTheDocument();
    expect(screen.getByText('ก่อนหน้า')).toBeDisabled();
    expect(screen.getByText('ถัดไป')).toBeDisabled();
  });

  it('calls onPageChange when next button is clicked', () => {
    const paginationWithNext: PaginationResponse = {
      page: 1,
      pageSize: 20,
      totalData: 40,
      totalPage: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    };

    render(
      <CustomerListView
        customers={mockCustomers}
        loading={false}
        error={null}
        pagination={paginationWithNext}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectCustomer={onSelectCustomer}
      />,
    );

    fireEvent.click(screen.getByText('ถัดไป'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
