import { getRuntimeEnv } from "../../../../server/runtime-env";
import {
  bootstrapSuperAdmin,
  loginAdmin,
  type AuthRuntimeEnv,
} from "../../../../server/auth-store";

async function runtimeEnv() {
  return (await getRuntimeEnv()) as unknown as AuthRuntimeEnv;
}

export async function POST(request: Request) {
  const runtime = await runtimeEnv();
  const db = runtime.DB;

  if (!db) {
    return Response.json({ error: "Login database is not configured." }, { status: 503 });
  }

  await bootstrapSuperAdmin(db, runtime, request);

  const payload = (await request.json()) as { username?: string; password?: string };
  const result = await loginAdmin(db, payload.username ?? "", payload.password ?? "");

  if (!result) {
    return Response.json({ error: "Invalid username or password." }, { status: 401 });
  }

  return Response.json(
    { user: result.user, message: "Logged in." },
    { headers: { "Set-Cookie": result.cookie } }
  );
}
