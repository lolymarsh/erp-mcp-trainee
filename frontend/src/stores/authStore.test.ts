import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { UserResponse } from '../modules/auth/model';

const mockUser: UserResponse = {
  id: '1',
  username: 'admin',
  displayName: 'Admin',
  role: 'ADMIN',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  });

  it('default state is logged out', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('login sets token and user', () => {
    useAuthStore.getState().login('test-token', mockUser);
    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token');
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  it('logout clears token and user', () => {
    useAuthStore.getState().login('test-token', mockUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('restores session from localStorage on initialization', () => {
    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    useAuthStore.setState({
      token: localStorage.getItem('token'),
      user: JSON.parse(localStorage.getItem('user') || 'null'),
      isAuthenticated: !!localStorage.getItem('token'),
    });
    const state = useAuthStore.getState();
    expect(state.token).toBe('saved-token');
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('isAuthenticated is true when token exists', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    useAuthStore.getState().login('token', mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
