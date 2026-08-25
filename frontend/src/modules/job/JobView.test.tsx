import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobQueueView } from './view';
import type { JobResponse, PaginationInfo } from './model';

const mockJobs: JobResponse[] = [
  {
    id: 'j1',
    customerId: 'c1',
    vehicleId: 'v1',
    invoiceId: null,
    jobType: 'INSTALL',
    status: 'QUEUED',
    scheduledDate: null,
    startTime: null,
    endTime: null,
    technicianId: null,
    notes: null,
    version: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'j2',
    customerId: 'c2',
    vehicleId: 'v2',
    invoiceId: 'inv1',
    jobType: 'REPAIR',
    status: 'IN_PROGRESS',
    scheduledDate: '2025-01-10',
    startTime: null,
    endTime: null,
    technicianId: 'tech1',
    notes: 'Check engine',
    version: 2,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },
];

const mockPagination: PaginationInfo = {
  page: 1,
  pageSize: 20,
  totalData: 2,
  totalPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe('JobQueueView', () => {
  const onPageChange = vi.fn();
  const onStatusFilterChange = vi.fn();
  const onJobTypeFilterChange = vi.fn();
  const onSearch = vi.fn();
  const onStatusChange = vi.fn();
  const onClearStatusError = vi.fn();
  const onRowClick = vi.fn();
  const onCreateClick = vi.fn();

  const defaultProps = {
    jobs: mockJobs,
    loading: false,
    error: null,
    pagination: mockPagination,
    statusFilter: null,
    jobTypeFilter: null,
    search: '',
    onPageChange,
    onStatusFilterChange,
    onJobTypeFilterChange,
    onSearch,
    onStatusChange,
    statusChangeError: null,
    onClearStatusError,
    onRowClick,
    onCreateClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders jobs table with data', () => {
    render(<JobQueueView {...defaultProps} />);

    expect(screen.getByText('คิวงาน')).toBeInTheDocument();
    expect(screen.getByText('c1')).toBeInTheDocument();
    expect(screen.getByText('c2')).toBeInTheDocument();
    expect(screen.getAllByText('ติดตั้ง').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ซ่อม').length).toBeGreaterThanOrEqual(1);
  });

  it('renders loading spinner/skeleton when loading', () => {
    render(
      <JobQueueView
        {...defaultProps}
        jobs={[]}
        loading={true}
        pagination={null}
      />,
    );

    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('renders error alert', () => {
    render(
      <JobQueueView
        {...defaultProps}
        jobs={[]}
        error="Failed to load"
        pagination={null}
      />,
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty state when no jobs', () => {
    render(
      <JobQueueView
        {...defaultProps}
        jobs={[]}
        pagination={null}
      />,
    );

    expect(screen.getByText('ไม่พบงาน')).toBeInTheDocument();
  });

  it('has status filter dropdown', () => {
    render(<JobQueueView {...defaultProps} />);

    expect(screen.getAllByText('กรองสถานะ').length).toBeGreaterThan(0);
  });

  it('shows status change dropdown for non-terminal statuses', () => {
    render(<JobQueueView {...defaultProps} />);

    const changeButtons = screen.getAllByText('เปลี่ยน...');
    expect(changeButtons).toHaveLength(2);
  });

  it('shows status change error via Snackbar', () => {
    render(
      <JobQueueView
        {...defaultProps}
        statusChangeError="Version conflict"
      />,
    );

    expect(screen.getByText('Version conflict')).toBeInTheDocument();
  });
});
