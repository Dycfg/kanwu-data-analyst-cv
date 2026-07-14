import { env } from "cloudflare:workers";
import { readSiteContent, type ContentRuntimeEnv } from "../../server/content-store";

export async function GET() {
  const { content, source } = await readSiteContent((env as unknown as ContentRuntimeEnv).DB);

  return Response.json({ content, source });
}
