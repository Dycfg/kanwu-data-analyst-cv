import { env } from "cloudflare:workers";
import {
  changeOwnPassword,
  requireAdminUser,
  type AuthRuntimeEnv,
} from "../../../server/auth-store";
import { writeAuditLog, type AuditRuntimeEnv } from "../../../server/audit-log-store";

function runtimeEnv() {
  return env as unknown as AuthRuntimeEnv & AuditRuntimeEnv;
}

export async function PATCH(request: Request) {
  const db = runtimeEnv().DB;

  if (!db) {
    return Response.json({ error: "Login database is not configured." }, { status: 503 });
  }

  const auth = await requireAdminUser(db, request);

  if ("response" in auth) {
    return auth.response;
  }

  const payload = (await request.json()) as {
    currentPassword?: string;
    nextPassword?: string;
  };

  try {
    await changeOwnPassword(
      db,
      auth.user,
      payload.currentPassword ?? "",
      payload.nextPassword ?? ""
    );
    await writeAuditLog(db, {
      actor: auth.user,
      action: "password.changed",
      targetType: "admin_user",
      targetId: auth.user.id,
      targetLabel: auth.user.username,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Password update failed." },
      { status: 400 }
    );
  }

  return Response.json({ message: "Password updated." });
}
