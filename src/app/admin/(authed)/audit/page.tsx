import type { Metadata } from 'next';
import { desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { auditLog } from '@/db/schema';

export const metadata: Metadata = { title: 'Audit log' };

const PAGE_SIZE = 50;

type SearchParams = Promise<{ page?: string }>;

const ACTION_LABELS: Record<string, string> = {
  'parcel.create': 'Created parcel',
  'parcel.update': 'Edited parcel',
  'parcel.delete': 'Deleted parcel',
  'parcel.status_change': 'Changed status',
  'parcel.bulk_status_change': 'Bulk status change',
  'photo.add': 'Added photo',
  'photo.remove': 'Removed photo',
  'photo.set_primary': 'Set primary photo',
  'photo.reorder': 'Reordered photos',
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLog),
  ]);

  const total = totalRow[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {total} {total === 1 ? 'entry' : 'entries'} — most recent first.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No audit entries yet. They&apos;ll show up here after the first edit.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-3 font-medium">When</th>
                <th className="px-3 py-3 font-medium">Actor</th>
                <th className="px-3 py-3 font-medium">Action</th>
                <th className="px-3 py-3 font-medium">Entity</th>
                <th className="px-3 py-3 font-medium">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-500">
                    {new Date(row.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'UTC',
                    })}{' '}
                    UTC
                  </td>
                  <td className="px-3 py-3 text-xs text-neutral-700 dark:text-neutral-300">
                    {row.actorEmail ?? <span className="italic text-neutral-400">unknown</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      {ACTION_LABELS[row.action] ?? row.action}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[10px] text-neutral-500">
                    {row.entityType}
                    {row.entityId && (
                      <>
                        <br />
                        {row.entityId.slice(0, 8)}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {row.diff ? (
                      <details>
                        <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
                          show
                        </summary>
                        <pre className="mt-2 max-w-md overflow-x-auto rounded-lg bg-neutral-950 px-3 py-2 text-[10px] leading-snug text-neutral-100">
{JSON.stringify(row.diff, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          <a
            href={`/admin/audit${page > 1 ? `?page=${page - 1}` : ''}`}
            aria-disabled={page === 1}
            className={page === 1 ? 'pointer-events-none text-neutral-400' : 'font-medium hover:underline'}
          >
            ← Previous
          </a>
          <span className="text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <a
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={page === totalPages}
            className={page === totalPages ? 'pointer-events-none text-neutral-400' : 'font-medium hover:underline'}
          >
            Next →
          </a>
        </nav>
      )}
    </div>
  );
}
