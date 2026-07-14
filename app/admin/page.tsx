"use client";

import { FormEvent, useEffect, useState } from "react";

type Status = {
  en: { exists: boolean; updated?: string; size?: number };
  zh: { exists: boolean; updated?: string; size?: number };
};

const labels = {
  en: "English CV",
  zh: "Chinese CV",
};

function formatSize(size?: number) {
  if (!size) {
    return "No file";
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshStatus() {
    const response = await fetch("/api/admin/cv", { cache: "no-store" });
    const payload = (await response.json()) as Status;
    setStatus(payload);
  }

  useEffect(() => {
    refreshStatus().catch(() => {
      setMessage("Unable to read CV status.");
    });
  }, []);

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
        headers: {
          "x-admin-key": adminKey,
        },
        body: formData,
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

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
        headers: {
          "x-admin-key": adminKey,
        },
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Remove failed.");
      }

      setMessage(payload.message ?? "CV removed.");
      await refreshStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Remove failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="subpage-header">
        <a href="/">Back to site</a>
        <a href="/cv">View CV</a>
      </header>

      <section className="admin-hero">
        <p className="eyebrow">Admin</p>
        <h1>CV file management</h1>
        <p>
          Replace the public English and Chinese CV PDFs. The first deployed
          version uses a single administrator key and object storage for the
          uploaded files.
        </p>
      </section>

      <section className="admin-panel">
        <label className="admin-key">
          <span>Administrator key</span>
          <input
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            type="password"
            placeholder="Enter admin key"
          />
        </label>
        <p>
          Local development key: <code>kanwu-admin</code>. For deployment, set a
          private <code>ADMIN_KEY</code> runtime value before using uploads.
        </p>
      </section>

      <section className="upload-grid">
        {(["en", "zh"] as const).map((locale) => (
          <form
            className="upload-card"
            key={locale}
            onSubmit={(event) => uploadCv(event, locale)}
          >
            <div>
              <span>{labels[locale]}</span>
              <strong>{status?.[locale].exists ? "Uploaded" : "Missing"}</strong>
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
                Remove
              </button>
            </div>
          </form>
        ))}
      </section>

      {message && <p className="admin-message">{message}</p>}

      <section className="admin-roadmap">
        <p className="section-label">Next phases</p>
        <div className="skill-row">
          <strong>Profile content</strong>
          <span>Name, title, contact links, bilingual intro editing</span>
        </div>
        <div className="skill-row">
          <strong>Experience CMS</strong>
          <span>Company, role, dates, bullets, ordering, draft and publish</span>
        </div>
        <div className="skill-row">
          <strong>Aliyun migration</strong>
          <span>OSS storage, ECS deployment, DNS, HTTPS, and ICP filing path</span>
        </div>
      </section>
    </main>
  );
}
