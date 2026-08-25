import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  UserListView,
  UserCreateDialog,
  UserEditDialog,
  UserDeleteConfirmDialog,
} from './view';
import type { UserEntity, PaginationResponse } from './model';

const mockUsers: UserEntity[] = [
  {
    id: 'u1',
    username: 'admin',
    displayName: 'Admin User',
    role: 'ADMIN',
    isActive: true,
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    username: 'tech1',
    displayName: 'Somchai Mechanic',
    role: 'TECHNICIAN',
    isActive: false,
    version: 2,
    createdAt: '2026-01-02T00:00:00Z',
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

describe('UserListView', () => {
  const onPageChange = vi.fn();
  const onRoleFilterChange = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onToggleActive = vi.fn();
  const onHistory = vi.fn();
  const onCreateClick = vi.fn();
  const onSearch = vi.fn();

  const defaultProps = {
    users: mockUsers,
    loading: false,
    error: null,
    pagination: mockPagination,
    roleFilter: null,
    onPageChange,
    onRoleFilterChange,
    onEdit,
    onDelete,
    onToggleActive,
    onHistory,
    onCreateClick,
    onSearch,
    search: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user list table with user details', () => {
    render(<UserListView {...defaultProps} />);

    expect(screen.getByText('จัดการผู้ใช้งาน')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Somchai Mechanic')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('tech1')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    render(
      <UserListView {...defaultProps} users={[]} loading={true} pagination={null} />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error alert when error occurs', () => {
    render(
      <UserListView {...defaultProps} users={[]} error="Failed to load users" pagination={null} />,
    );

    expect(screen.getByText('Failed to load users')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<UserListView {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: /แก้ไข/ });
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<UserListView {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /ลบ/ });
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(mockUsers[0]);
  });
});

describe('UserCreateDialog', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create dialog fields', () => {
    render(
      <UserCreateDialog
        open={true}
        onClose={onClose}
        loading={false}
        error={null}
        fieldErrors={{}}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('เพิ่มผู้ใช้งาน')).toBeInTheDocument();
    expect(screen.getByLabelText(/ชื่อผู้ใช้/)).toBeInTheDocument();
    expect(screen.getByLabelText(/รหัสผ่าน/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ชื่อที่แสดง/)).toBeInTheDocument();
  });
});

describe('UserEditDialog', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  it('renders edit dialog with initial values', () => {
    render(
      <UserEditDialog
        open={true}
        onClose={onClose}
        loading={false}
        error={null}
        fieldErrors={{}}
        initialValues={mockUsers[0]}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('แก้ไขผู้ใช้งาน')).toBeInTheDocument();
  });
});

describe('UserDeleteConfirmDialog', () => {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  it('renders delete confirmation with user name', () => {
    render(
      <UserDeleteConfirmDialog
        open={true}
        userName="Admin User"
        loading={false}
        error={null}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('ยืนยันการลบ')).toBeInTheDocument();
    expect(screen.getByText(/Admin User/)).toBeInTheDocument();
  });
});
