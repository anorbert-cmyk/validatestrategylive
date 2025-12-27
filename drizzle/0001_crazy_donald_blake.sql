CREATE TABLE `admin_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`label` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_wallets_walletAddress_unique` UNIQUE(`walletAddress`)
);
--> statement-breakpoint
CREATE TABLE `analysis_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`tier` enum('standard','medium','full') NOT NULL,
	`problemStatement` text NOT NULL,
	`singleResult` text,
	`part1` text,
	`part2` text,
	`part3` text,
	`part4` text,
	`fullMarkdown` text,
	`totalTokens` int,
	`generatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysis_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`problemStatement` text NOT NULL,
	`tier` enum('standard','medium','full') NOT NULL,
	`status` enum('pending_payment','processing','completed','failed') NOT NULL DEFAULT 'pending_payment',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analysis_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `analysis_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `platform_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`totalRevenueUsd` decimal(12,2) DEFAULT '0',
	`totalRevenueCrypto` decimal(18,8) DEFAULT '0',
	`countStandard` int DEFAULT 0,
	`countMedium` int DEFAULT 0,
	`countFull` int DEFAULT 0,
	`landingViews` int DEFAULT 0,
	`paymentStarted` int DEFAULT 0,
	`paymentCompleted` int DEFAULT 0,
	CONSTRAINT `platform_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`tier` enum('standard','medium','full') NOT NULL,
	`amountUsd` decimal(10,2) NOT NULL,
	`amountCrypto` decimal(18,8),
	`cryptoCurrency` varchar(10),
	`paymentMethod` enum('stripe','coinbase') NOT NULL,
	`paymentStatus` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`coinbaseChargeId` varchar(255),
	`coinbaseChargeCode` varchar(64),
	`walletAddress` varchar(42),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `used_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signature` varchar(255) NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `used_signatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `used_signatures_signature_unique` UNIQUE(`signature`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(42);--> statement-breakpoint
ALTER TABLE `analysis_results` ADD CONSTRAINT `analysis_results_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analysis_sessions` ADD CONSTRAINT `analysis_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;