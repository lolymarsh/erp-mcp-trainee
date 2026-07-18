/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserService } from './service';
import type { IUserRepository } from './repo';
import type Redis from 'ioredis';
import { UnauthorizedError, NotFoundError } from '../../shared/errors/AppError';

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

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
    } as any;
    svc = new UserService(repo, redis);
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
      })).rejects.toThrow('Username already exists');
    });

    it('should create and return user', async () => {
      repo.findByUsername.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser);

      const result = await svc.createUser({
        username: 'admin',
        password: 'password123',
        displayName: 'Admin',
        role: 'ADMIN',
      });

      expect(result.username).toBe('admin');
      expect(repo.create).toHaveBeenCalled();
    });
  });
});
