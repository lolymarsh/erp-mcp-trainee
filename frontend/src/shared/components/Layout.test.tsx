import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Layout } from './Layout';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

const mockUseAuthStore = vi.fn();

vi.mock('react-router-dom', () => ({
  Outlet: () => <div>Outlet Content</div>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders outlet content', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { displayName: 'Admin' },
      logout: mockLogout,
    });

    render(<Layout />);

    expect(screen.getByText('Outlet Content')).toBeInTheDocument();
  });

  it('shows sidebar navigation when authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { displayName: 'Admin' },
      logout: mockLogout,
    });

    render(<Layout />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('ลูกค้า')).toBeInTheDocument();
    expect(screen.getByText('สินค้า')).toBeInTheDocument();
    expect(screen.getByText('ใบแจ้งหนี้')).toBeInTheDocument();
    expect(screen.getByText('งานติดตั้ง')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
  });

  it('hides sidebar when not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<Layout />);

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('ลูกค้า')).not.toBeInTheDocument();
  });

  it('shows user display name and logout button when authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { displayName: 'Admin' },
      logout: mockLogout,
    });

    render(<Layout />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<Layout />);

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('calls logout and navigates to /login on logout click', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { displayName: 'Admin' },
      logout: mockLogout,
    });

    render(<Layout />);
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to /login when login button is clicked', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<Layout />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('highlights active route in sidebar', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { displayName: 'Admin' },
      logout: mockLogout,
    });

    render(<Layout />);
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveAttribute('data-selected', 'true');
  });
});
