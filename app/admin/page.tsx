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
  };
  daily: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ path: string; views: number }>;
  referrers: Array<{ referrer: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
  browsers: Array<{ browser: string; views: number }>;
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

function maxDailyViews(analytics: AnalyticsSummary | null) {
  return Math.max(1, ...(analytics?.daily.map((item) => item.views) ?? [0]));
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

  useEffect(() => {
    refreshMe()
      .then((user) =>
        Promise.all([
          refreshStatus(),
          refreshContent(),
          refreshAnalytics(),
          user.role === "super_admin" ? refreshUsers() : Promise.resolve(),
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

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(newUser),
      });
      const payload = await readJson<{ message?: string }>(response);

      setNewUser({ username: "", password: "", role: "admin" });
      setMessage(payload.message ?? "User created.");
      await refreshUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(user: AdminUser, field: "username" | "role" | "password", value: string) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: field === "username" ? value : user.username,
          role: field === "role" ? value : user.role,
          password: field === "password" ? value : undefined,
        }),
      });
      const payload = await readJson<{ message?: string }>(response);

      setMessage(payload.message ?? "User updated.");
      await refreshUsers();
      await refreshMe();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const payload = await readJson<{ message?: string }>(response);

      setMessage(payload.message ?? "User deleted.");
      await refreshUsers();
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
              username: value,
            }
          : user
      )
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
    return (user as AdminUser & { newPassword?: string }).newPassword ?? "";
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
        </div>
        <div className="traffic-chart" aria-label="Daily traffic">
          {(analytics?.daily.length ? analytics.daily : [{ date: "No data", views: 0, visitors: 0 }]).map((item) => (
            <div className="traffic-bar" key={item.date}>
              <span>{item.date.slice(5) || item.date}</span>
              <i style={{ height: `${Math.max(8, (item.views / maxDailyViews(analytics)) * 100)}%` }} />
              <b>{item.views}</b>
            </div>
          ))}
        </div>
        <div className="analytics-lists">
          <div>
            <p className="section-label">Top pages</p>
            {(analytics?.topPages.length ? analytics.topPages : [{ path: "No visits yet", views: 0 }]).map((item) => (
              <p key={item.path}>
                <span>{item.path}</span>
                <strong>{item.views}</strong>
              </p>
            ))}
          </div>
          <div>
            <p className="section-label">Sources</p>
            {(analytics?.referrers.length ? analytics.referrers : [{ referrer: "Direct", views: 0 }]).map((item) => (
              <p key={item.referrer}>
                <span>{item.referrer}</span>
                <strong>{item.views}</strong>
              </p>
            ))}
          </div>
          <div>
            <p className="section-label">Devices</p>
            {(analytics?.devices.length ? analytics.devices : [{ device: "No data", views: 0 }]).map((item) => (
              <p key={item.device}>
                <span>{item.device}</span>
                <strong>{item.views}</strong>
              </p>
            ))}
          </div>
          <div>
            <p className="section-label">Browsers</p>
            {(analytics?.browsers.length ? analytics.browsers : [{ browser: "No data", views: 0 }]).map((item) => (
              <p key={item.browser}>
                <span>{item.browser}</span>
                <strong>{item.views}</strong>
              </p>
            ))}
          </div>
        </div>
        <div className="analytics-notes">
          <p>Useful next metrics: CV download clicks, contact icon clicks, language preference, and visit location by country.</p>
        </div>
      </section>

      {currentUser.role === "super_admin" && (
        <section className="content-editor user-management">
          <div className="editor-heading">
            <div>
              <p className="section-label">Users</p>
              <h2>Administrator accounts</h2>
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
                  <option value="super_admin">Super administrator</option>
                </select>
              </label>
              <button className="button primary" type="submit" disabled={busy}>
                Create user
              </button>
            </div>
          </form>

          <div className="user-list">
            {users.map((user) => (
              <article className="editor-card user-row" key={user.id}>
                <label>
                  <span>Username</span>
                  <input
                    value={user.username}
                    onChange={(event) => updateUserUsernameDraft(user.id, event.target.value)}
                  />
                </label>
                <label>
                  <span>Role</span>
                  <select
                    value={user.role}
                    onChange={(event) => updateUserRoleDraft(user.id, event.target.value as AdminRole)}
                  >
                    <option value="admin">Administrator</option>
                    <option value="super_admin">Super administrator</option>
                  </select>
                </label>
                <label>
                  <span>New password</span>
                  <input
                    value={getUserPasswordDraft(user)}
                    onChange={(event) => updateUserPasswordDraft(user.id, event.target.value)}
                    type="password"
                    placeholder="Leave blank unless resetting"
                  />
                </label>
                <div className="admin-actions">
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => updateUser(user, "username", user.username)}
                  >
                    Save name
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => updateUser(user, "role", user.role)}
                  >
                    Save role
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy || !getUserPasswordDraft(user)}
                    onClick={() => updateUser(user, "password", getUserPasswordDraft(user))}
                  >
                    Reset password
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy || user.id === currentUser.id}
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
