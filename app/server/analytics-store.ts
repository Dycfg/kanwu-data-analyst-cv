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
    cvDownloads: number;
    contactClicks: number;
  };
  daily: Array<{ date: string; views: number; visitors: number }>;
  weekly: Array<{ date: string; views: number; visitors: number }>;
  monthly: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ path: string; views: number }>;
  referrers: Array<{ referrer: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
  browsers: Array<{ browser: string; views: number }>;
  countries: Array<{ country: string; views: number }>;
};

type AnalyticsEventType = "page_view" | "cv_download" | "contact_click";

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
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS traffic_events (id TEXT PRIMARY KEY, path TEXT NOT NULL, referrer TEXT, country TEXT, device TEXT NOT NULL, browser TEXT NOT NULL, visitor_hash TEXT NOT NULL, event_type TEXT NOT NULL DEFAULT 'page_view', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    )
    .run();

  try {
    await db.prepare("ALTER TABLE traffic_events ADD COLUMN event_type TEXT NOT NULL DEFAULT 'page_view'").run();
  } catch {
    // Existing databases already have the column after the migration runs.
  }

  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS traffic_events_created_at_idx ON traffic_events(created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS traffic_events_path_idx ON traffic_events(path)"),
    db.prepare("CREATE INDEX IF NOT EXISTS traffic_events_visitor_hash_idx ON traffic_events(visitor_hash)"),
    db.prepare("CREATE INDEX IF NOT EXISTS traffic_events_event_type_idx ON traffic_events(event_type)"),
  ]);
}

export async function recordPageView(
  db: D1Database | undefined,
  request: Request,
  input: { path?: string; referrer?: string; eventType?: AnalyticsEventType }
) {
  if (!db) {
    return;
  }

  await ensureAnalyticsTable(db);

  const userAgent = request.headers.get("user-agent") ?? "";
  const path = normalizePath(input.path);
  const referrer = normalizeReferrer(input.referrer ?? request.headers.get("referer"));
  const country = normalizeCountry(request.headers.get("cf-ipcountry"));
  const visitorHash = await visitorFingerprint(request, userAgent);
  const eventType = normalizeEventType(input.eventType);

  await db
    .prepare(
      "INSERT INTO traffic_events (id, path, referrer, country, device, browser, visitor_hash, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .bind(
      crypto.randomUUID(),
      path,
      referrer,
      country,
      detectDevice(userAgent),
      detectBrowser(userAgent),
      visitorHash,
      eventType
    )
    .run();
}

export async function readAnalyticsSummary(db: D1Database | undefined): Promise<AnalyticsSummary> {
  if (!db) {
    return emptySummary();
  }

  await ensureAnalyticsTable(db);

  const [
    views,
    today,
    last7Days,
    visitors,
    cvViews,
    cvDownloads,
    contactClicks,
    daily,
    weekly,
    monthly,
    topPages,
    referrers,
    devices,
    browsers,
    countries,
  ] =
    await Promise.all([
      count(db, "SELECT COUNT(*) AS count FROM traffic_events WHERE event_type = 'page_view'"),
      count(db, "SELECT COUNT(*) AS count FROM traffic_events WHERE event_type = 'page_view' AND date(created_at) = date('now')"),
      count(
        db,
        "SELECT COUNT(*) AS count FROM traffic_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-7 days')"
      ),
      count(db, "SELECT COUNT(DISTINCT visitor_hash) AS count FROM traffic_events WHERE event_type = 'page_view'"),
      count(db, "SELECT COUNT(*) AS count FROM traffic_events WHERE event_type = 'page_view' AND path LIKE '/cv%'"),
      count(db, "SELECT COUNT(*) AS count FROM traffic_events WHERE event_type = 'cv_download'"),
      count(db, "SELECT COUNT(*) AS count FROM traffic_events WHERE event_type = 'contact_click'"),
      db
        .prepare(
          "SELECT date(created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors FROM traffic_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-13 days') GROUP BY date(created_at) ORDER BY date(created_at) ASC"
        )
        .all<DailyRow>(),
      db
        .prepare(
          "SELECT strftime('%Y-W%W', created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors FROM traffic_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-84 days') GROUP BY strftime('%Y-W%W', created_at) ORDER BY date ASC"
        )
        .all<DailyRow>(),
      db
        .prepare(
          "SELECT strftime('%Y-%m', created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors FROM traffic_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-12 months') GROUP BY strftime('%Y-%m', created_at) ORDER BY date ASC"
        )
        .all<DailyRow>(),
      db
        .prepare(
          "SELECT path AS label, COUNT(*) AS views FROM traffic_events WHERE event_type = 'page_view' GROUP BY path ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
      db
        .prepare(
          "SELECT COALESCE(referrer, 'Direct') AS label, COUNT(*) AS views FROM traffic_events WHERE event_type = 'page_view' GROUP BY COALESCE(referrer, 'Direct') ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
      db
        .prepare(
          "SELECT device AS label, COUNT(*) AS views FROM traffic_events WHERE event_type = 'page_view' GROUP BY device ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
      db
        .prepare(
          "SELECT browser AS label, COUNT(*) AS views FROM traffic_events WHERE event_type = 'page_view' GROUP BY browser ORDER BY views DESC LIMIT 5"
        )
        .all<LabelRow>(),
      db
        .prepare(
          "SELECT COALESCE(country, 'Unknown') AS label, COUNT(*) AS views FROM traffic_events WHERE event_type = 'page_view' GROUP BY COALESCE(country, 'Unknown') ORDER BY views DESC LIMIT 5"
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
      cvDownloads,
      contactClicks,
    },
    daily: daily.results ?? [],
    weekly: weekly.results ?? [],
    monthly: monthly.results ?? [],
    topPages: mapLabelRows(topPages.results ?? [], "path"),
    referrers: mapLabelRows(referrers.results ?? [], "referrer"),
    devices: mapLabelRows(devices.results ?? [], "device"),
    browsers: mapLabelRows(browsers.results ?? [], "browser"),
    countries: mapLabelRows(countries.results ?? [], "country"),
  };
}

async function count(db: D1Database, sql: string) {
  const row = await db.prepare(sql).first<CountRow>();

  return row?.count ?? 0;
}

function mapLabelRows<T extends "path" | "referrer" | "device" | "browser" | "country">(
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

function normalizeCountry(value: string | null) {
  if (!value || value === "XX" || value.length > 8) {
    return null;
  }

  return value.toUpperCase();
}

function normalizeEventType(value: string | undefined): AnalyticsEventType {
  if (value === "cv_download" || value === "contact_click") {
    return value;
  }

  return "page_view";
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
      cvDownloads: 0,
      contactClicks: 0,
    },
    daily: [],
    weekly: [],
    monthly: [],
    topPages: [],
    referrers: [],
    devices: [],
    browsers: [],
    countries: [],
  };
}
