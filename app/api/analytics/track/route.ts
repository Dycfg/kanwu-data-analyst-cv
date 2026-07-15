import { getRuntimeEnv } from "../../../server/runtime-env";
import {
  recordPageView,
  type AnalyticsRuntimeEnv,
} from "../../../server/analytics-store";

async function runtimeEnv() {
  return (await getRuntimeEnv()) as unknown as AnalyticsRuntimeEnv;
}

export async function POST(request: Request) {
  const runtime = await runtimeEnv();
  const payload = (await request.json().catch(() => ({}))) as {
    path?: string;
    referrer?: string;
    eventType?: "page_view" | "cv_download" | "contact_click";
  };

  await recordPageView(runtime.DB, request, {
    path: payload.path,
    referrer: payload.referrer,
    eventType: payload.eventType,
  });

  return Response.json({ ok: true });
}
