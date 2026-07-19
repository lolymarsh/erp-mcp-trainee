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
  const mockAuditService = { insertAuditLog: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFiltered: jest.fn(),
      softDelete: jest.fn(),
      findAll: jest.fn(),
    };
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
    } as any;
    svc = new UserService(repo, redis, mockAuditService as any);
  });

  describe('login', () => {
    it('should throw UnauthorizedError when user not found', async () => {
      repo.findByUsername.mockResolvedValue(null);
      await expect(svc.login({ username: 'unknown', password: 'pass' }))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      repo.findByUsername.mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$correcthash',
      });
      await expect(svc.login({ username: 'admin', password: 'wrongpass' }))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when account is inactive', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('password123', 4);
      repo.findByUsername.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        isActive: false,
      });
      await expect(svc.login({ username: 'admin', password: 'password123' }))
        .rejects.toThrow('Account is disabled');
    });

    it('should return token and user on success', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('password123', 4);
      repo.findByUsername.mockResolvedValue({ ...mockUser, passwordHash: hash });

      const result = await svc.login({ username: 'admin', password: 'password123' });

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

  describe('getProfile', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(svc.getProfile('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should return user response on success', async () => {
      repo.findById.mockResolvedValue(mockUser);
      const result = await svc.getProfile('user-1');
      expect(result.id).toBe('user-1');
      expect(result.displayName).toBe('Admin');
    });
  });

  describe('createUser', () => {
    it('should throw when username already exists', async () => {
      repo.findByUsername.mockResolvedValue(mockUser);
      await expect(svc.createUser({
        username: 'admin',
        password: 'password123',
        displayName: 'Admin',
        role: 'ADMIN',
      }, 'admin-user-id')).rejects.toThrow('Username already exists');
    });

    it('should create and return user', async () => {
      repo.findByUsername.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser);

      const result = await svc.createUser({
        username: 'admin',
        password: 'password123',
        displayName: 'Admin',
        role: 'ADMIN',
      }, 'admin-user-id');

      expect(result.username).toBe('admin');
      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('filter', () => {
    it('should return paginated results', async () => {
      repo.findFiltered.mockResolvedValue({ data: [mockUser], total: 1 });
      const result = await svc.filter({ page: 1, pageSize: 20, sortBy: 'desc' });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalData).toBe(1);
    });
  });

  describe('update', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(svc.update('nonexistent', { displayName: 'New', version: 1 }, 'admin'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError on version mismatch', async () => {
      repo.findById.mockResolvedValue(mockUser);
      repo.update.mockResolvedValue(null);
      await expect(svc.update('user-1', { displayName: 'New', version: 99 }, 'admin'))
        .rejects.toThrow(ConflictError);
    });

    it('should update and return user on success', async () => {
      repo.findById.mockResolvedValue(mockUser);
      repo.update.mockResolvedValue({ ...mockUser, displayName: 'Updated', version: 2 });
      const result = await svc.update('user-1', { displayName: 'Updated', version: 1 }, 'admin');
      expect(result.displayName).toBe('Updated');
      expect(mockAuditService.insertAuditLog).toHaveBeenCalledWith(
        'UPDATE', 'users', 'user-1', 'admin', mockUser, expect.any(Object), undefined,
      );
    });
  });

  describe('softDelete', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(svc.softDelete('nonexistent', { version: 1 }, 'admin'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError on version mismatch', async () => {
      repo.findById.mockResolvedValue(mockUser);
      repo.softDelete.mockResolvedValue(false);
      await expect(svc.softDelete('user-1', { version: 99 }, 'admin'))
        .rejects.toThrow(ConflictError);
    });

    it('should soft delete on success', async () => {
      repo.findById.mockResolvedValue(mockUser);
      repo.softDelete.mockResolvedValue(true);
      await svc.softDelete('user-1', { version: 1 }, 'admin');
      expect(mockAuditService.insertAuditLog).toHaveBeenCalledWith(
        'DELETE', 'users', 'user-1', 'admin', mockUser, null, undefined,
      );
    });
  });

  describe('deactivate', () => {
    it('should throw NotFoundError when user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(svc.deactivate('nonexistent', 'admin'))
        .rejects.toThrow(NotFoundError);
    });

    it('should toggle isActive', async () => {
      repo.findById.mockResolvedValue(mockUser);
      repo.update.mockResolvedValue({ ...mockUser, isActive: false, version: 2 });
      const result = await svc.deactivate('user-1', 'admin');
      expect(result.isActive).toBe(false);
      expect(mockAuditService.insertAuditLog).toHaveBeenCalledWith(
        'DEACTIVATE', 'users', 'user-1', 'admin', mockUser, expect.any(Object), undefined,
      );
    });

    it('should activate inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      repo.findById.mockResolvedValue(inactiveUser);
      repo.update.mockResolvedValue({ ...inactiveUser, isActive: true, version: 2 });
      const result = await svc.deactivate('user-1', 'admin');
      expect(result.isActive).toBe(true);
      expect(mockAuditService.insertAuditLog).toHaveBeenCalledWith(
        'ACTIVATE', 'users', 'user-1', 'admin', inactiveUser, expect.any(Object), undefined,
      );
    });
  });
});
