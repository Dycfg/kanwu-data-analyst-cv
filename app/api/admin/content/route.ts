import { env } from "cloudflare:workers";
import {
  normalizeSiteContent,
  readSiteContent,
  writeSiteContent,
  type ContentRuntimeEnv,
} from "../../../server/content-store";
import { requireAdminUser, type AuthRuntimeEnv } from "../../../server/auth-store";
import { writeAuditLog, type AuditRuntimeEnv } from "../../../server/audit-log-store";
import type { SiteContent } from "../../../site-content";

type RuntimeEnv = ContentRuntimeEnv & AuthRuntimeEnv & AuditRuntimeEnv;

function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export async function GET(request: Request) {
  const auth = await requireAdminUser(runtimeEnv().DB, request);

  if ("response" in auth) {
    return auth.response;
  }

  const { content, source } = await readSiteContent(runtimeEnv().DB);

  return Response.json({ content, source });
}

export async function PUT(request: Request) {
  const db = runtimeEnv().DB;

  if (!db) {
    return Response.json(
      { error: "Content database is not configured yet." },
      { status: 503 }
    );
  }

  const auth = await requireAdminUser(db, request);

  if ("response" in auth) {
    return auth.response;
  }

  const payload = (await request.json()) as { content?: SiteContent };
  const content = normalizeSiteContent(payload.content);
  const saved = await writeSiteContent(db, content);
  await writeAuditLog(db, {
    actor: auth.user,
    action: "content.updated",
    targetType: "content",
    targetLabel: "Public site content",
  });

  return Response.json({ content: saved, message: "Content saved." });
}
