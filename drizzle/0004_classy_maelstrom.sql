CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_username` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`target_label` text NOT NULL,
	`details` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_created_at_idx` ON `admin_audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_actor_idx` ON `admin_audit_logs` (`actor_username`);--> statement-breakpoint
ALTER TABLE `traffic_events` ADD `event_type` text DEFAULT 'page_view' NOT NULL;--> statement-breakpoint
CREATE INDEX `traffic_events_event_type_idx` ON `traffic_events` (`event_type`);