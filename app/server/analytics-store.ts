export type AnalyticsRuntimeEnv = {
  DB?: D1Database;
};

export type AnalyticsSummary = {
  totals: {
    views: number;
    today: number;
    last7Days: number;
    visitors: number;
    cvViews: number;
  };
  daily: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ path: string; views: number }>;
  referrers: Array<{ referrer: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
  browsers: Array<{ browser: string; views: number }>;
};

type CountRow = {
  count: number;
};

type DailyRow = {
  date: string;
  views: number;
  visitors: number;
};

type LabelRow = {
  label: string;
  views: number;
};

export async function ensureAnalyticsTable(db: D1Database) {
  await db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS traffic_events (id TEXT PRIMARY KEY, path TEXT NOT NULL, referrer TEXT, country TEXT, device TEXT NOT NULL, browser TEXT NOT NULL, visitor_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    ),
    db.prepare("CREATE INDEX IF NOT EXISTS traffic_events_created_at_idx ON traffic_events(created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS traffic_events_path_idx ON traffic_events(path)"),
    db.prepare("CREATE INDEX IF NOT EXISTS traffic_events_visitor_hash_idx ON traffic_events(visitor_hash)"),
  ]);
}

export async function recordPageView(
  db: D1Database | undefined,
  request: Request,
  input: { path?: string; referrer?: string }
) {
  if (!db) {
    return;
  }

  await ensureAnalyticsTable(db);

  const userAgent = request.headers.get("user-agent") ?? "";
  const path = normalizePath(input.path);
  const referrer = normalizeReferrer(input.referrer ?? request.headers.get("referer"));
  const country = request.headers.get("cf-ipcountry") || null;
  const visitorHash = await visitorFingerprint(request, userAgent);

  await db
    .prepare(
      "INSERT INTO traffic_events (id, path, referrer, country, device, browser, visitor_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .bind(
      crypto.randomUUID(),
      path,
      referrer,
      country,
      detectDevice(userAgent),
      detectBrowser(userAgent),
      visitorHash
    )
    .run();
}

export async function readAnalyticsSummary(db: D1Database | undefined): Promise<AnalyticsSummary> {
  if (!db) {
    return emptySummary();
  }

  await ensureAnalyticsTable(db);

  const [views, today, last7Days, visitors, cvViews, daily, topPages, referrers, devices, browsers] =
    await Promise.all([
      count(db, "SELECT COUNT(*) AS count FROM traffic_events"),
      count(db, "SELECT COUNT(*) AS count FROM traffic_events WHERE date(created_at) = date('now')"),
      count(
        db,
        "SELECT COUNT(*) AS count FROM traffic_events WHERE created_at >= datetime('now', '-7 days')"
      ),
      count(db, "SELECT COUNT(DISTINCT visitor_hash) AS count FROM traffic_events"),
      count(db, "SELECT COUNT(*) AS count FROM traffic_events WHERE path LIKE '/cv%'"),
      db
        .prepare(
          "SELECT date(created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors FROM traffic_events WHERE created_at >= datetime('now', '-13 days') GROUP BY date(created_at) ORDER BY date(created_at) ASC"
        )
        .all<DailyRow>(),
      db
        .prepare(
          "SELECT path AS label, COUNT(*) AS views FROM traffic_events GROUP BY path ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
      db
        .prepare(
          "SELECT COALESCE(referrer, 'Direct') AS label, COUNT(*) AS views FROM traffic_events GROUP BY COALESCE(referrer, 'Direct') ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
      db
        .prepare(
          "SELECT device AS label, COUNT(*) AS views FROM traffic_events GROUP BY device ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
      db
        .prepare(
          "SELECT browser AS label, COUNT(*) AS views FROM traffic_events GROUP BY browser ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
    ]);

  return {
    totals: {
      views,
      today,
      last7Days,
      visitors,
      cvViews,
    },
    daily: daily.results ?? [],
    topPages: mapLabelRows(topPages.results ?? [], "path"),
    referrers: mapLabelRows(referrers.results ?? [], "referrer"),
    devices: mapLabelRows(devices.results ?? [], "device"),
    browsers: mapLabelRows(browsers.results ?? [], "browser"),
  };
}

async function count(db: D1Database, sql: string) {
  const row = await db.prepare(sql).first<CountRow>();

  return row?.count ?? 0;
}

function mapLabelRows<T extends "path" | "referrer" | "device" | "browser">(
  rows: LabelRow[],
  key: T
): Array<Record<T, string> & { views: number }> {
  return rows.map((row) => ({
    [key]: row.label,
    views: row.views,
  })) as Array<Record<T, string> & { views: number }>;
}

function normalizePath(value: string | undefined) {
  if (!value) {
    return "/";
  }

  try {
    const url = new URL(value, "https://local.site");
    const path = `${url.pathname}${url.search}`;

    return path.length > 180 ? path.slice(0, 180) : path;
  } catch {
    return "/";
  }
}

function normalizeReferrer(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "");

    return hostname || null;
  } catch {
    return null;
  }
}

async function visitorFingerprint(request: Request, userAgent: string) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const source = `${ip}|${userAgent}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function detectDevice(userAgent: string) {
  if (/mobile|iphone|android/i.test(userAgent)) {
    return "Mobile";
  }

  if (/ipad|tablet/i.test(userAgent)) {
    return "Tablet";
  }

  return "Desktop";
}

function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) {
    return "Edge";
  }

  if (/chrome|crios/i.test(userAgent)) {
    return "Chrome";
  }

  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
    return "Safari";
  }

  if (/firefox|fxios/i.test(userAgent)) {
    return "Firefox";
  }

  return "Other";
}

function emptySummary(): AnalyticsSummary {
  return {
    totals: {
      views: 0,
      today: 0,
      last7Days: 0,
      visitors: 0,
      cvViews: 0,
    },
    daily: [],
    topPages: [],
    referrers: [],
    devices: [],
    browsers: [],
  };
}
