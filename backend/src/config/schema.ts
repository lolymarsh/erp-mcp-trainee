import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  timestamp,
  mysqlEnum,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["ADMIN", "MANAGER", "STAFF", "TECHNICIAN"])
      .notNull()
      .default("STAFF"),
    isActive: boolean("is_active").notNull().default(true),
    version: int("version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    usernameIdx: index("idx_users_username").on(table.username),
  }),
);

export const customers = mysqlTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    version: int("version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    phoneIdx: index("idx_customers_phone").on(table.phone),
    nameIdx: index("idx_customers_name").on(table.firstName, table.lastName),
  }),
);

export const vehicles = mysqlTable(
  "vehicles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    customerId: varchar("customer_id", { length: 36 }).notNull(),
    licensePlate: varchar("license_plate", { length: 50 }).notNull(),
    brand: varchar("brand", { length: 255 }).notNull(),
    model: varchar("model", { length: 255 }).notNull(),
    year: int("year"),
    engineType: varchar("engine_type", { length: 100 }),
    fuelType: varchar("fuel_type", { length: 100 }),
  },
  (table) => ({
    customerIdx: index("idx_vehicles_customer").on(table.customerId),
    plateIdx: index("idx_vehicles_plate").on(table.licensePlate),
  }),
);

export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: int("version").notNull().default(1),
});

export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    categoryId: varchar("category_id", { length: 36 }).notNull(),
    sku: varchar("sku", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    unit: varchar("unit", { length: 50 }).notNull().default("piece"),
    costPrice: decimal("cost_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    sellPrice: decimal("sell_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    minStock: int("min_stock").notNull().default(0),
    currentStock: int("current_stock").notNull().default(0),
    version: int("version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    categoryIdx: index("idx_products_category").on(table.categoryId),
    skuIdx: uniqueIndex("idx_products_sku").on(table.sku),
  }),
);

export const stockMovements = mysqlTable(
  "stock_movements",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    productId: varchar("product_id", { length: 36 }).notNull(),
    type: mysqlEnum("type", ["IN", "OUT", "ADJUST"]).notNull(),
    quantity: int("quantity").notNull(),
    referenceType: varchar("reference_type", { length: 50 }),
    referenceId: varchar("reference_id", { length: 36 }),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("idx_stock_product").on(table.productId),
  }),
);

export const invoices = mysqlTable(
  "invoices",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    customerId: varchar("customer_id", { length: 36 }).notNull(),
    vehicleId: varchar("vehicle_id", { length: 36 }),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discount: decimal("discount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    tax: decimal("tax", { precision: 12, scale: 2 }).notNull().default("0"),
    grandTotal: decimal("grand_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    paymentStatus: mysqlEnum("payment_status", [
      "PENDING",
      "PAID",
      "PARTIAL",
      "REFUNDED",
    ])
      .notNull()
      .default("PENDING"),
    paymentMethod: mysqlEnum("payment_method", [
      "CASH",
      "BANK_TRANSFER",
      "CREDIT",
      "PROMPTPAY",
    ]),
    version: int("version").notNull().default(1),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    customerIdx: index("idx_invoices_customer").on(table.customerId),
    numberIdx: index("idx_invoices_number").on(table.invoiceNumber),
  }),
);

export const invoiceItems = mysqlTable(
  "invoice_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    invoiceId: varchar("invoice_id", { length: 36 }).notNull(),
    productId: varchar("product_id", { length: 36 }).notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => ({
    invoiceIdx: index("idx_invitem_invoice").on(table.invoiceId),
  }),
);

export const jobs = mysqlTable(
  "jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    customerId: varchar("customer_id", { length: 36 }).notNull(),
    vehicleId: varchar("vehicle_id", { length: 36 }).notNull(),
    invoiceId: varchar("invoice_id", { length: 36 }),
    jobType: mysqlEnum("job_type", ["INSTALL", "REPAIR", "INSPECT"]).notNull(),
    status: mysqlEnum("status", [
      "QUEUED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ])
      .notNull()
      .default("QUEUED"),
    scheduledDate: timestamp("scheduled_date"),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    technicianId: varchar("technician_id", { length: 36 }),
    notes: text("notes"),
    version: int("version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    customerIdx: index("idx_jobs_customer").on(table.customerId),
    statusIdx: index("idx_jobs_status").on(table.status),
    technicianIdx: index("idx_jobs_technician").on(table.technicianId),
  }),
);

export const jobStatusLogs = mysqlTable(
  "job_status_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jobId: varchar("job_id", { length: 36 }).notNull(),
    fromStatus: mysqlEnum("from_status", [
      "QUEUED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ]),
    toStatus: mysqlEnum("to_status", [
      "QUEUED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ]).notNull(),
    changedBy: varchar("changed_by", { length: 36 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    jobIdx: index("idx_joblog_job").on(table.jobId),
  }),
);
