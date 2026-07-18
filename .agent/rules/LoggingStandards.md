---
trigger: always_on
---

# Logging Standards

## 1. Logger Setup

```ts
// config/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

## 2. When to Log

```ts
// ✅ LOG: Errors
logger.error({ err, userId: req.user?.userId }, 'createInvoice failed');

// ✅ LOG: Critical business operations
logger.info({ invoiceId: inv.id, amount: inv.grandTotal }, 'Invoice created');

// ✅ LOG: Batch operations start/complete
logger.info({ batchSize: 100, totalBatches: 5 }, 'Batch update started');
logger.info({ processed: 100 }, 'Batch update completed');

// ✅ LOG: Async worker start/complete
logger.info({ queue: 'erp.reports.generate' }, 'Worker started');
```

## 3. When NOT to Log

```ts
// ❌ DON'T LOG: Normal CRUD success
async getCustomer(id: string): Promise<CustomerEntity> {
  const customer = await this.repo.findById(id);
  // ❌ logger.info('Customer retrieved'); — noise
  return customer;
}

// ❌ DON'T LOG: Validation errors (Zod handles these)
// Don't log — just return 400

// ❌ DON'T LOG: Every middleware call
// authMiddleware, rateLimiter — too noisy
```

## 4. Structured Logging

```ts
// ✅ Use structured fields, not string interpolation
logger.error({ userId, action: 'create_invoice', error: err.message }, 'Operation failed');

// ❌ BAD — string interpolation
logger.error(`User ${userId} failed to create invoice: ${err.message}`);
```

## 5. Layer Context

```ts
// handler.ts
logger.error({ layer: 'customer.handler', method: 'getById' }, 'Failed');

// service.ts
logger.error({ layer: 'customer.service', method: 'update' }, 'Version mismatch');

// worker.ts
logger.info({ layer: 'audit.worker', queue: 'erp.audit.log' }, 'Processing message');
```

## 6. Error Objects

```ts
// ✅ Pass error object as first argument
try {
  await riskyOperation();
} catch (err) {
  logger.error(err, 'riskyOperation failed');
  // Pino serializes Error properly: message, stack, name
}

// ❌ BAD — err.message only
logger.error(`Operation failed: ${err.message}`);
```
