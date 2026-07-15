import { getRuntimeEnv } from "../../server/runtime-env";
import { readSiteContent, type ContentRuntimeEnv } from "../../server/content-store";

export async function GET() {
  const runtime = (await getRuntimeEnv()) as unknown as ContentRuntimeEnv;
  const { content, source } = await readSiteContent(runtime.DB);

  return Response.json({ content, source });
}
