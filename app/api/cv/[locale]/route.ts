import { env } from "cloudflare:workers";

type Locale = "en" | "zh";

type RuntimeEnv = {
  CV_BUCKET?: R2Bucket;
};

const fileByLocale: Record<Locale, { key: string; filename: string }> = {
  en: { key: "cv/CV_EN.pdf", filename: "KanWu_CV_EN.pdf" },
  zh: { key: "cv/CV_CN.pdf", filename: "KanWu_CV_CN.pdf" },
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
  const bucket = (env as unknown as RuntimeEnv).CV_BUCKET;

  if (!bucket) {
    return Response.json(
      { error: "CV storage is not configured yet." },
      { status: 503 }
    );
  }

  const file = await bucket.get(target.key);

  if (!file?.body) {
    return Response.json({ error: "CV has not been uploaded yet." }, { status: 404 });
  }

  return new Response(file.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${target.filename}"`,
      "cache-control": "no-store",
    },
  });
}
