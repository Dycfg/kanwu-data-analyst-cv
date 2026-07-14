import { env } from "cloudflare:workers";
import {
  bootstrapSuperAdmin,
  getAdminUser,
  type AuthRuntimeEnv,
} from "../../../../server/auth-store";

function runtimeEnv() {
  return env as unknown as AuthRuntimeEnv;
}

export async function GET(request: Request) {
  const runtime = runtimeEnv();
  const db = runtime.DB;

  if (!db) {
    return Response.json({ error: "Login database is not configured." }, { status: 503 });
  }

  await bootstrapSuperAdmin(db, runtime, request);

  const user = await getAdminUser(db, request);

  if (!user) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  return Response.json({ user });
}
