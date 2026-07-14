import { env } from "cloudflare:workers";
import { requireSuperAdmin, type AuthRuntimeEnv } from "../../../server/auth-store";
import { readAuditLogs, type AuditRuntimeEnv } from "../../../server/audit-log-store";

type RuntimeEnv = AuthRuntimeEnv & AuditRuntimeEnv;

function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export async function GET(request: Request) {
  const db = runtimeEnv().DB;

  if (!db) {
    return Response.json({ error: "Login database is not configured." }, { status: 503 });
  }

  const auth = await requireSuperAdmin(db, request);

  if ("response" in auth) {
    return auth.response;
  }

  return Response.json({ logs: await readAuditLogs(db) });
}
