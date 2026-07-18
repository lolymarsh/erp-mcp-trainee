import type { Express } from "express";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type Redis from "ioredis";
import type { Db } from "mongodb";
import type { Pool } from "mysql2/promise";
import type { RabbitMQConnection } from "./config/rabbitmq";
import { UserRepository } from "./modules/user/repo";
import { UserService } from "./modules/user/service";
import { UserHandler } from "./modules/user/handler";
import { registerUserRoutes } from "./modules/user/route";
import { CustomerRepository } from "./modules/customer/repo";
import { CustomerService } from "./modules/customer/service";
import { CustomerHandler } from "./modules/customer/handler";
import { registerCustomerRoutes } from "./modules/customer/route";
import { InventoryRepository } from "./modules/inventory/repo";
import { InventoryService } from "./modules/inventory/service";
import { InventoryHandler } from "./modules/inventory/handler";
import { registerInventoryRoutes } from "./modules/inventory/route";
import { InvoiceRepository } from "./modules/invoice/repo";
import { InvoiceService } from "./modules/invoice/service";
import { InvoiceHandler } from "./modules/invoice/handler";
import { registerInvoiceRoutes } from "./modules/invoice/route";
import { JobRepository } from "./modules/job/repo";
import { JobService } from "./modules/job/service";
import { JobHandler } from "./modules/job/handler";
import { registerJobRoutes } from "./modules/job/route";
import { ChatService } from "./modules/chat/service";
import { ChatHandler } from "./modules/chat/handler";
import { registerChatRoutes } from "./modules/chat/route";
import { DashboardRepository } from "./modules/dashboard/repo";
import { DashboardService } from "./modules/dashboard/service";
import { DashboardHandler } from "./modules/dashboard/handler";
import { registerDashboardRoutes } from "./modules/dashboard/route";
import { createAuthMiddleware } from "./shared/middleware/auth";
import { logger } from "./config/logger";

export interface AppDependencies {
  db: MySql2Database;
  pool: Pool;
  redis: Redis;
  mongoDb: Db;
  rmq: RabbitMQConnection;
}

export function setupRoutes(app: Express, deps: AppDependencies): void {
  const auth = createAuthMiddleware(deps.redis);

  const userRepo = new UserRepository(deps.db);
  const userSvc = new UserService(userRepo, deps.redis);
  const userHandler = new UserHandler(userSvc);
  app.use("/api/auth", registerUserRoutes(userHandler, auth));

  const customerRepo = new CustomerRepository(deps.db);
  const customerSvc = new CustomerService(customerRepo);
  const customerHandler = new CustomerHandler(customerSvc);
  app.use("/api/customers", registerCustomerRoutes(customerHandler, auth));

  const inventoryRepo = new InventoryRepository(deps.db);
  const inventorySvc = new InventoryService(inventoryRepo, deps.redis);
  const inventoryHandler = new InventoryHandler(inventorySvc);
  app.use("/api/inventory", registerInventoryRoutes(inventoryHandler, auth));

  const invoiceRepo = new InvoiceRepository(deps.db);
  const invoiceSvc = new InvoiceService(invoiceRepo, deps.db, deps.redis);
  const invoiceHandler = new InvoiceHandler(invoiceSvc);
  app.use("/api/sales/invoices", registerInvoiceRoutes(invoiceHandler, auth));

  const jobRepo = new JobRepository(deps.db);
  const jobSvc = new JobService(jobRepo, deps.db, deps.redis);
  const jobHandler = new JobHandler(jobSvc);
  app.use("/api/jobs", registerJobRoutes(jobHandler, auth));

  const chatSvc = new ChatService(deps.pool, deps.redis, deps.mongoDb, deps.rmq);
  const chatHandler = new ChatHandler(chatSvc);
  app.use("/api/chat", registerChatRoutes(chatHandler, auth));

  const dashboardRepo = new DashboardRepository(deps.db);
  const dashboardSvc = new DashboardService(dashboardRepo, deps.redis);
  const dashboardHandler = new DashboardHandler(dashboardSvc);
  app.use("/api/dashboard", registerDashboardRoutes(dashboardHandler, auth));

  logger.info("Routes initialized");
}
