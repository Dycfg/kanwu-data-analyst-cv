import { getRuntimeEnv } from "../../../server/runtime-env";
import {
  readAnalyticsSummary,
  type AnalyticsRuntimeEnv,
} from "../../../server/analytics-store";
import { requireAdminUser, type AuthRuntimeEnv } from "../../../server/auth-store";

type RuntimeEnv = AnalyticsRuntimeEnv & AuthRuntimeEnv;

async function runtimeEnv() {
  return (await getRuntimeEnv()) as unknown as RuntimeEnv;
}

export async function GET(request: Request) {
  const runtime = await runtimeEnv();
  const auth = await requireAdminUser(runtime.DB, request);

  if ("response" in auth) {
    return auth.response;
  }

  return Response.json(await readAnalyticsSummary(runtime.DB));
}
