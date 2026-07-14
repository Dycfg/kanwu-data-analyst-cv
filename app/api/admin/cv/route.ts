import { env } from "cloudflare:workers";
import { requireAdminUser, type AuthRuntimeEnv } from "../../../server/auth-store";

type Locale = "en" | "zh";

type RuntimeEnv = {
  CV_BUCKET?: R2Bucket;
} & AuthRuntimeEnv;

const maxPdfSize = 12 * 1024 * 1024;

const fileByLocale: Record<Locale, { key: string; label: string }> = {
  en: { key: "cv/CV_EN.pdf", label: "English CV" },
  zh: { key: "cv/CV_CN.pdf", label: "Chinese CV" },
};

function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

function normalizeLocale(value: FormDataEntryValue | null): Locale | null {
  if (value === "en" || value === "zh") {
    return value;
  }

  return null;
}

async function fileStatus(bucket: R2Bucket | undefined, locale: Locale) {
  if (!bucket) {
    return { exists: false };
  }

  const object = await bucket.head(fileByLocale[locale].key);
  return {
    exists: Boolean(object),
    updated: object?.uploaded?.toISOString().slice(0, 10),
    size: object?.size,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUser(runtimeEnv().DB, request);

  if ("response" in auth) {
    return auth.response;
  }

  const bucket = runtimeEnv().CV_BUCKET;

  return Response.json({
    en: await fileStatus(bucket, "en"),
    zh: await fileStatus(bucket, "zh"),
  });
}

export async function POST(request: Request) {
  const bucket = runtimeEnv().CV_BUCKET;

  const auth = await requireAdminUser(runtimeEnv().DB, request);

  if ("response" in auth) {
    return auth.response;
  }

  if (!bucket) {
    return Response.json(
      { error: "CV storage is not configured yet." },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const locale = normalizeLocale(form.get("locale"));
  const file = form.get("file");

  if (!locale) {
    return Response.json({ error: "Choose English or Chinese CV." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "Upload a PDF file." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Only PDF files are supported." }, { status: 400 });
  }

  if (file.size > maxPdfSize) {
    return Response.json(
      { error: "PDF is too large. Keep the file under 12 MB." },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();

  await bucket.put(fileByLocale[locale].key, buffer, {
    httpMetadata: {
      contentType: "application/pdf",
      contentDisposition: `inline; filename="${file.name}"`,
    },
    customMetadata: {
      originalName: file.name,
    },
  });

  return Response.json({
    message: `${fileByLocale[locale].label} uploaded.`,
    locale,
    size: file.size,
  });
}

export async function DELETE(request: Request) {
  const bucket = runtimeEnv().CV_BUCKET;

  const auth = await requireAdminUser(runtimeEnv().DB, request);

  if ("response" in auth) {
    return auth.response;
  }

  if (!bucket) {
    return Response.json(
      { error: "CV storage is not configured yet." },
      { status: 503 }
    );
  }

  const localeParam = new URL(request.url).searchParams.get("locale");
  const locale = localeParam === "zh" ? "zh" : localeParam === "en" ? "en" : null;

  if (!locale) {
    return Response.json({ error: "Choose English or Chinese CV." }, { status: 400 });
  }

  await bucket.delete(fileByLocale[locale].key);

  return Response.json({
    message: `${fileByLocale[locale].label} removed.`,
    locale,
  });
}
