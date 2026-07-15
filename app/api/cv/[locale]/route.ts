import { getRuntimeEnv } from "../../../server/runtime-env";

type Locale = "en" | "zh";

type RuntimeEnv = {
  CV_BUCKET?: R2Bucket;
};

const fileByLocale: Record<Locale, { key: string; filename: string; assetPath: string }> = {
  en: { key: "cv/CV_EN.pdf", filename: "KanWu_CV_EN.pdf", assetPath: "/CV_EN.pdf" },
  zh: { key: "cv/CV_CN.pdf", filename: "KanWu_CV_CN.pdf", assetPath: "/CV_CN.pdf" },
};

function normalizeLocale(value: string | undefined): Locale {
  return value === "zh" ? "zh" : "en";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale?: string }> | { locale?: string } }
) {
  const params = await context.params;
  const locale = normalizeLocale(params.locale);
  const target = fileByLocale[locale];
  const runtime = (await getRuntimeEnv()) as unknown as RuntimeEnv;
  const bucket = runtime.CV_BUCKET;

  if (bucket) {
    const file = await bucket.get(target.key);

    if (file?.body) {
      return new Response(file.body, {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `inline; filename="${target.filename}"`,
          "cache-control": "no-store",
        },
      });
    }
  }

  return Response.redirect(new URL(target.assetPath, _request.url), 302);
}
