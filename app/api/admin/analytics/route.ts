import { env } from "cloudflare:workers";
import {
  readAnalyticsSummary,
  type AnalyticsRuntimeEnv,
} from "../../../server/analytics-store";
import { requireAdminUser, type AuthRuntimeEnv } from "../../../server/auth-store";

type RuntimeEnv = AnalyticsRuntimeEnv & AuthRuntimeEnv;

function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export async function GET(request: Request) {
  const runtime = runtimeEnv();
  const auth = await requireAdminUser(runtime.DB, request);

  if ("response" in auth) {
    return auth.response;
  }

  return Response.json(await readAnalyticsSummary(runtime.DB));
}
