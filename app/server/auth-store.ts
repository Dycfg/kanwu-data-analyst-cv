export type AdminRole = "super_admin" | "admin";

export type AdminUser = {
  id: string;
  username: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthRuntimeEnv = {
  DB?: D1Database;
  INITIAL_ADMIN_USERNAME?: string;
  INITIAL_ADMIN_PASSWORD?: string;
};

const sessionCookieName = "kanwu_admin_session";
const passwordAlgorithm = "pbkdf2_sha256";
const passwordIterations = 210_000;
const sessionDays = 7;
const defaultLocalAdminPassword = "Kanwu-Admin#2026";

type AdminUserRow = AdminUser & {
  passwordHash: string;
};

type SessionRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export function sessionCookieDelete() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function ensureAuthTables(db: D1Database) {
  await db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES admin_users(id), token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS admin_sessions_user_id_idx ON admin_sessions(user_id)"
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions(expires_at)"
    ),
  ]);
}

export async function bootstrapSuperAdmin(db: D1Database, env: AuthRuntimeEnv, request: Request) {
  await ensureAuthTables(db);

  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM admin_users")
    .first<{ count: number }>();

  if ((row?.count ?? 0) > 0) {
    return;
  }

  const local = isLocalRequest(request);
  const username = env.INITIAL_ADMIN_USERNAME ?? (local ? "admin" : "");
  const password = env.INITIAL_ADMIN_PASSWORD ?? (local ? defaultLocalAdminPassword : "");

  if (!username || !password) {
    return;
  }

  await createAdminUser(db, {
    username,
    password,
    role: "super_admin",
  });
}

export async function loginAdmin(
  db: D1Database,
  username: string,
  password: string
) {
  await ensureAuthTables(db);

  const row = await db
    .prepare(
      "SELECT id, username, password_hash AS passwordHash, role, created_at AS createdAt, updated_at AS updatedAt FROM admin_users WHERE username = ?"
    )
    .bind(username.trim())
    .first<AdminUserRow>();

  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    return null;
  }

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();

  await db
    .prepare(
      "INSERT INTO admin_sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .bind(crypto.randomUUID(), row.id, tokenHash, expiresAt)
    .run();

  return {
    user: toPublicUser(row),
    cookie: sessionCookie(token, expiresAt),
  };
}

export async function logoutAdmin(db: D1Database | undefined, request: Request) {
  if (!db) {
    return;
  }

  const token = getSessionToken(request);

  if (!token) {
    return;
  }

  await ensureAuthTables(db);
  await db
    .prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
    .bind(await sha256Hex(token))
    .run();
}

export async function getAdminUser(db: D1Database | undefined, request: Request) {
  if (!db) {
    return null;
  }

  const token = getSessionToken(request);

  if (!token) {
    return null;
  }

  await ensureAuthTables(db);
  await db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").bind(new Date().toISOString()).run();

  const row = await db
    .prepare(
      "SELECT u.id, u.username, u.password_hash AS passwordHash, u.role, u.created_at AS createdAt, u.updated_at AS updatedAt FROM admin_sessions s INNER JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?"
    )
    .bind(await sha256Hex(token), new Date().toISOString())
    .first<AdminUserRow>();

  return row ? toPublicUser(row) : null;
}

export async function requireAdminUser(db: D1Database | undefined, request: Request) {
  const user = await getAdminUser(db, request);

  if (!user) {
    return { response: Response.json({ error: "Login required." }, { status: 401 }) };
  }

  return { user };
}

export async function requireSuperAdmin(db: D1Database | undefined, request: Request) {
  const result = await requireAdminUser(db, request);

  if ("response" in result) {
    return result;
  }

  if (result.user.role !== "super_admin") {
    return { response: Response.json({ error: "Super administrator access required." }, { status: 403 }) };
  }

  return result;
}

export async function listAdminUsers(db: D1Database) {
  await ensureAuthTables(db);

  const rows = await db
    .prepare(
      "SELECT id, username, role, created_at AS createdAt, updated_at AS updatedAt FROM admin_users ORDER BY created_at ASC"
    )
    .all<AdminUser>();

  return rows.results ?? [];
}

export async function createAdminUser(
  db: D1Database,
  input: { username: string; password: string; role: AdminRole }
) {
  await ensureAuthTables(db);
  validateUsername(input.username);
  validatePassword(input.password);

  const user: AdminUser = {
    id: crypto.randomUUID(),
    username: input.username.trim(),
    role: input.role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db
    .prepare(
      "INSERT INTO admin_users (id, username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    .bind(user.id, user.username, await hashPassword(input.password), user.role)
    .run();

  return user;
}

export async function updateAdminUser(
  db: D1Database,
  actor: AdminUser,
  id: string,
  input: { username?: string; password?: string; role?: AdminRole }
) {
  await ensureAuthTables(db);

  const existing = await getUserById(db, id);

  if (!existing) {
    return null;
  }

  const nextUsername = input.username?.trim() || existing.username;
  const nextRole = input.role ?? existing.role;
  const nextPasswordHash = input.password
    ? await hashPassword(validatePassword(input.password))
    : existing.passwordHash;

  validateUsername(nextUsername);

  if (existing.role === "super_admin" && nextRole !== "super_admin") {
    await assertCanRemoveSuperAdmin(db, id);
  }

  await db
    .prepare(
      "UPDATE admin_users SET username = ?, password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(nextUsername, nextPasswordHash, nextRole, id)
    .run();

  if (actor.id === id && nextRole !== "super_admin") {
    await db.prepare("DELETE FROM admin_sessions WHERE user_id = ?").bind(id).run();
  }

  return toPublicUser({
    ...existing,
    username: nextUsername,
    passwordHash: nextPasswordHash,
    role: nextRole,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAdminUser(db: D1Database, id: string) {
  await ensureAuthTables(db);

  const existing = await getUserById(db, id);

  if (!existing) {
    return false;
  }

  if (existing.role === "super_admin") {
    await assertCanRemoveSuperAdmin(db, id);
  }

  await db.batch([
    db.prepare("DELETE FROM admin_sessions WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM admin_users WHERE id = ?").bind(id),
  ]);

  return true;
}

export async function changeOwnPassword(
  db: D1Database,
  user: AdminUser,
  currentPassword: string,
  nextPassword: string
) {
  await ensureAuthTables(db);

  const existing = await getUserById(db, user.id);

  if (!existing || !(await verifyPassword(currentPassword, existing.passwordHash))) {
    throw new Error("Current password is incorrect.");
  }

  validatePassword(nextPassword);

  await db
    .prepare("UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(await hashPassword(nextPassword), user.id)
    .run();
}

function getSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${sessionCookieName}=`));

  return match ? decodeURIComponent(match.slice(sessionCookieName.length + 1)) : null;
}

async function getUserById(db: D1Database, id: string) {
  return db
    .prepare(
      "SELECT id, username, password_hash AS passwordHash, role, created_at AS createdAt, updated_at AS updatedAt FROM admin_users WHERE id = ?"
    )
    .bind(id)
    .first<AdminUserRow>();
}

async function assertCanRemoveSuperAdmin(db: D1Database, id: string) {
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM admin_users WHERE role = 'super_admin' AND id != ?")
    .bind(id)
    .first<{ count: number }>();

  if ((row?.count ?? 0) < 1) {
    throw new Error("Keep at least one super administrator.");
  }
}

function toPublicUser(row: AdminUserRow | AdminUser): AdminUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function sessionCookie(token: string, expiresAt: string) {
  return [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ].join("; ");
}

function validateUsername(username: string) {
  const value = username.trim();

  if (value.length < 3 || value.length > 40) {
    throw new Error("Username must be 3-40 characters.");
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error("Username can only contain letters, numbers, dots, underscores, and hyphens.");
  }

  return value;
}

function validatePassword(password: string) {
  if (!password) {
    throw new Error("Password is required.");
  }

  if (password.length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }

  if (/\s/.test(password)) {
    throw new Error("Password cannot contain spaces.");
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must include an uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    throw new Error("Password must include a lowercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    throw new Error("Password must include a number.");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error("Password must include a symbol.");
  }

  return password;
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", textBytes(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: passwordIterations,
    },
    key,
    256
  );

  return [
    passwordAlgorithm,
    String(passwordIterations),
    base64UrlEncode(salt),
    base64UrlEncode(new Uint8Array(bits)),
  ].join("$");
}

async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationsValue, saltValue, hashValue] = stored.split("$");
  const iterations = Number(iterationsValue);

  if (algorithm !== passwordAlgorithm || !iterations || !saltValue || !hashValue) {
    return false;
  }

  const salt = base64UrlDecode(saltValue);
  const expected = base64UrlDecode(hashValue);
  const key = await crypto.subtle.importKey("raw", textBytes(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    key,
    expected.length * 8
  );

  return timingSafeEqual(new Uint8Array(bits), expected);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", textBytes(value));

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(size: number) {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(size)));
}

function textBytes(value: string) {
  return new TextEncoder().encode(value);
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }

  return result === 0;
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;

  return hostname === "localhost" || hostname === "127.0.0.1";
}
