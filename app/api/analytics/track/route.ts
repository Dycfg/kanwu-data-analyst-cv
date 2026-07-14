import { env } from "cloudflare:workers";
import {
  recordPageView,
  type AnalyticsRuntimeEnv,
} from "../../../server/analytics-store";

function runtimeEnv() {
  return env as unknown as AnalyticsRuntimeEnv;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    path?: string;
    referrer?: string;
  };

  await recordPageView(runtimeEnv().DB, request, {
    path: payload.path,
    referrer: payload.referrer,
  });

  return Response.json({ ok: true });
}
