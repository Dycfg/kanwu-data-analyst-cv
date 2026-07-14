import type { AdminUser } from "./auth-store";

export type AuditRuntimeEnv = {
  DB?: D1Database;
};

export type AdminAuditLog = {
  id: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetLabel: string;
  details: string | null;
  createdAt: string;
};

type AuditLogRow = {
  id: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetLabel: string;
  details: string | null;
  createdAt: string;
};

export async function ensureAuditLogTable(db: D1Database) {
  await db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS admin_audit_logs (id TEXT PRIMARY KEY, actor_id TEXT, actor_username TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT, target_label TEXT NOT NULL, details TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    ),
    db.prepare("CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON admin_audit_logs(created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx ON admin_audit_logs(actor_username)"),
  ]);
}

export async function writeAuditLog(
  db: D1Database | undefined,
  input: {
    actor: AdminUser;
    action: string;
    targetType: string;
    targetId?: string | null;
    targetLabel: string;
    details?: string | null;
  }
) {
  if (!db) {
    return;
  }

  await ensureAuditLogTable(db);

  await db
    .prepare(
      "INSERT INTO admin_audit_logs (id, actor_id, actor_username, action, target_type, target_id, target_label, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .bind(
      crypto.randomUUID(),
      input.actor.id,
      input.actor.username,
      input.action,
      input.targetType,
      input.targetId ?? null,
      input.targetLabel,
      input.details ?? null
    )
    .run();
}

export async function readAuditLogs(db: D1Database | undefined, limit = 20): Promise<AdminAuditLog[]> {
  if (!db) {
    return [];
  }

  await ensureAuditLogTable(db);

  const rows = await db
    .prepare(
      "SELECT id, actor_username AS actorUsername, action, target_type AS targetType, target_label AS targetLabel, details, created_at AS createdAt FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?"
    )
    .bind(Math.max(1, Math.min(limit, 50)))
    .all<AuditLogRow>();

  return rows.results ?? [];
}
