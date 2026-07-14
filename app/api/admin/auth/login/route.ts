import { env } from "cloudflare:workers";
import {
  bootstrapSuperAdmin,
  loginAdmin,
  type AuthRuntimeEnv,
} from "../../../../server/auth-store";

function runtimeEnv() {
  return env as unknown as AuthRuntimeEnv;
}

export async function POST(request: Request) {
  const runtime = runtimeEnv();
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
