type D1StatementLike = {
  bind: (...values: unknown[]) => D1StatementLike;
  run: () => Promise<D1Result>;
  all: <T = unknown>() => Promise<D1Result<T>>;
  first: <T = unknown>() => Promise<T | null>;
};

type SqliteDatabaseSync = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...values: unknown[]) => { changes?: number; lastInsertRowid?: number | bigint };
    all: (...values: unknown[]) => unknown[];
    get: (...values: unknown[]) => unknown;
  };
};

type NodeRuntimeState = {
  db?: D1Database;
  bucket?: R2Bucket;
};

type RuntimeEnv = {
  DB?: D1Database;
  CV_BUCKET?: R2Bucket;
  INITIAL_ADMIN_USERNAME?: string;
  INITIAL_ADMIN_PASSWORD?: string;
};

const nodeState: NodeRuntimeState = {};

export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  const cloudflareEnv = await readCloudflareEnv();

  if (cloudflareEnv) {
    return cloudflareEnv as RuntimeEnv;
  }

  return getNodeRuntimeEnv();
}

async function readCloudflareEnv() {
  try {
    const importCloudflare = new Function("specifier", "return import(specifier)") as (
      specifier: string
    ) => Promise<{ env?: unknown }>;
    const cloudflareModule = await importCloudflare("cloudflare:workers");
    return cloudflareModule.env ?? null;
  } catch {
    return null;
  }
}

async function getNodeRuntimeEnv(): Promise<RuntimeEnv> {
  return {
    DB: await getNodeDb(),
    CV_BUCKET: await getNodeBucket(),
    INITIAL_ADMIN_USERNAME: process.env.INITIAL_ADMIN_USERNAME,
    INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD,
  };
}

async function getNodeDb() {
  if (nodeState.db) {
    return nodeState.db;
  }

  const [{ mkdirSync }, { dirname, resolve }, { DatabaseSync }] = await Promise.all([
    import("node:fs"),
    import("node:path"),
    import("node:sqlite"),
  ]);
  const sqlitePath = resolve(process.env.KANWU_SQLITE_PATH ?? ".data/kanwu.sqlite");

  mkdirSync(dirname(sqlitePath), { recursive: true });

  const sqlite = new DatabaseSync(sqlitePath) as SqliteDatabaseSync;
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA foreign_keys = ON");

  nodeState.db = createD1Database(sqlite);
  return nodeState.db;
}

async function getNodeBucket() {
  if (nodeState.bucket) {
    return nodeState.bucket;
  }

  nodeState.bucket = await createFileBucket(process.env.KANWU_CV_STORAGE_PATH ?? ".data/cv");
  return nodeState.bucket;
}

function createD1Database(sqlite: SqliteDatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      return createD1Statement(sqlite, sql);
    },
    batch(statements: D1StatementLike[]) {
      return Promise.all(statements.map((statement) => statement.run()));
    },
  } as unknown as D1Database;
}

function createD1Statement(sqlite: SqliteDatabaseSync, sql: string, boundValues: unknown[] = []): D1StatementLike {
  return {
    bind(...values: unknown[]) {
      return createD1Statement(sqlite, sql, values);
    },
    async run() {
      const result = sqlite.prepare(sql).run(...boundValues);
      return {
        success: true,
        meta: {
          changes: result.changes ?? 0,
          last_row_id: result.lastInsertRowid ? Number(result.lastInsertRowid) : 0,
        },
      } as D1Result;
    },
    async all<T = unknown>() {
      const results = sqlite.prepare(sql).all(...boundValues) as T[];
      return {
        success: true,
        results,
        meta: {},
      } as D1Result<T>;
    },
    async first<T = unknown>() {
      return (sqlite.prepare(sql).get(...boundValues) as T | undefined) ?? null;
    },
  };
}

async function createFileBucket(rootPath: string): Promise<R2Bucket> {
  const [{ mkdirSync, existsSync, statSync, readFileSync, writeFileSync, rmSync }, { dirname, join, resolve }] =
    await Promise.all([import("node:fs"), import("node:path")]);
  const root = resolve(rootPath);

  mkdirSync(root, { recursive: true });

  function pathForKey(key: string) {
    return join(root, key.replace(/^\/+/, ""));
  }

  return {
    async head(key: string) {
      const path = pathForKey(key);

      if (!existsSync(path)) {
        return null;
      }

      const stats = statSync(path);
      return {
        key,
        size: stats.size,
        uploaded: stats.mtime,
      };
    },
    async get(key: string) {
      const path = pathForKey(key);

      if (!existsSync(path)) {
        return null;
      }

      const buffer = readFileSync(path);
      return {
        key,
        size: buffer.byteLength,
        uploaded: statSync(path).mtime,
        body: new Blob([buffer]).stream(),
      };
    },
    async put(key: string, value: ArrayBuffer | ArrayBufferView | string | ReadableStream | Blob) {
      const path = pathForKey(key);
      mkdirSync(dirname(path), { recursive: true });

      if (value instanceof ReadableStream) {
        const response = new Response(value);
        writeFileSync(path, Buffer.from(await response.arrayBuffer()));
      } else if (value instanceof Blob) {
        writeFileSync(path, Buffer.from(await value.arrayBuffer()));
      } else if (typeof value === "string") {
        writeFileSync(path, value);
      } else if (ArrayBuffer.isView(value)) {
        writeFileSync(path, Buffer.from(value.buffer, value.byteOffset, value.byteLength));
      } else {
        writeFileSync(path, Buffer.from(value));
      }

      return null;
    },
    async delete(key: string) {
      const path = pathForKey(key);

      if (existsSync(path)) {
        rmSync(path);
      }
    },
  } as unknown as R2Bucket;
}
