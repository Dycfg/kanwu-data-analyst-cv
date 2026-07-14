import { defaultSiteContent, type SiteContent } from "../site-content";

const contentId = "primary";

export type ContentRuntimeEnv = {
  DB?: D1Database;
};

export async function ensureContentTable(db: D1Database) {
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS site_content (id TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    )
    .run();
}

export function normalizeSiteContent(value: unknown): SiteContent {
  const candidate = value as Partial<SiteContent> | null;

  if (!candidate || typeof candidate !== "object") {
    return defaultSiteContent;
  }

  return {
    ...defaultSiteContent,
    ...candidate,
    contact: {
      ...defaultSiteContent.contact,
      ...(candidate.contact ?? {}),
    },
    en: {
      ...defaultSiteContent.en,
      ...(candidate.en ?? {}),
      links: {
        ...defaultSiteContent.en.links,
        ...(candidate.en?.links ?? {}),
      },
    },
    zh: {
      ...defaultSiteContent.zh,
      ...(candidate.zh ?? {}),
      links: {
        ...defaultSiteContent.zh.links,
        ...(candidate.zh?.links ?? {}),
      },
    },
  };
}

export async function readSiteContent(db: D1Database | undefined) {
  if (!db) {
    return { content: defaultSiteContent, source: "default" as const };
  }

  await ensureContentTable(db);

  const row = await db
    .prepare("SELECT value FROM site_content WHERE id = ?")
    .bind(contentId)
    .first<{ value: string }>();

  if (!row?.value) {
    return { content: defaultSiteContent, source: "default" as const };
  }

  try {
    return {
      content: normalizeSiteContent(JSON.parse(row.value)),
      source: "database" as const,
    };
  } catch {
    return { content: defaultSiteContent, source: "default" as const };
  }
}

export async function writeSiteContent(db: D1Database, content: SiteContent) {
  await ensureContentTable(db);

  const normalized = normalizeSiteContent(content);

  await db
    .prepare(
      "INSERT INTO site_content (id, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
    )
    .bind(contentId, JSON.stringify(normalized))
    .run();

  return normalized;
}
