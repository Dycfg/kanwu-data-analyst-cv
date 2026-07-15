CREATE TABLE `admin_login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`ip_address` text NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`last_failed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_login_attempts_locked_until_idx` ON `admin_login_attempts` (`locked_until`);--> statement-breakpoint
CREATE INDEX `admin_login_attempts_username_idx` ON `admin_login_attempts` (`username`);