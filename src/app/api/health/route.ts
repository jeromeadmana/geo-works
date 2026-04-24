import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const pingResult = await db.execute<{ ok: number }>(sql`SELECT 1 AS ok`);
    const ping = Array.isArray(pingResult) ? pingResult[0] : (pingResult as { rows?: unknown[] }).rows?.[0];

    const tablesResult = await db.execute<{ table_name: string }>(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'geo_%'
      ORDER BY table_name
    `);
    const rows = (Array.isArray(tablesResult)
      ? tablesResult
      : (tablesResult as { rows?: Array<{ table_name: string }> }).rows ?? []) as Array<{
      table_name: string;
    }>;

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      ping: ping ?? null,
      geoTables: rows.map((r) => r.table_name),
      geoTableCount: rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
