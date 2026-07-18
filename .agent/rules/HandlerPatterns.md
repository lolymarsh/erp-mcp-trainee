---
trigger: always_on
---

# Express Handler Patterns

## 1. Handler Class + Constructor

```ts
import { Request, Response, NextFunction } from 'express';
import { IUserService } from './service';
import { logger } from '../../config/logger';

export class UserHandler {
  constructor(private svc: IUserService) {}

  // ... handler methods
}
```

## 2. Standard Handler Flow

```
Parse Input → Validate (Zod) → Call Service → Format Response
```

```ts
getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;          // from auth middleware
    const profile = await this.svc.getProfile(userId);
    return sendSuccess(res, 200, 'success', { data: profile });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message);
    }
    logger.error('getProfile failed', err);
    return sendError(res, 500, 'Internal server error');
  }
};
```

## 3. Filter Endpoint (POST with body)

```ts
filterCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Zod validates pagination + filters in one shot
    const filters = filterRequestSchema.parse(req.body);
    const { data, total } = await this.svc.filterCustomers(filters);
    const pagination = calculatePagination(filters.page, filters.pageSize, total);
    return sendSuccess(res, 200, 'success', { data, pagination });
  } catch (err) {
    if (err instanceof ZodError) {
      return sendError(res, 400, 'Validation error', err.errors);
    }
    if (err instanceof AppError) return sendError(res, err.statusCode, err.message);
    logger.error('filterCustomers failed', err);
    return sendError(res, 500, 'Internal server error');
  }
};
```

## 4. Create Endpoint

```ts
createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCustomerSchema.parse(req.body);
    const customer = await this.svc.create(input);
    return sendSuccess(res, 201, 'created', { data: customer });
  } catch (err) {
    if (err instanceof ZodError) return sendError(res, 400, 'Validation error', err.errors);
    if (err instanceof AppError) return sendError(res, err.statusCode, err.message);
    logger.error('createCustomer failed', err);
    return sendError(res, 500, 'Internal server error');
  }
};
```

## 5. Update Endpoint (with version check)

```ts
updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateCustomerSchema.parse(req.body);  // Zod validates version present
    const customer = await this.svc.update(req.params.id, input);
    return sendSuccess(res, 200, 'updated', { data: customer });
  } catch (err) {
    if (err instanceof ZodError) return sendError(res, 400, 'Validation error', err.errors);
    if (err instanceof ConflictError) {
      return sendError(res, 409, err.message, err.data);  // version mismatch
    }
    if (err instanceof NotFoundError) return sendError(res, 404, err.message);
    logger.error('updateCustomer failed', err);
    return sendError(res, 500, 'Internal server error');
  }
};
```

## 6. Get by ID

```ts
getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await this.svc.getById(req.params.id);
    return sendSuccess(res, 200, 'success', { data: customer });
  } catch (err) {
    if (err instanceof NotFoundError) return sendError(res, 404, err.message);
    logger.error('getById failed', err);
    return sendError(res, 500, 'Internal server error');
  }
};
```

## 7. Route Registration

```ts
// route.ts — matches Go's RegisterRoutes pattern
import { Router } from 'express';
import { UserHandler } from './handler';
import { authMiddleware } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validator';
import { createUserSchema, loginSchema } from './schema';

export function registerUserRoutes(handler: UserHandler): Router {
  const router = Router();

  // Public
  router.post('/login', validate(loginSchema), handler.login);

  // Authenticated
  router.get('/profile', authMiddleware, handler.getProfile);

  // Admin
  router.post('/', authMiddleware('ADMIN'), validate(createUserSchema), handler.createUser);

  return router;
}
```

## 8. ZodError handling (in middleware)

```ts
// shared/middleware/validator.ts
import { z } from 'zod';

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return sendError(res, 400, 'Validation error', err.errors);
      }
      next(err);
    }
  };
}
```
