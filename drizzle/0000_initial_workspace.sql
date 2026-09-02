CREATE TABLE `audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_tenant_id` ON `audit` (`tenant`,`id`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`customer_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`start_minute` integer NOT NULL,
	`duration` integer NOT NULL,
	`kind` text NOT NULL,
	`location` text NOT NULL,
	`address` text,
	`status` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`tenant`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant`,`customer_id`) REFERENCES `customers`(`tenant`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bookings_tenant_date` ON `bookings` (`tenant`,`date`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_tenant_id` ON `customers` (`tenant`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_tenant_phone` ON `customers` (`tenant`,`phone`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`customer_id` text NOT NULL,
	`service` text NOT NULL,
	`description` text NOT NULL,
	`measurements` text NOT NULL,
	`responsible` text NOT NULL,
	`address` text,
	`status` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant`,`customer_id`) REFERENCES `customers`(`tenant`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_tenant_id` ON `orders` (`tenant`,`id`);--> statement-breakpoint
CREATE INDEX `orders_tenant_created` ON `orders` (`tenant`,`created_at`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`order_id` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant`,`order_id`) REFERENCES `orders`(`tenant`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `photos_tenant_order` ON `photos` (`tenant`,`order_id`);
--> statement-breakpoint
CREATE TRIGGER bookings_no_overlap_insert BEFORE INSERT ON bookings
WHEN NEW.status != 'Cancelado' AND EXISTS (
 SELECT 1 FROM bookings b WHERE b.tenant=NEW.tenant AND b.date=NEW.date AND b.status!='Cancelado' AND b.id!=NEW.id
 AND NEW.start_minute < b.start_minute+b.duration AND b.start_minute < NEW.start_minute+NEW.duration
) BEGIN SELECT RAISE(ABORT, 'booking_overlap'); END;
--> statement-breakpoint
CREATE TRIGGER bookings_no_overlap_update BEFORE UPDATE ON bookings
WHEN NEW.status != 'Cancelado' AND EXISTS (
 SELECT 1 FROM bookings b WHERE b.tenant=NEW.tenant AND b.date=NEW.date AND b.status!='Cancelado' AND b.id!=NEW.id
 AND NEW.start_minute < b.start_minute+b.duration AND b.start_minute < NEW.start_minute+NEW.duration
) BEGIN SELECT RAISE(ABORT, 'booking_overlap'); END;
--> statement-breakpoint
CREATE TRIGGER photos_limit BEFORE INSERT ON photos WHEN (SELECT count(*) FROM photos WHERE tenant=NEW.tenant AND order_id=NEW.order_id)>=5 BEGIN SELECT RAISE(ABORT, 'photo_limit'); END;
--> statement-breakpoint
CREATE TRIGGER audit_customers_insert AFTER INSERT ON customers BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.tenant,'Cliente',NEW.id,'Criado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
CREATE TRIGGER audit_customers_update AFTER UPDATE ON customers BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.tenant,'Cliente',NEW.id,'Atualizado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
CREATE TRIGGER audit_orders_insert AFTER INSERT ON orders BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.tenant,'Pedido',NEW.id,'Criado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
CREATE TRIGGER audit_orders_update AFTER UPDATE ON orders BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.tenant,'Pedido',NEW.id,'Atualizado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
CREATE TRIGGER audit_bookings_insert AFTER INSERT ON bookings BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.tenant,'Agendamento',NEW.id,'Criado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
CREATE TRIGGER audit_bookings_update AFTER UPDATE ON bookings BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.tenant,'Agendamento',NEW.id,'Atualizado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
CREATE TRIGGER audit_photos_insert AFTER INSERT ON photos BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.tenant,'Foto',NEW.id,'Criado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
CREATE TRIGGER audit_companies_update AFTER UPDATE ON companies BEGIN INSERT INTO audit(tenant,entity,entity_id,action,created_at) VALUES (NEW.id,'Empresa',NEW.id,'Atualizado',strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
