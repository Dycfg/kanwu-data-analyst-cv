"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  defaultSiteContent,
  type ExperienceCard,
  type Lang,
  type ProjectCard,
  type SiteContent,
} from "../site-content";
import type { AdminRole, AdminUser } from "../server/auth-store";

type Status = {
  en: { exists: boolean; updated?: string; size?: number };
  zh: { exists: boolean; updated?: string; size?: number };
};

type AnalyticsSummary = {
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

type TrafficPeriod = "daily" | "weekly" | "monthly";
type TrafficItem = { date: string; views: number; visitors: number };
type InsightItem = { label: string; views: number };
type AuditLog = {
  id: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetLabel: string;
  details: string | null;
  createdAt: string;
};
type DraftedAdminUser = AdminUser & {
  newPassword?: string;
  usernameDraft?: string;
};

const labels = {
  en: "English CV",
  zh: "Chinese CV",
};

const languageLabels: Record<Lang, string> = {
  en: "English content",
  zh: "中文内容",
};

const passwordRule =
  "At least 10 characters with uppercase, lowercase, number, and symbol.";

function formatSize(size?: number) {
  if (!size) {
    return "No file";
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function textToSkillItems(value: string) {
  return value
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isStrongPassword(value: string) {
  return (
    value.length >= 10 &&
    !/\s/.test(value) &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function formatTrafficLabel(period: TrafficPeriod, value: string) {
  if (period === "daily") {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(5) : value;
  }

  if (period === "weekly") {
    return /^\d{4}-W\d{2}$/.test(value) ? value.replace("-W", " W") : value;
  }

  return value;
}

function chartPoint(
  index: number,
  value: number,
  itemCount: number,
  maxValue: number,
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
) {
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const x = padding.left + (itemCount <= 1 ? innerWidth / 2 : (index / (itemCount - 1)) * innerWidth);
  const y = padding.top + innerHeight - (value / maxValue) * innerHeight;

  return { x, y };
}

function TrafficVisualization({ period, items }: { period: TrafficPeriod; items: TrafficItem[] }) {
  const [activeIndex, setActiveIndex] = useState(Math.max(0, items.length - 1));
  const width = 760;
  const height = 300;
  const padding = { top: 28, right: 30, bottom: 42, left: 48 };
  const maxValue = Math.max(1, ...items.flatMap((item) => [item.views, item.visitors]));
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const activeItem = items[safeActiveIndex] ?? items[0] ?? { date: "No data", views: 0, visitors: 0 };
  const points = items.map((item, index) => ({
    item,
    views: chartPoint(index, item.views, items.length, maxValue, width, height, padding),
    visitors: chartPoint(index, item.visitors, items.length, maxValue, width, height, padding),
  }));
  const viewPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.views.x} ${point.views.y}`).join(" ");
  const visitorPath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.visitors.x} ${point.visitors.y}`)
    .join(" ");
  const areaPath = points.length
    ? `${viewPath} L ${points[points.length - 1].views.x} ${height - padding.bottom} L ${points[0].views.x} ${
        height - padding.bottom
      } Z`
    : "";
  const activePoint = points[safeActiveIndex]?.views ?? chartPoint(0, 0, 1, 1, width, height, padding);
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const axisLabelPoints =
    points.length <= 3
      ? points
      : [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].filter(Boolean);
  const hitWidth =
    points.length <= 1
      ? width - padding.left - padding.right
      : (width - padding.left - padding.right) / (points.length - 1);
  const tooltipX = activePoint.x > width - 190 ? activePoint.x - 156 : activePoint.x + 14;
  const tooltipY = Math.max(18, activePoint.y - 54);

  return (
    <div className="traffic-visual" onMouseLeave={() => setActiveIndex(Math.max(0, items.length - 1))}>
      <div className="traffic-visual-summary">
        <div>
          <p className="section-label">Selected point</p>
          <strong>{formatTrafficLabel(period, activeItem.date)}</strong>
        </div>
        <dl>
          <div>
            <dt>Views</dt>
            <dd>{activeItem.views}</dd>
          </div>
          <div>
            <dt>Visitors</dt>
            <dd>{activeItem.visitors}</dd>
          </div>
        </dl>
      </div>
      <svg className="traffic-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${period} traffic chart`}>
        <defs>
          <linearGradient id={`traffic-fill-${period}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((line) => {
          const y = padding.top + (height - padding.top - padding.bottom) * line;
          const label = Math.round(maxValue * (1 - line));

          return (
            <g className="traffic-grid" key={line}>
              <text x={padding.left - 12} y={y + 4}>
                {label}
              </text>
              <line
                className="traffic-grid-line"
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
              />
            </g>
          );
        })}
        <line
          className="traffic-baseline"
          x1={padding.left}
          x2={width - padding.right}
          y1={height - padding.bottom}
          y2={height - padding.bottom}
        />
        {areaPath && <path className="traffic-area" d={areaPath} fill={`url(#traffic-fill-${period})`} />}
        {visitorPath && <path className="traffic-line visitors-line" d={visitorPath} pathLength={1} />}
        {viewPath && <path className="traffic-line views-line" d={viewPath} pathLength={1} />}
        {points.map((point, index) => (
          <g
            aria-label={`${formatTrafficLabel(period, point.item.date)}: ${point.item.views} views, ${
              point.item.visitors
            } visitors`}
            className={`traffic-point ${safeActiveIndex === index ? "is-active" : ""}`}
            key={point.item.date}
            role="button"
            tabIndex={0}
            onClick={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <circle cx={point.views.x} cy={point.views.y} r="15" />
            <circle cx={point.views.x} cy={point.views.y} r="4.5" />
          </g>
        ))}
        <g className="traffic-cursor">
          <line x1={activePoint.x} x2={activePoint.x} y1={padding.top} y2={height - padding.bottom} />
          <circle cx={activePoint.x} cy={activePoint.y} r="7" />
        </g>
        <g className="traffic-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
          <rect width="142" height="46" />
          <text x="12" y="18">{formatTrafficLabel(period, activeItem.date)}</text>
          <text x="12" y="34">
            {activeItem.views} views / {activeItem.visitors} visitors
          </text>
        </g>
        {points.map((point, index) => {
          const x =
            points.length <= 1
              ? padding.left
              : Math.max(padding.left, Math.min(width - padding.right - hitWidth, point.views.x - hitWidth / 2));

          return (
            <rect
              aria-label={`${formatTrafficLabel(period, point.item.date)} interaction zone`}
              className="traffic-hit-zone"
              height={height - padding.top - padding.bottom}
              key={`${point.item.date}-zone-${index}`}
              width={hitWidth}
              x={x}
              y={padding.top}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
            />
          );
        })}
      </svg>
      <div className="traffic-axis-labels" aria-hidden="true">
        {axisLabelPoints.map((point, index) => (
          <span key={`${point.item.date}-${index}`} style={{ left: `${(point.views.x / width) * 100}%` }}>
            {formatTrafficLabel(period, point.item.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnalyticsInsightList({ items, title }: { items: InsightItem[]; title: string }) {
  const maxViews = Math.max(1, ...items.map((item) => item.views));

  return (
    <section className="analytics-insight">
      <p className="section-label">{title}</p>
      <div>
        {items.map((item) => (
          <p key={item.label}>
            <span>{item.label}</span>
            <i style={{ width: `${Math.max(6, (item.views / maxViews) * 100)}%` }} />
            <strong>{item.views}</strong>
          </p>
        ))}
      </div>
    </section>
  );
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "admin" as AdminRole,
  });
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    nextPassword: "",
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [trafficPeriod, setTrafficPeriod] = useState<TrafficPeriod>("daily");
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function readJson<T>(response: Response) {
    const payload = (await response.json()) as T & { error?: string };

    if (response.status === 401) {
      window.location.href = "/admin/login";
      throw new Error("Login required.");
    }

    if (!response.ok) {
      throw new Error(payload.error ?? "Request failed.");
    }

    return payload;
  }

  async function refreshMe() {
    const response = await fetch("/api/admin/auth/me", { cache: "no-store" });
    const payload = await readJson<{ user: AdminUser }>(response);
    setCurrentUser(payload.user);

    return payload.user;
  }

  async function refreshStatus() {
    const response = await fetch("/api/admin/cv", { cache: "no-store" });
    const payload = await readJson<Status>(response);
    setStatus(payload);
  }

  async function refreshContent() {
    const response = await fetch("/api/admin/content", { cache: "no-store" });
    const payload = await readJson<{ content?: SiteContent }>(response);

    if (payload.content) {
      setContent(payload.content);
    }
  }

  async function refreshUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const payload = await readJson<{ users: AdminUser[] }>(response);
    setUsers(payload.users);
  }

  async function refreshAnalytics() {
    const response = await fetch("/api/admin/analytics", { cache: "no-store" });
    const payload = await readJson<AnalyticsSummary>(response);
    setAnalytics(payload);
  }

  async function refreshAuditLogs() {
    const response = await fetch("/api/admin/audit-logs", { cache: "no-store" });
    const payload = await readJson<{ logs: AuditLog[] }>(response);
    setAuditLogs(payload.logs);
  }

  useEffect(() => {
    refreshMe()
      .then((user) =>
        Promise.all([
          refreshStatus(),
          refreshContent(),
          refreshAnalytics(),
          user.role === "super_admin" ? Promise.all([refreshUsers(), refreshAuditLogs()]) : Promise.resolve(),
        ])
      )
      .catch((error) => {
        if (error instanceof Error && error.message !== "Login required.") {
          setMessage(error.message);
        }
      });
  }, []);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setPasswordMessage("");

    if (!isStrongPassword(passwordDraft.nextPassword)) {
      setPasswordMessage(passwordRule);
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(passwordDraft),
      });
      await readJson<{ message?: string }>(response);

      setPasswordDraft({ currentPassword: "", nextPassword: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Password update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (!newUser.password.trim()) {
      setMessage("Password is required.");
      setBusy(false);
      return;
    }

    if (!isStrongPassword(newUser.password)) {
      setMessage(passwordRule);
      setBusy(false);
      return;
    }

    const requestedRole = currentUser && isRootSuperAdmin(currentUser) ? newUser.role : "admin";

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ ...newUser, role: requestedRole }),
      });
      const payload = await readJson<{ message?: string }>(response);

      setNewUser({ username: "", password: "", role: "admin" });
      setMessage(payload.message ?? "User created.");
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(user: AdminUser, field: "username" | "role" | "password", value: string) {
    setBusy(true);
    setMessage("");

    if (field === "username" && !value.trim()) {
      setMessage("Enter a new username before saving.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: field === "username" ? value.trim() : user.username,
          role: field === "role" ? value : user.role,
          password: field === "password" ? value : undefined,
        }),
      });
      const payload = await readJson<{ message?: string }>(response);

      setMessage(payload.message ?? "User updated.");
      await refreshUsers();
      await refreshAuditLogs();
      await refreshMe();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (user.role === "super_admin") {
      window.alert("Super administrators cannot be deleted.");
      setMessage("Super administrators cannot be deleted.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const payload = await readJson<{ message?: string }>(response);

      setMessage(payload.message ?? "User deleted.");
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User deletion failed.");
    } finally {
      setBusy(false);
    }
  }

  function updateUserUsernameDraft(id: string, value: string) {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              usernameDraft: value,
            }
          : user
      ) as AdminUser[]
    );
  }

  function updateUserRoleDraft(id: string, value: AdminRole) {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              role: value,
            }
          : user
      )
    );
  }

  function updateUserPasswordDraft(id: string, value: string) {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              newPassword: value,
            }
          : user
      ) as AdminUser[]
    );
  }

  function getUserPasswordDraft(user: AdminUser) {
    return (user as DraftedAdminUser).newPassword ?? "";
  }

  function getUserUsernameDraft(user: AdminUser) {
    return (user as DraftedAdminUser).usernameDraft ?? "";
  }

  function isRootSuperAdmin(user: Pick<AdminUser, "username" | "role">) {
    return user.username === "admin" && user.role === "super_admin";
  }

  if (!currentUser) {
    return (
      <main className="admin-page">
        <section className="admin-hero">
          <p className="eyebrow">Admin</p>
          <h1>Checking session</h1>
          <p>Redirecting to the login page if needed.</p>
        </section>
      </main>
    );
  }

  const trafficItems =
    analytics?.[trafficPeriod].length
      ? analytics[trafficPeriod]
      : [{ date: "No data", views: 0, visitors: 0 }];
  const currentUserIsRoot = isRootSuperAdmin(currentUser);
  const insightGroups = [
    {
      title: "Top pages",
      items: analytics?.topPages.length
        ? analytics.topPages.map((item) => ({ label: item.path, views: item.views }))
        : [{ label: "No visits yet", views: 0 }],
    },
    {
      title: "Sources",
      items: analytics?.referrers.length
        ? analytics.referrers.map((item) => ({ label: item.referrer, views: item.views }))
        : [{ label: "Direct", views: 0 }],
    },
    {
      title: "Devices",
      items: analytics?.devices.length
        ? analytics.devices.map((item) => ({ label: item.device, views: item.views }))
        : [{ label: "No data", views: 0 }],
    },
    {
      title: "Browsers",
      items: analytics?.browsers.length
        ? analytics.browsers.map((item) => ({ label: item.browser, views: item.views }))
        : [{ label: "No data", views: 0 }],
    },
    {
      title: "Countries",
      items: analytics?.countries.length
        ? analytics.countries.map((item) => ({ label: item.country, views: item.views }))
        : [{ label: "Unknown", views: 0 }],
    },
  ];

  async function uploadCv(event: FormEvent<HTMLFormElement>, locale: "en" | "zh") {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setMessage("Choose a PDF file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("file", file);

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/cv", {
        method: "POST",
        body: formData,
      });
      const payload = await readJson<{ message?: string }>(response);

      form.reset();
      setMessage(payload.message ?? "CV uploaded.");
      await refreshStatus();
      if (currentUser.role === "super_admin") {
        await refreshAuditLogs();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeCv(locale: "en" | "zh") {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/cv?locale=${locale}`, {
        method: "DELETE",
      });
      const payload = await readJson<{ message?: string }>(response);

      setMessage(payload.message ?? "CV removed.");
      await refreshStatus();
      if (currentUser.role === "super_admin") {
        await refreshAuditLogs();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Remove failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveContent() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const payload = await readJson<{
        content?: SiteContent;
        message?: string;
      }>(response);

      if (payload.content) {
        setContent(payload.content);
      }

      setMessage(payload.message ?? "Content saved.");
      if (currentUser.role === "super_admin") {
        await refreshAuditLogs();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  function updateContact(field: keyof SiteContent["contact"], value: string) {
    setContent((current) => ({
      ...current,
      contact: {
        ...current.contact,
        [field]: value,
      },
    }));
  }

  function updateLangField(lang: Lang, field: keyof SiteContent[Lang], value: unknown) {
    setContent((current) => ({
      ...current,
      [lang]: {
        ...current[lang],
        [field]: value,
      },
    }));
  }

  function updateExperience(lang: Lang, index: number, field: keyof ExperienceCard, value: string) {
    const next = content[lang].experienceCards.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    );
    updateLangField(lang, "experienceCards", next);
  }

  function updateProject(lang: Lang, index: number, field: keyof ProjectCard, value: string) {
    const next = content[lang].projects.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    );
    updateLangField(lang, "projects", next);
  }

  function updateSkillGroup(lang: Lang, index: number, value: string) {
    const next = content[lang].skills.map((skill, itemIndex) =>
      itemIndex === index ? [value, ...skill.slice(1)] : skill
    );
    updateLangField(lang, "skills", next);
  }

  function updateSkillItems(lang: Lang, index: number, value: string) {
    const next = content[lang].skills.map((skill, itemIndex) =>
      itemIndex === index ? [skill[0] || "Group", ...textToSkillItems(value)] : skill
    );
    updateLangField(lang, "skills", next);
  }

  function addExperience(lang: Lang) {
    updateLangField(lang, "experienceCards", [
      ...content[lang].experienceCards,
      { label: "New", title: "New experience", body: "Describe this experience." },
    ]);
  }

  function removeExperience(lang: Lang, index: number) {
    updateLangField(
      lang,
      "experienceCards",
      content[lang].experienceCards.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function addProject(lang: Lang) {
    updateLangField(lang, "projects", [
      ...content[lang].projects,
      { title: "New project", meta: "Draft", body: "Describe the project." },
    ]);
  }

  function removeProject(lang: Lang, index: number) {
    updateLangField(
      lang,
      "projects",
      content[lang].projects.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function addSkill(lang: Lang) {
    updateLangField(lang, "skills", [...content[lang].skills, ["New group", "Skill"]]);
  }

  function removeSkill(lang: Lang, index: number) {
    updateLangField(
      lang,
      "skills",
      content[lang].skills.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  return (
    <main className="admin-page">
      <header className="subpage-header">
        <a href="/">Back to site</a>
        <a href="/cv">View CV</a>
        <button className="text-action" type="button" onClick={logout}>
          Sign out
        </button>
      </header>

      <section className="admin-hero">
        <p className="eyebrow">Admin</p>
        <h1>Site management</h1>
        <p>
          Manage CV files and editable public content. Changes are saved to the
          site database and the public page keeps the current defaults if no
          saved content exists.
        </p>
      </section>

      <section className="admin-panel session-panel">
        <div>
          <p className="section-label">Signed in</p>
          <h2>{currentUser.username}</h2>
          <p>{currentUser.role === "super_admin" ? "Super administrator" : "Administrator"}</p>
        </div>
        <form className="password-form" onSubmit={changePassword}>
          <label className="admin-key">
            <span>Current password</span>
            <input
              value={passwordDraft.currentPassword}
              onChange={(event) =>
                setPasswordDraft((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
            />
          </label>
          <label className="admin-key">
            <span>New password</span>
            <input
              value={passwordDraft.nextPassword}
              onChange={(event) =>
                setPasswordDraft((current) => ({
                  ...current,
                  nextPassword: event.target.value,
                }))
              }
              type="password"
              autoComplete="new-password"
              placeholder="10+ chars, Aa, 0-9, symbol"
            />
          </label>
          <button className="button secondary" type="submit" disabled={busy}>
            Change password
          </button>
          <p className={`inline-status ${passwordMessage.includes("success") ? "success" : ""}`} aria-live="polite">
            {passwordMessage || passwordRule}
          </p>
        </form>
      </section>

      <section className="analytics-panel reveal">
        <div className="editor-heading">
          <div>
            <p className="section-label">Traffic</p>
            <h2>Visitor overview</h2>
          </div>
          <button className="button secondary compact-action" type="button" onClick={refreshAnalytics}>
            Refresh
          </button>
        </div>
        <div className="metric-grid">
          <article>
            <span>Total views</span>
            <strong>{analytics?.totals.views ?? 0}</strong>
          </article>
          <article>
            <span>Today</span>
            <strong>{analytics?.totals.today ?? 0}</strong>
          </article>
          <article>
            <span>Last 7 days</span>
            <strong>{analytics?.totals.last7Days ?? 0}</strong>
          </article>
          <article>
            <span>Visitors</span>
            <strong>{analytics?.totals.visitors ?? 0}</strong>
          </article>
          <article>
            <span>CV views</span>
            <strong>{analytics?.totals.cvViews ?? 0}</strong>
          </article>
          <article>
            <span>CV downloads</span>
            <strong>{analytics?.totals.cvDownloads ?? 0}</strong>
          </article>
          <article>
            <span>Contact clicks</span>
            <strong>{analytics?.totals.contactClicks ?? 0}</strong>
          </article>
        </div>
        <div className="traffic-tabs" aria-label="Traffic range">
          {(["daily", "weekly", "monthly"] as const).map((period) => (
            <button
              className={trafficPeriod === period ? "is-active" : ""}
              key={period}
              type="button"
              onClick={() => setTrafficPeriod(period)}
            >
              {period === "daily" ? "Day" : period === "weekly" ? "Week" : "Month"}
            </button>
          ))}
        </div>
        <TrafficVisualization period={trafficPeriod} items={trafficItems} />
        <div className="analytics-lists">
          {insightGroups.map((group) => (
            <AnalyticsInsightList items={group.items} key={group.title} title={group.title} />
          ))}
        </div>
        <div className="analytics-notes">
          <p>Tracking page views, CV downloads, contact clicks, device, browser, referrer, and country source.</p>
        </div>
      </section>

      {currentUser.role === "super_admin" && (
        <section className="audit-panel reveal">
          <div className="editor-heading">
            <div>
              <p className="section-label">Activity</p>
              <h2>Operation log</h2>
              <p>Recent administrative changes are recorded with actor, action, target, and time.</p>
            </div>
            <button className="button secondary compact-action" type="button" onClick={refreshAuditLogs}>
              Refresh
            </button>
          </div>
          <div className="audit-list">
            {(auditLogs.length ? auditLogs : [
              {
                id: "empty",
                actorUsername: "System",
                action: "No activity yet",
                targetType: "audit",
                targetLabel: "Waiting for admin actions",
                details: null,
                createdAt: "",
              },
            ]).map((log) => (
              <article className="audit-item" key={log.id}>
                <span>{log.actorUsername}</span>
                <strong>{log.action}</strong>
                <p>{log.targetLabel}</p>
                <em>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "No timestamp"}</em>
              </article>
            ))}
          </div>
        </section>
      )}

      {currentUser.role === "super_admin" && (
        <section className="content-editor user-management">
          <div className="editor-heading">
            <div>
              <p className="section-label">Users</p>
              <h2>User directory</h2>
              <p>Super administrators can view all administrator accounts and reset encrypted passwords.</p>
            </div>
          </div>

          <form className="editor-card user-create-form" onSubmit={createUser}>
            <div className="editor-grid four">
              <label>
                <span>Username</span>
                <input
                  value={newUser.username}
                  onChange={(event) =>
                    setNewUser((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="new_admin"
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  value={newUser.password}
                  onChange={(event) =>
                    setNewUser((current) => ({ ...current, password: event.target.value }))
                  }
                  type="password"
                  required
                  placeholder="10+ chars, Aa, 0-9, symbol"
                />
              </label>
              <label>
                <span>Role</span>
                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      role: event.target.value as AdminRole,
                    }))
                  }
                >
                  <option value="admin">Administrator</option>
                  {currentUserIsRoot && <option value="super_admin">Super administrator</option>}
                </select>
              </label>
              <button className="button primary" type="submit" disabled={busy}>
                Create user
              </button>
            </div>
          </form>

          <div className="user-list">
            {users.map((user) => (
              <article className={`editor-card user-row ${isRootSuperAdmin(user) ? "is-root-user" : ""}`} key={user.id}>
                <div className="user-summary">
                  <span>Account</span>
                  <strong>{user.username}</strong>
                  <em>{user.role === "super_admin" ? "Super administrator" : "Administrator"}</em>
                </div>
                <div className="password-state">
                  <span>Password</span>
                  <strong>Encrypted</strong>
                  <em>Reset only</em>
                </div>
                <label>
                  <span>Username</span>
                  {isRootSuperAdmin(user) ? (
                    <input aria-label="Root administrator username is locked" disabled value="/" />
                  ) : (
                    <input
                      value={getUserUsernameDraft(user)}
                      onChange={(event) => updateUserUsernameDraft(user.id, event.target.value)}
                      placeholder="New username"
                    />
                  )}
                </label>
                <label>
                  <span>Role</span>
                  {isRootSuperAdmin(user) ? (
                    <span className="locked-field">Super administrator</span>
                  ) : (
                    <select
                      disabled={!currentUserIsRoot && user.role === "super_admin"}
                      value={user.role}
                      onChange={(event) => updateUserRoleDraft(user.id, event.target.value as AdminRole)}
                    >
                      <option value="admin">Administrator</option>
                      {(currentUserIsRoot || user.role === "super_admin") && (
                        <option value="super_admin">Super administrator</option>
                      )}
                    </select>
                  )}
                </label>
                <label>
                  <span>New password</span>
                  <input
                    value={getUserPasswordDraft(user)}
                    onChange={(event) => updateUserPasswordDraft(user.id, event.target.value)}
                    type="password"
                    placeholder="Optional reset password"
                  />
                </label>
                <div className="admin-actions">
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy || isRootSuperAdmin(user) || (!currentUserIsRoot && user.role === "super_admin")}
                    onClick={() => updateUser(user, "username", getUserUsernameDraft(user))}
                  >
                    Save name
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy || isRootSuperAdmin(user) || (!currentUserIsRoot && user.role === "super_admin")}
                    onClick={() => updateUser(user, "role", user.role)}
                  >
                    Save role
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy || !getUserPasswordDraft(user) || (!currentUserIsRoot && user.role === "super_admin")}
                    onClick={() => updateUser(user, "password", getUserPasswordDraft(user))}
                  >
                    Reset password
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => deleteUser(user)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="upload-grid">
        {(["en", "zh"] as const).map((locale) => (
          <form
            className="upload-card"
            key={locale}
            onSubmit={(event) => uploadCv(event, locale)}
          >
            <div>
              <span>{labels[locale]}</span>
              <strong>{status?.[locale].exists ? "Uploaded" : "Default file"}</strong>
              <p>
                {formatSize(status?.[locale].size)}
                {status?.[locale].updated ? ` / ${status[locale].updated}` : ""}
              </p>
            </div>
            <input name="file" type="file" accept="application/pdf,.pdf" />
            <div className="admin-actions">
              <button className="button primary" type="submit" disabled={busy}>
                {busy ? "Uploading" : `Upload ${labels[locale]}`}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={busy || !status?.[locale].exists}
                onClick={() => removeCv(locale)}
              >
                Remove uploaded
              </button>
            </div>
          </form>
        ))}
      </section>

      <section className="content-editor">
        <div className="editor-heading">
          <div>
            <p className="section-label">Content CMS</p>
            <h2>Edit public site content</h2>
          </div>
          <div className="admin-actions">
            <button className="button secondary" type="button" onClick={() => setContent(defaultSiteContent)}>
              Reset draft
            </button>
            <button className="button primary" type="button" disabled={busy} onClick={saveContent}>
              {busy ? "Saving" : "Save content"}
            </button>
          </div>
        </div>

        <div className="editor-card">
          <p className="section-label">Contact links</p>
          <div className="editor-grid three">
            <label>
              <span>Email</span>
              <input value={content.contact.email} onChange={(event) => updateContact("email", event.target.value)} />
            </label>
            <label>
              <span>GitHub</span>
              <input value={content.contact.github} onChange={(event) => updateContact("github", event.target.value)} />
            </label>
            <label>
              <span>WeChat</span>
              <input value={content.contact.wechat} onChange={(event) => updateContact("wechat", event.target.value)} />
            </label>
          </div>
        </div>

        {(["en", "zh"] as const).map((lang) => {
          const draft = content[lang];

          return (
            <article className="editor-card" key={lang}>
              <p className="section-label">{languageLabels[lang]}</p>
              <div className="editor-grid two">
                <label>
                  <span>Hero name</span>
                  <input value={draft.eyebrow} onChange={(event) => updateLangField(lang, "eyebrow", event.target.value)} />
                </label>
                <label>
                  <span>Role</span>
                  <input value={draft.role} onChange={(event) => updateLangField(lang, "role", event.target.value)} />
                </label>
                <label className="wide">
                  <span>Tagline</span>
                  <textarea value={draft.tagline} onChange={(event) => updateLangField(lang, "tagline", event.target.value)} />
                </label>
                <label className="wide">
                  <span>Intro</span>
                  <textarea value={draft.intro} onChange={(event) => updateLangField(lang, "intro", event.target.value)} />
                </label>
                <label>
                  <span>About heading</span>
                  <input value={draft.aboutKicker} onChange={(event) => updateLangField(lang, "aboutKicker", event.target.value)} />
                </label>
                <label>
                  <span>Skills heading</span>
                  <input value={draft.skillsHeading} onChange={(event) => updateLangField(lang, "skillsHeading", event.target.value)} />
                </label>
                <label className="wide">
                  <span>About paragraphs</span>
                  <textarea value={linesToText(draft.aboutBody)} onChange={(event) => updateLangField(lang, "aboutBody", textToLines(event.target.value))} />
                </label>
                <label className="wide">
                  <span>Contact text</span>
                  <textarea value={draft.contactBody} onChange={(event) => updateLangField(lang, "contactBody", event.target.value)} />
                </label>
              </div>

              <div className="editor-block">
                <div className="editor-row-heading">
                  <strong>Experience</strong>
                  <button className="button secondary" type="button" onClick={() => addExperience(lang)}>
                    Add experience
                  </button>
                </div>
                {draft.experienceCards.map((item, index) => (
                  <div className="nested-editor" key={`${item.title}-${index}`}>
                    <input value={item.label} onChange={(event) => updateExperience(lang, index, "label", event.target.value)} placeholder="Label" />
                    <input value={item.title} onChange={(event) => updateExperience(lang, index, "title", event.target.value)} placeholder="Title" />
                    <textarea value={item.body} onChange={(event) => updateExperience(lang, index, "body", event.target.value)} placeholder="Description" />
                    <button className="button secondary compact-action" type="button" onClick={() => removeExperience(lang, index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="editor-block">
                <div className="editor-row-heading">
                  <strong>Skills</strong>
                  <button className="button secondary" type="button" onClick={() => addSkill(lang)}>
                    Add skill group
                  </button>
                </div>
                {draft.skills.map((skill, index) => (
                  <div className="nested-editor two-column" key={`${skill[0]}-${index}`}>
                    <input value={skill[0] ?? ""} onChange={(event) => updateSkillGroup(lang, index, event.target.value)} placeholder="Group" />
                    <input value={skill.slice(1).join(" / ")} onChange={(event) => updateSkillItems(lang, index, event.target.value)} placeholder="Skill / Skill / Skill" />
                    <button className="button secondary compact-action" type="button" onClick={() => removeSkill(lang, index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="editor-block">
                <div className="editor-row-heading">
                  <strong>Projects</strong>
                  <button className="button secondary" type="button" onClick={() => addProject(lang)}>
                    Add project
                  </button>
                </div>
                {draft.projects.map((item, index) => (
                  <div className="nested-editor" key={`${item.title}-${index}`}>
                    <input value={item.meta} onChange={(event) => updateProject(lang, index, "meta", event.target.value)} placeholder="Meta" />
                    <input value={item.title} onChange={(event) => updateProject(lang, index, "title", event.target.value)} placeholder="Title" />
                    <textarea value={item.body} onChange={(event) => updateProject(lang, index, "body", event.target.value)} placeholder="Description" />
                    <button className="button secondary compact-action" type="button" onClick={() => removeProject(lang, index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      {message && <p className="admin-message">{message}</p>}
    </main>
  );
}
