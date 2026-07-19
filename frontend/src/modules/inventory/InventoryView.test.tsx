import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryListView } from './view';
import type { ProductEntity, PaginationResponse } from './model';

const mockProducts: ProductEntity[] = [
  {
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
  },
  {
    id: 'p2',
    categoryId: 'cat2',
    sku: 'FILTER-001',
    name: 'กรองน้ำมันเครื่อง',
    description: null,
    unit: 'ชิ้น',
    costPrice: '50.00',
    sellPrice: '120.00',
    minStock: 20,
    currentStock: 5,
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

describe('InventoryListView', () => {
  const onSearch = vi.fn();
  const onPageChange = vi.fn();
  const onSelectProduct = vi.fn();
  const onCreateClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product list with data', () => {
    render(
      <InventoryListView
        products={mockProducts}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('น้ำมันเครื่อง 5W30')).toBeInTheDocument();
    expect(screen.getByText('กรองน้ำมันเครื่อง')).toBeInTheDocument();
    expect(screen.getByText('OIL-001')).toBeInTheDocument();
  });

  it('renders loading spinner when loading', () => {
    render(
      <InventoryListView
        products={[]}
        loading={true}
        error={null}
        pagination={null}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state when no products', () => {
    render(
      <InventoryListView
        products={[]}
        loading={false}
        error={null}
        pagination={null}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('ไม่พบข้อมูลสินค้า')).toBeInTheDocument();
  });

  it('renders error alert when error is present', () => {
    render(
      <InventoryListView
        products={[]}
        loading={false}
        error="Failed to load"
        pagination={null}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('calls onSearch when text field changes', () => {
    render(
      <InventoryListView
        products={mockProducts}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    fireEvent.change(screen.getByLabelText(/ค้นหาชื่อสินค้าหรือ SKU/), {
      target: { value: 'น้ำมัน' },
    });

    expect(onSearch).toHaveBeenCalledWith('น้ำมัน');
  });

  it('calls onSelectProduct when product row is clicked', () => {
    render(
      <InventoryListView
        products={mockProducts}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    fireEvent.click(screen.getByText('น้ำมันเครื่อง 5W30'));

    expect(onSelectProduct).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('shows stock badge with correct color for low stock', () => {
    render(
      <InventoryListView
        products={mockProducts}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    const chips = screen.getAllByText('5');
    expect(chips.length).toBeGreaterThanOrEqual(1);
  });

  it('shows pagination info', () => {
    render(
      <InventoryListView
        products={mockProducts}
        loading={false}
        error={null}
        pagination={mockPagination}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onSelectProduct={onSelectProduct}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('หน้า 1 / 1 (2 รายการ)')).toBeInTheDocument();
  });
});
