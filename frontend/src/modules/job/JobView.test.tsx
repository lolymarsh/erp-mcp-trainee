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
  const onStatusChange = vi.fn();
  const onClearStatusError = vi.fn();
  const onRowClick = vi.fn();
  const onCreateClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders jobs table with data', () => {
    render(
      <JobQueueView
        jobs={mockJobs}
        loading={false}
        error={null}
        pagination={mockPagination}
        statusFilter={null}
        onPageChange={onPageChange}
        onStatusFilterChange={onStatusFilterChange}
        onStatusChange={onStatusChange}
        statusChangeError={null}
        onClearStatusError={onClearStatusError}
        onRowClick={onRowClick}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('Job Queue')).toBeInTheDocument();
    expect(screen.getByText('c1')).toBeInTheDocument();
    expect(screen.getByText('c2')).toBeInTheDocument();
    expect(screen.getByText('Install')).toBeInTheDocument();
    expect(screen.getByText('Repair')).toBeInTheDocument();
  });

  it('renders loading spinner when loading', () => {
    render(
      <JobQueueView
        jobs={[]}
        loading={true}
        error={null}
        pagination={null}
        statusFilter={null}
        onPageChange={onPageChange}
        onStatusFilterChange={onStatusFilterChange}
        onStatusChange={onStatusChange}
        statusChangeError={null}
        onClearStatusError={onClearStatusError}
        onRowClick={onRowClick}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error alert', () => {
    render(
      <JobQueueView
        jobs={[]}
        loading={false}
        error="Failed to load"
        pagination={null}
        statusFilter={null}
        onPageChange={onPageChange}
        onStatusFilterChange={onStatusFilterChange}
        onStatusChange={onStatusChange}
        statusChangeError={null}
        onClearStatusError={onClearStatusError}
        onRowClick={onRowClick}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty state when no jobs', () => {
    render(
      <JobQueueView
        jobs={[]}
        loading={false}
        error={null}
        pagination={null}
        statusFilter={null}
        onPageChange={onPageChange}
        onStatusFilterChange={onStatusFilterChange}
        onStatusChange={onStatusChange}
        statusChangeError={null}
        onClearStatusError={onClearStatusError}
        onRowClick={onRowClick}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('No jobs found')).toBeInTheDocument();
  });

  it('has status filter dropdown', () => {
    render(
      <JobQueueView
        jobs={mockJobs}
        loading={false}
        error={null}
        pagination={mockPagination}
        statusFilter={null}
        onPageChange={onPageChange}
        onStatusFilterChange={onStatusFilterChange}
        onStatusChange={onStatusChange}
        statusChangeError={null}
        onClearStatusError={onClearStatusError}
        onRowClick={onRowClick}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getAllByText('Status Filter').length).toBeGreaterThan(0);
  });

  it('shows status change dropdown for non-terminal statuses', () => {
    render(
      <JobQueueView
        jobs={mockJobs}
        loading={false}
        error={null}
        pagination={mockPagination}
        statusFilter={null}
        onPageChange={onPageChange}
        onStatusFilterChange={onStatusFilterChange}
        onStatusChange={onStatusChange}
        statusChangeError={null}
        onClearStatusError={onClearStatusError}
        onRowClick={onRowClick}
        onCreateClick={onCreateClick}
      />,
    );

    const changeButtons = screen.getAllByText('Change...');
    expect(changeButtons).toHaveLength(2);
  });

  it('shows status change error via Snackbar', () => {
    render(
      <JobQueueView
        jobs={mockJobs}
        loading={false}
        error={null}
        pagination={mockPagination}
        statusFilter={null}
        onPageChange={onPageChange}
        onStatusFilterChange={onStatusFilterChange}
        onStatusChange={onStatusChange}
        statusChangeError="Version conflict"
        onClearStatusError={onClearStatusError}
        onRowClick={onRowClick}
        onCreateClick={onCreateClick}
      />,
    );

    expect(screen.getByText('Version conflict')).toBeInTheDocument();
  });
});
