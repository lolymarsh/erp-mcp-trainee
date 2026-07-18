/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createAuthMiddleware } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'versus-dev-secret-key';

function mockReqRes() {
  const req = { headers: {}, user: undefined } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('createAuthMiddleware', () => {
  it('should return 401 when no authorization header', async () => {
    const redis = { exists: jest.fn() } as any;
    const auth = createAuthMiddleware(redis);
    const { req, res, next } = mockReqRes();

    await auth()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is not Bearer', async () => {
    const redis = { exists: jest.fn() } as any;
    const auth = createAuthMiddleware(redis);
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Basic token123';

    await auth()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const redis = { exists: jest.fn() } as any;
    const auth = createAuthMiddleware(redis);
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Bearer invalid-token';

    await auth()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when session does not exist in redis', async () => {
    const redis = { exists: jest.fn().mockResolvedValue(0) } as any;
    const auth = createAuthMiddleware(redis);
    const { req, res, next } = mockReqRes();
    const token = jwt.sign({ userId: 'user-1', role: 'ADMIN' }, JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await auth()(req, res, next);

    expect(redis.exists).toHaveBeenCalledWith('session:user-1');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when token and session are valid', async () => {
    const redis = { exists: jest.fn().mockResolvedValue(1) } as any;
    const auth = createAuthMiddleware(redis);
    const { req, res, next } = mockReqRes();
    const token = jwt.sign({ userId: 'user-1', role: 'ADMIN' }, JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await auth()(req, res, next);

    expect(redis.exists).toHaveBeenCalledWith('session:user-1');
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ userId: 'user-1', role: 'ADMIN' });
  });

  it('should return 403 when role is not allowed', async () => {
    const redis = { exists: jest.fn().mockResolvedValue(1) } as any;
    const auth = createAuthMiddleware(redis);
    const { req, res, next } = mockReqRes();
    const token = jwt.sign({ userId: 'user-1', role: 'STAFF' }, JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await auth('ADMIN', 'MANAGER')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass when role matches allowed roles', async () => {
    const redis = { exists: jest.fn().mockResolvedValue(1) } as any;
    const auth = createAuthMiddleware(redis);
    const { req, res, next } = mockReqRes();
    const token = jwt.sign({ userId: 'user-1', role: 'MANAGER' }, JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await auth('ADMIN', 'MANAGER')(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
