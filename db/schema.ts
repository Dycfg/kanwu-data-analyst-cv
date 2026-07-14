import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteContent = sqliteTable("site_content", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["super_admin", "admin"] }).notNull().default("admin"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminSessions = sqliteTable(
  "admin_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("admin_sessions_user_id_idx").on(table.userId),
    index("admin_sessions_expires_at_idx").on(table.expiresAt),
  ]
);

export const trafficEvents = sqliteTable(
  "traffic_events",
  {
    id: text("id").primaryKey(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    country: text("country"),
    device: text("device").notNull(),
    browser: text("browser").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    eventType: text("event_type", { enum: ["page_view", "cv_download", "contact_click"] }).notNull().default("page_view"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("traffic_events_created_at_idx").on(table.createdAt),
    index("traffic_events_path_idx").on(table.path),
    index("traffic_events_visitor_hash_idx").on(table.visitorHash),
    index("traffic_events_event_type_idx").on(table.eventType),
  ]
);

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    actorUsername: text("actor_username").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    targetLabel: text("target_label").notNull(),
    details: text("details"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("admin_audit_logs_created_at_idx").on(table.createdAt),
    index("admin_audit_logs_actor_idx").on(table.actorUsername),
  ]
);
