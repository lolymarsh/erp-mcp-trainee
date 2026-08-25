import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from './view';
import type { DashboardSummary } from './model';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockSummary: DashboardSummary = {
  todaySales: { amount: '15000.00', count: 5 },
  todayJobs: { total: 10, completed: 4, inProgress: 3, queued: 3 },
  lowStockProducts: [
    { id: 'p1', name: 'Oil Filter', current: 2, min: 10 },
  ],
  monthlySales: [
    { month: '2025-01', amount: '300000.00' },
  ],
  topTechnicians: [
    { name: 'Somchai', jobCount: 15, totalAmount: '120000.00' },
  ],
};

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner/skeleton when loading with no summary', () => {
    const { container } = render(<DashboardView summary={null} loading={true} error={null} />);

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders error alert when error with no summary', () => {
    render(<DashboardView summary={null} loading={false} error="Failed" />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders empty message when no summary and not loading', () => {
    render(<DashboardView summary={null} loading={false} error={null} />);

    expect(screen.getByText('ไม่มีข้อมูล')).toBeInTheDocument();
  });

  it('renders dashboard data when summary is provided', () => {
    render(<DashboardView summary={mockSummary} loading={false} error={null} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('ยอดขายวันนี้')).toBeInTheDocument();
    expect(screen.getByText('คิวงานวันนี้')).toBeInTheDocument();
    expect(screen.getByText('สต็อกใกล้หมด')).toBeInTheDocument();
    expect(screen.getByText('รายได้เดือนนี้')).toBeInTheDocument();
  });

  it('renders warning alert when error with existing data', () => {
    render(<DashboardView summary={mockSummary} loading={false} error="Refresh failed" />);

    expect(screen.getByText('Refresh failed')).toBeInTheDocument();
  });

  it('renders low stock product section', () => {
    render(<DashboardView summary={mockSummary} loading={false} error={null} />);

    expect(screen.getByText('สินค้าที่สต็อกต่ำกว่าเกณฑ์')).toBeInTheDocument();
  });

  it('does not render low stock section when empty', () => {
    const noLowStock: DashboardSummary = {
      ...mockSummary,
      lowStockProducts: [],
    };

    render(<DashboardView summary={noLowStock} loading={false} error={null} />);

    expect(screen.queryByText('สินค้าที่สต็อกต่ำกว่าเกณฑ์')).not.toBeInTheDocument();
  });

  it('navigates to invoices on today sales card click', () => {
    render(<DashboardView summary={mockSummary} loading={false} error={null} />);

    const cards = screen.getAllByText('ยอดขายวันนี้');
    expect(cards.length).toBeGreaterThan(0);
  });
});
