import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

type PgClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __geoPgClient?: PgClient;
  __geoDb?: DrizzleDb;
};

function createDb(): DrizzleDb {
  if (globalForDb.__geoDb) return globalForDb.__geoDb;

  const client =
    globalForDb.__geoPgClient ??
    postgres(env.DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });

  const instance = drizzle(client, { schema, logger: false });

  // Cache globally in every mode. In serverless (Vercel), each cold
  // function gets its own process and the cache persists across warm
  // invocations. In a long-lived Node server (`next start`), the cache
  // keeps us to 1 Postgres connection total instead of one per render.
  globalForDb.__geoPgClient = client;
  globalForDb.__geoDb = instance;

  return instance;
}

// Lazy proxy — the postgres client is only opened on first DB call, so
// importing `db` does not trigger a connection at build/render time.
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop: string) {
    const instance = createDb();
    const value = instance[prop as keyof DrizzleDb];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export { schema };
export type Db = DrizzleDb;
