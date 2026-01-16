CREATE TABLE `admin_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminWallet` varchar(42) NOT NULL,
	`action` enum('view_analysis','view_partial_results','trigger_regeneration','pause_operation','resume_operation','cancel_operation','modify_priority','acknowledge_alert','reset_circuit_breaker','export_data','other') NOT NULL,
	`targetType` enum('analysis','operation','user','system') NOT NULL,
	`targetId` varchar(64),
	`requestDetails` json,
	`success` boolean NOT NULL DEFAULT true,
	`resultDetails` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`challenge` varchar(64) NOT NULL,
	`timestamp` bigint NOT NULL,
	`expiresAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_challenges_walletAddress_unique` UNIQUE(`walletAddress`)
);
--> statement-breakpoint
CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationType` enum('circuit_breaker_open','high_failure_rate','critical_error','system_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`metadata` json,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	`acknowledgedBy` varchar(42),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `analysis_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`tier` enum('standard','medium','full') NOT NULL,
	`eventType` enum('request','part_complete','success','failure','retry','partial_success') NOT NULL,
	`durationMs` int,
	`partNumber` int,
	`errorCode` varchar(64),
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysis_operation_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`eventType` enum('operation_started','part_started','part_completed','part_failed','operation_completed','operation_failed','operation_paused','operation_resumed','operation_cancelled','operation_retried','admin_intervention') NOT NULL,
	`partNumber` int,
	`previousState` varchar(32),
	`newState` varchar(32),
	`errorCode` varchar(64),
	`errorMessage` text,
	`durationMs` int,
	`tokenCount` int,
	`actorType` enum('system','admin','user') NOT NULL DEFAULT 'system',
	`actorId` varchar(64),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_operation_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysis_operations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`operationId` varchar(64) NOT NULL,
	`tier` enum('standard','medium','full') NOT NULL,
	`operationState` enum('initialized','generating','part_completed','paused','failed','completed','cancelled') NOT NULL DEFAULT 'initialized',
	`totalParts` int NOT NULL,
	`completedParts` int NOT NULL DEFAULT 0,
	`currentPart` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`lastPartCompletedAt` timestamp,
	`completedAt` timestamp,
	`estimatedCompletionAt` timestamp,
	`lastError` text,
	`lastErrorAt` timestamp,
	`failedPart` int,
	`retryCount` int NOT NULL DEFAULT 0,
	`triggeredBy` enum('user','system','admin','retry_queue') NOT NULL DEFAULT 'user',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analysis_operations_id` PRIMARY KEY(`id`),
	CONSTRAINT `analysis_operations_operationId_unique` UNIQUE(`operationId`)
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
	`part5` text,
	`part6` text,
	`fullMarkdown` text,
	`totalTokens` int,
	`currentPart` int DEFAULT 0,
	`progressStatus` enum('pending','in_progress','completed','failed') DEFAULT 'pending',
	`part1StartedAt` timestamp,
	`part1CompletedAt` timestamp,
	`part2StartedAt` timestamp,
	`part2CompletedAt` timestamp,
	`part3StartedAt` timestamp,
	`part3CompletedAt` timestamp,
	`part4StartedAt` timestamp,
	`part4CompletedAt` timestamp,
	`part5StartedAt` timestamp,
	`part5CompletedAt` timestamp,
	`part6StartedAt` timestamp,
	`part6CompletedAt` timestamp,
	`estimatedCompletionAt` timestamp,
	`generatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysis_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`email` varchar(320),
	`problemStatement` text NOT NULL,
	`tier` enum('standard','medium','full') NOT NULL,
	`status` enum('pending_payment','processing','completed','failed') NOT NULL DEFAULT 'pending_payment',
	`isPriority` boolean NOT NULL DEFAULT false,
	`prioritySource` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analysis_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `analysis_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `circuit_breaker_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceName` varchar(64) NOT NULL,
	`cbState` enum('closed','open','half_open') NOT NULL DEFAULT 'closed',
	`failureCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`lastFailureAt` timestamp,
	`lastSuccessAt` timestamp,
	`openedAt` timestamp,
	`halfOpenAt` timestamp,
	`resetAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `circuit_breaker_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `circuit_breaker_state_serviceName_unique` UNIQUE(`serviceName`)
);
--> statement-breakpoint
CREATE TABLE `email_opens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackingId` varchar(64) NOT NULL,
	`subscriberId` int,
	`email` varchar(320) NOT NULL,
	`emailNumber` int NOT NULL,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`userAgent` text,
	`ipAddress` varchar(45),
	CONSTRAINT `email_opens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_opens_trackingId_unique` UNIQUE(`trackingId`)
);
--> statement-breakpoint
CREATE TABLE `email_sequence_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`email1SentAt` timestamp,
	`email1OpenedAt` timestamp,
	`email1ClickedAt` timestamp,
	`email2SentAt` timestamp,
	`email2OpenedAt` timestamp,
	`email2ClickedAt` timestamp,
	`email3SentAt` timestamp,
	`email3OpenedAt` timestamp,
	`email3ClickedAt` timestamp,
	`email4SentAt` timestamp,
	`email4OpenedAt` timestamp,
	`email4ClickedAt` timestamp,
	`convertedAt` timestamp,
	`conversionSessionId` varchar(64),
	`unsubscribedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sequence_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'demo_gate',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`unsubscribedAt` timestamp,
	`verificationToken` varchar(64),
	`verificationSentAt` timestamp,
	`isVerified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	CONSTRAINT `email_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `hourly_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hourStart` timestamp NOT NULL,
	`totalRequests` int NOT NULL DEFAULT 0,
	`successfulRequests` int NOT NULL DEFAULT 0,
	`failedRequests` int NOT NULL DEFAULT 0,
	`partialSuccesses` int NOT NULL DEFAULT 0,
	`retriedRequests` int NOT NULL DEFAULT 0,
	`avgDurationMs` int,
	`p50DurationMs` int,
	`p95DurationMs` int,
	`p99DurationMs` int,
	`tierStandard` int NOT NULL DEFAULT 0,
	`tierMedium` int NOT NULL DEFAULT 0,
	`tierFull` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hourly_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `magic_link_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`sessionId` varchar(64),
	`purchaseId` int,
	`isUsed` boolean NOT NULL DEFAULT false,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `magic_link_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `magic_link_tokens_token_unique` UNIQUE(`token`)
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
CREATE TABLE `processed_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookId` varchar(255) NOT NULL,
	`paymentProvider` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`paymentId` varchar(255),
	`status` varchar(64) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processed_webhooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `processed_webhooks_webhookId_unique` UNIQUE(`webhookId`)
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
	`paymentMethod` enum('stripe','coinbase','paypal','lemonsqueezy','nowpayments') NOT NULL,
	`paymentStatus` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`coinbaseChargeId` varchar(255),
	`coinbaseChargeCode` varchar(64),
	`paypalOrderId` varchar(64),
	`paypalCaptureId` varchar(64),
	`walletAddress` varchar(42),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retry_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`tier` enum('standard','medium','full') NOT NULL,
	`problemStatement` text NOT NULL,
	`email` varchar(320),
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 5,
	`priority` int NOT NULL DEFAULT 1,
	`lastError` text,
	`lastAttemptAt` timestamp,
	`nextRetryAt` timestamp,
	`queueStatus` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `retry_queue_id` PRIMARY KEY(`id`),
	CONSTRAINT `retry_queue_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `siwe_nonces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nonce` varchar(64) NOT NULL,
	`walletAddress` varchar(42),
	`isUsed` boolean NOT NULL DEFAULT false,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siwe_nonces_id` PRIMARY KEY(`id`),
	CONSTRAINT `siwe_nonces_nonce_unique` UNIQUE(`nonce`)
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`walletAddress` varchar(42),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
