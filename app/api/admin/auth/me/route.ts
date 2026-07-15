import { getRuntimeEnv } from "../../../../server/runtime-env";
import {
  bootstrapSuperAdmin,
  getAdminUser,
  type AuthRuntimeEnv,
} from "../../../../server/auth-store";

async function runtimeEnv() {
  return (await getRuntimeEnv()) as unknown as AuthRuntimeEnv;
}

export async function GET(request: Request) {
  const runtime = await runtimeEnv();
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
