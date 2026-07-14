"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Login failed.");
      }

      window.location.href = "/admin";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page login-page">
      <header className="subpage-header">
        <a href="/">Back to site</a>
      </header>

      <section className="admin-hero login-hero">
        <p className="eyebrow">Admin login</p>
        <h1>Sign in</h1>
        <p>
          Use a database-backed administrator account to manage CV files,
          homepage content, and users.
        </p>
      </section>

      <form className="admin-panel login-panel" onSubmit={submitLogin}>
        <label className="admin-key">
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Username"
          />
        </label>
        <label className="admin-key">
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            type="password"
            placeholder="Enter password"
          />
        </label>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>

      {message && <p className="admin-message">{message}</p>}
    </main>
  );
}
