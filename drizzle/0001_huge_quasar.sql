CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`keyPrefix` varchar(12) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`billingCycleStart` timestamp NOT NULL,
	`billingCycleEnd` timestamp NOT NULL,
	`totalRequests` int NOT NULL DEFAULT 0,
	`quotaLimit` int NOT NULL DEFAULT 10000,
	`totalCost` bigint DEFAULT 0,
	`status` enum('active','exceeded','paid') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`environment` enum('development','staging','production') NOT NULL DEFAULT 'development',
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`apiKeyId` int,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL,
	`statusCode` int NOT NULL,
	`responseTimeMs` int,
	`inputTokens` int DEFAULT 0,
	`outputTokens` int DEFAULT 0,
	`cost` bigint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_logs_id` PRIMARY KEY(`id`)
);
