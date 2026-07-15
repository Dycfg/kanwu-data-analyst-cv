import { getRuntimeEnv } from "../../../../server/runtime-env";
import {
  deleteAdminUser,
  requireSuperAdmin,
  updateAdminUser,
  type AdminRole,
  type AuthRuntimeEnv,
} from "../../../../server/auth-store";
import { writeAuditLog, type AuditRuntimeEnv } from "../../../../server/audit-log-store";

type RuntimeEnv = AuthRuntimeEnv & AuditRuntimeEnv;

async function runtimeEnv() {
  return (await getRuntimeEnv()) as unknown as RuntimeEnv;
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const db = (await runtimeEnv()).DB;

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
    const user = await updateAdminUser(db, auth.user, context.params.id, {
      username: payload.username,
      password: payload.password || undefined,
      role: payload.role === "super_admin" ? "super_admin" : payload.role === "admin" ? "admin" : undefined,
    });

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    await writeAuditLog(db, {
      actor: auth.user,
      action: "user.updated",
      targetType: "admin_user",
      targetId: user.id,
      targetLabel: user.username,
      details: [payload.username ? "username" : "", payload.role ? "role" : "", payload.password ? "password" : ""]
        .filter(Boolean)
        .join(", "),
    });

    return Response.json({ user, message: "User updated." });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User update failed." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const db = (await runtimeEnv()).DB;

  if (!db) {
    return Response.json({ error: "Login database is not configured." }, { status: 503 });
  }

  const auth = await requireSuperAdmin(db, request);

  if ("response" in auth) {
    return auth.response;
  }

  if (auth.user.id === context.params.id) {
    return Response.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  try {
    const deleted = await deleteAdminUser(db, context.params.id);

    if (!deleted) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    await writeAuditLog(db, {
      actor: auth.user,
      action: "user.deleted",
      targetType: "admin_user",
      targetId: context.params.id,
      targetLabel: context.params.id,
    });

    return Response.json({ message: "User deleted." });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User deletion failed." },
      { status: 400 }
    );
  }
}
