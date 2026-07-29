/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserService } from './service';
import type { IUserRepository } from './repo';
import type Redis from 'ioredis';
import { UnauthorizedError, NotFoundError, ConflictError } from '../../shared/errors/AppError';

jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));

const mockUser = {
  id: 'user-1',
  username: 'admin',
  passwordHash: '',
  displayName: 'Admin',
  role: 'ADMIN' as const,
  isActive: true,
  version: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
};

describe('UserService', () => {
  let repo: jest.Mocked<IUserRepository>;
  let redis: jest.Mocked<Redis>;
  let svc: UserService;
  const mockAuditService = { Insert: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      FindById: jest.fn(),
      FindByUsername: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      FindFiltered: jest.fn(),
      SoftDelete: jest.fn(),
      FindAll: jest.fn(),
    };
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
    } as any;
    svc = new UserService(repo, redis, mockAuditService as any);
  });

  describe('Login', () => {
    it('should throw UnauthorizedError when user not found', async () => {
      repo.FindByUsername.mockResolvedValue(null);
      await expect(svc.Login({ username: 'unknown', password: 'pass' }))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      repo.FindByUsername.mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$correcthash',
      });
      await expect(svc.Login({ username: 'admin', password: 'wrongpass' }))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when account is inactive', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('password123', 4);
      repo.FindByUsername.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        isActive: false,
      });
      await expect(svc.Login({ username: 'admin', password: 'password123' }))
        .rejects.toThrow('Account is disabled');
    });

    it('should return token and user on success', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('password123', 4);
      repo.FindByUsername.mockResolvedValue({ ...mockUser, passwordHash: hash });

      const result = await svc.Login({ username: 'admin', password: 'password123' });

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('admin');
      expect(redis.set).toHaveBeenCalledWith(
        'session:user-1',
        expect.any(String),
        'EX',
        86400,
      );
    });
  });

  describe('GetProfile', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.FindById.mockResolvedValue(null);
      await expect(svc.GetProfile('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should return user response on success', async () => {
      repo.FindById.mockResolvedValue(mockUser);
      const result = await svc.GetProfile('user-1');
      expect(result.id).toBe('user-1');
      expect(result.displayName).toBe('Admin');
    });
  });

  describe('CreateUser', () => {
    it('should throw when username already exists', async () => {
      repo.FindByUsername.mockResolvedValue(mockUser);
      await expect(svc.CreateUser({
        username: 'admin',
        password: 'password123',
        displayName: 'Admin',
        role: 'ADMIN',
      }, 'admin-user-id')).rejects.toThrow('Username already exists');
    });

    it('should create and return user', async () => {
      repo.FindByUsername.mockResolvedValue(null);
      repo.Create.mockResolvedValue(mockUser);

      const result = await svc.CreateUser({
        username: 'admin',
        password: 'password123',
        displayName: 'Admin',
        role: 'ADMIN',
      }, 'admin-user-id');

      expect(result.username).toBe('admin');
      expect(repo.Create).toHaveBeenCalled();
    });
  });

  describe('Filter', () => {
    it('should return paginated results', async () => {
      repo.FindFiltered.mockResolvedValue({ data: [mockUser], total: 1 });
      const result = await svc.Filter({ page: 1, pageSize: 20, sortBy: 'desc' });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalData).toBe(1);
    });
  });

  describe('Update', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.FindById.mockResolvedValue(null);
      await expect(svc.Update('nonexistent', { displayName: 'New', version: 1 }, 'admin'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError on version mismatch', async () => {
      repo.FindById.mockResolvedValue(mockUser);
      repo.Update.mockResolvedValue(null);
      await expect(svc.Update('user-1', { displayName: 'New', version: 99 }, 'admin'))
        .rejects.toThrow(ConflictError);
    });

    it('should update and return user on success', async () => {
      repo.FindById.mockResolvedValue(mockUser);
      repo.Update.mockResolvedValue({ ...mockUser, displayName: 'Updated', version: 2 });
      const result = await svc.Update('user-1', { displayName: 'Updated', version: 1 }, 'admin');
      expect(result.displayName).toBe('Updated');
      expect(mockAuditService.Insert).toHaveBeenCalledWith(
        'UPDATE', 'users', 'user-1', 'admin', mockUser, expect.any(Object), undefined,
      );
    });
  });

  describe('SoftDelete', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.FindById.mockResolvedValue(null);
      await expect(svc.SoftDelete('nonexistent', { version: 1 }, 'admin'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError on version mismatch', async () => {
      repo.FindById.mockResolvedValue(mockUser);
      repo.SoftDelete.mockResolvedValue(false);
      await expect(svc.SoftDelete('user-1', { version: 99 }, 'admin'))
        .rejects.toThrow(ConflictError);
    });

    it('should soft delete on success', async () => {
      repo.FindById.mockResolvedValue(mockUser);
      repo.SoftDelete.mockResolvedValue(true);
      await svc.SoftDelete('user-1', { version: 1 }, 'admin');
      expect(mockAuditService.Insert).toHaveBeenCalledWith(
        'DELETE', 'users', 'user-1', 'admin', mockUser, null, undefined,
      );
    });
  });

  describe('Deactivate', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.FindById.mockResolvedValue(null);
      await expect(svc.Deactivate('nonexistent', 'admin'))
        .rejects.toThrow(NotFoundError);
    });

    it('should toggle isActive', async () => {
      repo.FindById.mockResolvedValue(mockUser);
      repo.Update.mockResolvedValue({ ...mockUser, isActive: false, version: 2 });
      const result = await svc.Deactivate('user-1', 'admin');
      expect(result.isActive).toBe(false);
      expect(mockAuditService.Insert).toHaveBeenCalledWith(
        'DEACTIVATE', 'users', 'user-1', 'admin', mockUser, expect.any(Object), undefined,
      );
    });

    it('should activate inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      repo.FindById.mockResolvedValue(inactiveUser);
      repo.Update.mockResolvedValue({ ...inactiveUser, isActive: true, version: 2 });
      const result = await svc.Deactivate('user-1', 'admin');
      expect(result.isActive).toBe(true);
      expect(mockAuditService.Insert).toHaveBeenCalledWith(
        'ACTIVATE', 'users', 'user-1', 'admin', inactiveUser, expect.any(Object), undefined,
      );
    });
  });
});
