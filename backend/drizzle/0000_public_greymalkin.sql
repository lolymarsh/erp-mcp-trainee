CREATE TABLE `categories` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(36) NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(255),
	`address` text,
	`version` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` varchar(36) NOT NULL,
	`invoice_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(12,2) NOT NULL,
	`total` decimal(12,2) NOT NULL,
	CONSTRAINT `invoice_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(36) NOT NULL,
	`invoice_number` varchar(50) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`vehicle_id` varchar(36),
	`total_amount` decimal(12,2) NOT NULL DEFAULT '0',
	`discount` decimal(12,2) NOT NULL DEFAULT '0',
	`tax` decimal(12,2) NOT NULL DEFAULT '0',
	`grand_total` decimal(12,2) NOT NULL DEFAULT '0',
	`payment_status` enum('PENDING','PAID','PARTIAL','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`payment_method` enum('CASH','BANK_TRANSFER','CREDIT','PROMPTPAY'),
	`version` int NOT NULL DEFAULT 1,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `job_status_logs` (
	`id` varchar(36) NOT NULL,
	`job_id` varchar(36) NOT NULL,
	`from_status` enum('QUEUED','IN_PROGRESS','COMPLETED','CANCELLED'),
	`to_status` enum('QUEUED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL,
	`changed_by` varchar(36) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_status_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`vehicle_id` varchar(36) NOT NULL,
	`invoice_id` varchar(36),
	`job_type` enum('INSTALL','REPAIR','INSPECT') NOT NULL,
	`status` enum('QUEUED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'QUEUED',
	`scheduled_date` timestamp,
	`start_time` timestamp,
	`end_time` timestamp,
	`technician_id` varchar(36),
	`notes` text,
	`version` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`sku` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`unit` varchar(50) NOT NULL DEFAULT 'piece',
	`cost_price` decimal(12,2) NOT NULL DEFAULT '0',
	`sell_price` decimal(12,2) NOT NULL DEFAULT '0',
	`min_stock` int NOT NULL DEFAULT 0,
	`current_stock` int NOT NULL DEFAULT 0,
	`version` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`type` enum('IN','OUT','ADJUST') NOT NULL,
	`quantity` int NOT NULL,
	`reference_type` varchar(50),
	`reference_id` varchar(36),
	`created_by` varchar(36) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`display_name` varchar(255) NOT NULL,
	`role` enum('ADMIN','MANAGER','STAFF','TECHNICIAN') NOT NULL DEFAULT 'STAFF',
	`is_active` boolean NOT NULL DEFAULT true,
	`version` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`license_plate` varchar(50) NOT NULL,
	`brand` varchar(255) NOT NULL,
	`model` varchar(255) NOT NULL,
	`year` int,
	`engine_type` varchar(100),
	`fuel_type` varchar(100),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_customers_phone` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_customers_name` ON `customers` (`first_name`,`last_name`);--> statement-breakpoint
CREATE INDEX `idx_invitem_invoice` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_customer` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_number` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `idx_joblog_job` ON `job_status_logs` (`job_id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_customer` ON `jobs` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_technician` ON `jobs` (`technician_id`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_products_sku` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_stock_product` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_vehicles_customer` ON `vehicles` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_vehicles_plate` ON `vehicles` (`license_plate`);