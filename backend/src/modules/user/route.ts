import { Router } from 'express';
import type { UserHandler } from './handler';
import type { ReturnedAuthMiddleware } from '../../shared/middleware/auth';

export function registerUserRoutes(
  handler: UserHandler,
  auth: ReturnedAuthMiddleware,
): Router {
  const router = Router();

  router.post('/login', handler.login);
  router.get('/profile', auth(), handler.getProfile);
  router.post('/', auth('ADMIN'), handler.createUser);

  return router;
}
