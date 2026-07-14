import { env } from "cloudflare:workers";
import {
  logoutAdmin,
  sessionCookieDelete,
  type AuthRuntimeEnv,
} from "../../../../server/auth-store";

function runtimeEnv() {
  return env as unknown as AuthRuntimeEnv;
}

export async function POST(request: Request) {
  await logoutAdmin(runtimeEnv().DB, request);

  return Response.json(
    { message: "Logged out." },
    { headers: { "Set-Cookie": sessionCookieDelete() } }
  );
}
