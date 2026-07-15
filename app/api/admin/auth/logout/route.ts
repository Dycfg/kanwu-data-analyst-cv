import { getRuntimeEnv } from "../../../../server/runtime-env";
import {
  logoutAdmin,
  sessionCookieDelete,
  type AuthRuntimeEnv,
} from "../../../../server/auth-store";

async function runtimeEnv() {
  return (await getRuntimeEnv()) as unknown as AuthRuntimeEnv;
}

export async function POST(request: Request) {
  const runtime = await runtimeEnv();
  await logoutAdmin(runtime.DB, request);

  return Response.json(
    { message: "Logged out." },
    { headers: { "Set-Cookie": sessionCookieDelete() } }
  );
}
