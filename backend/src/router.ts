import type { Express } from 'express';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type Redis from 'ioredis';
import type { Db } from 'mongodb';
import type { RabbitMQConnection } from './config/rabbitmq';
import { UserRepository } from './modules/user/repo';
import { UserService } from './modules/user/service';
import { UserHandler } from './modules/user/handler';
import { registerUserRoutes } from './modules/user/route';
import { createAuthMiddleware } from './shared/middleware/auth';
import { logger } from './config/logger';

export interface AppDependencies {
  db: MySql2Database<Record<string, never>>;
  redis: Redis;
  mongoDb: Db;
  rmq: RabbitMQConnection;
}

export function setupRoutes(app: Express, deps: AppDependencies): void {
  const auth = createAuthMiddleware(deps.redis);

  const userRepo = new UserRepository(deps.db);
  const userSvc = new UserService(userRepo, deps.redis);
  const userHandler = new UserHandler(userSvc);
  app.use('/api/auth', registerUserRoutes(userHandler, auth));

  logger.info('Routes initialized');
}
