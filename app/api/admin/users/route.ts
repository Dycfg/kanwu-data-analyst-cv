import { env } from "cloudflare:workers";
import {
  createAdminUser,
  listAdminUsers,
  requireSuperAdmin,
  type AdminRole,
  type AuthRuntimeEnv,
} from "../../../server/auth-store";
import { writeAuditLog, type AuditRuntimeEnv } from "../../../server/audit-log-store";

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

  return Response.json({ users: await listAdminUsers(db) });
}

export async function POST(request: Request) {
  const db = runtimeEnv().DB;

  if (!db) {
    return Response.json({ error: "Login database is not configured." }, { status: 503 });
  }

  const auth = await requireSuperAdmin(db, request);

  if ("response" in auth) {
    return auth.response;
  }

  const payload = (await request.json()) as {
    username?: string;
    password?: string;
    role?: AdminRole;
  };

  try {
    const user = await createAdminUser(db, {
      username: payload.username ?? "",
      password: payload.password ?? "",
      role: payload.role === "super_admin" ? "super_admin" : "admin",
    }, auth.user);
    await writeAuditLog(db, {
      actor: auth.user,
      action: "user.created",
      targetType: "admin_user",
      targetId: user.id,
      targetLabel: user.username,
      details: user.role,
    });

    return Response.json({ user, message: "User created." });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User creation failed." },
      { status: 400 }
    );
  }
}
