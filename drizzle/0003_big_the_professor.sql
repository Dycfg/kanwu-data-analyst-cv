CREATE TABLE `traffic_events` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`referrer` text,
	`country` text,
	`device` text NOT NULL,
	`browser` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `traffic_events_created_at_idx` ON `traffic_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `traffic_events_path_idx` ON `traffic_events` (`path`);--> statement-breakpoint
CREATE INDEX `traffic_events_visitor_hash_idx` ON `traffic_events` (`visitor_hash`);