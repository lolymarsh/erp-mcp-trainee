import type { Express } from "express";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type Redis from "ioredis";
import type { Db } from "mongodb";
import type { Pool } from "mysql2/promise";
import type { RabbitMQConnection } from "./config/rabbitmq";
import { UserRepository } from "./modules/user/repo";
import { UserService } from "./modules/user/service";
import { UserHandler } from "./modules/user/handler";
import { RegisterUserRoutes } from "./modules/user/route";
import { CustomerRepository } from "./modules/customer/repo";
import { CustomerService } from "./modules/customer/service";
import { CustomerHandler } from "./modules/customer/handler";
import { RegisterCustomerRoutes } from "./modules/customer/route";
import { InventoryRepository } from "./modules/inventory/repo";
import { InventoryService } from "./modules/inventory/service";
import { InventoryHandler } from "./modules/inventory/handler";
import { RegisterInventoryRoutes } from "./modules/inventory/route";
import { InvoiceRepository } from "./modules/invoice/repo";
import { InvoiceService } from "./modules/invoice/service";
import { InvoiceHandler } from "./modules/invoice/handler";
import { RegisterInvoiceRoutes } from "./modules/invoice/route";
import { JobRepository } from "./modules/job/repo";
import { JobService } from "./modules/job/service";
import { JobHandler } from "./modules/job/handler";
import { RegisterJobRoutes } from "./modules/job/route";
import { ChatService } from "./modules/chat/service";
import { ChatHandler } from "./modules/chat/handler";
import { RegisterChatRoutes } from "./modules/chat/route";
import { DashboardRepository } from "./modules/dashboard/repo";
import { DashboardService } from "./modules/dashboard/service";
import { DashboardHandler } from "./modules/dashboard/handler";
import { RegisterDashboardRoutes } from "./modules/dashboard/route";
import { AuditLogRepository } from "./modules/audit/repo_mongo";
import { AuditLogService } from "./modules/audit/service";
import { AuditLogHandler } from "./modules/audit/handler";
import { RegisterAuditLogRoutes } from "./modules/audit/route";
import { CreateAuthMiddleware } from "./shared/middleware/auth";
import { logger } from "./config/logger";

export interface AppDependencies {
  db: MySql2Database;
  pool: Pool;
  redis: Redis;
  mongoDb: Db;
  rmq: RabbitMQConnection;
}

export function SetupRoutes(app: Express, deps: AppDependencies): void {
  const auth = CreateAuthMiddleware(deps.redis);

  const auditRepo = new AuditLogRepository(deps.mongoDb);
  const auditSvc = new AuditLogService(auditRepo);
  const auditHandler = new AuditLogHandler(auditSvc);
  app.use("/api/audit-log", RegisterAuditLogRoutes(auditHandler, auth));

  const userRepo = new UserRepository(deps.db);
  const userSvc = new UserService(userRepo, deps.redis, auditSvc);
  const userHandler = new UserHandler(userSvc);
  app.use("/api/auth", RegisterUserRoutes(userHandler, auth));

  const customerRepo = new CustomerRepository(deps.db);
  const customerSvc = new CustomerService(customerRepo, auditSvc);
  const customerHandler = new CustomerHandler(customerSvc);
  app.use("/api/customers", RegisterCustomerRoutes(customerHandler, auth));

  const inventoryRepo = new InventoryRepository(deps.db);
  const inventorySvc = new InventoryService(
    inventoryRepo,
    deps.db,
    deps.redis,
    auditSvc,
  );
  const inventoryHandler = new InventoryHandler(inventorySvc);
  app.use("/api/inventory", RegisterInventoryRoutes(inventoryHandler, auth));

  const invoiceRepo = new InvoiceRepository(deps.db);
  const invoiceSvc = new InvoiceService(
    invoiceRepo,
    customerRepo,
    inventoryRepo,
    deps.redis,
    auditSvc,
  );
  const invoiceHandler = new InvoiceHandler(invoiceSvc);
  app.use("/api/sales/invoices", RegisterInvoiceRoutes(invoiceHandler, auth));

  const jobRepo = new JobRepository(deps.db);
  const jobSvc = new JobService(jobRepo, customerRepo, deps.redis, auditSvc);
  const jobHandler = new JobHandler(jobSvc);
  app.use("/api/jobs", RegisterJobRoutes(jobHandler, auth));

  const chatSvc = new ChatService(deps.pool, deps.redis, deps.mongoDb, deps.rmq);
  const chatHandler = new ChatHandler(chatSvc);
  app.use("/api/chat", RegisterChatRoutes(chatHandler, auth));

  const dashboardRepo = new DashboardRepository(deps.db);
  const dashboardSvc = new DashboardService(dashboardRepo, deps.redis);
  const dashboardHandler = new DashboardHandler(dashboardSvc);
  app.use("/api/dashboard", RegisterDashboardRoutes(dashboardHandler, auth));

  logger.info("Routes initialized");
}
