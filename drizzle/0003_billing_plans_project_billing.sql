CREATE TABLE `billing_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`monthlyCreditQuota` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_plans_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `project_billing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`planId` int NOT NULL,
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_billing_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_billing_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
INSERT INTO `billing_plans` (`name`, `monthlyCreditQuota`) VALUES ('free', 1000);
