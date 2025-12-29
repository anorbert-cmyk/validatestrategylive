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
ALTER TABLE `analysis_sessions` ADD `isPriority` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `analysis_sessions` ADD `prioritySource` varchar(64);--> statement-breakpoint
ALTER TABLE `email_sequence_status` ADD CONSTRAINT `email_sequence_status_subscriberId_email_subscribers_id_fk` FOREIGN KEY (`subscriberId`) REFERENCES `email_subscribers`(`id`) ON DELETE no action ON UPDATE no action;