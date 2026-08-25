import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from './view';

const mockLogin = vi.fn();
let mockLoading = false;
let mockError: string | null = null;

vi.mock('./controller', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: mockLoading,
    error: mockError,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading = false;
    mockError = null;
  });

  it('renders login form with username and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/ชื่อผู้ใช้/)).toBeInTheDocument();
    expect(screen.getByLabelText(/รหัสผ่าน/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
    expect(screen.getByText('Versus ERP')).toBeInTheDocument();
  });

  it('calls login with username and password on submit', () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/ชื่อผู้ใช้/), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByLabelText(/รหัสผ่าน/), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

    expect(mockLogin).toHaveBeenCalledWith({
      username: 'admin',
      password: 'secret',
    });
  });

  it('displays error alert when form error is present', () => {
    mockError = 'Server error occurred';

    render(<LoginPage />);

    expect(screen.getByText('Server error occurred')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows password error helper when invalid credentials error is present', () => {
    mockError = 'Invalid credentials';

    render(<LoginPage />);

    expect(screen.getByText('รหัสผ่านไม่ถูกต้อง')).toBeInTheDocument();
  });

  it('shows progress bar on button and disables button when loading', () => {
    mockLoading = true;

    render(<LoginPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('progressbar').closest('button')).toBeDisabled();
  });

  it('enables submit button when username and password are provided', () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/ชื่อผู้ใช้/), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByLabelText(/รหัสผ่าน/), {
      target: { value: 'secret' },
    });

    expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).not.toBeDisabled();
  });
});
