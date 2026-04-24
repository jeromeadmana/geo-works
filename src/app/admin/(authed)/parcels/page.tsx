import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatAcreage,
  formatPrice,
} from '@/lib/format';
import { listAllParcelsForAdmin, type AdminSort } from '@/lib/parcels';
import { stateName, US_STATES } from '@/lib/states';
import { cn } from '@/lib/utils';
import type { ParcelStatus } from '@/db/schema';
import { BulkActions } from '@/components/admin/bulk-actions';
import { RowStatus } from '@/components/admin/row-status';
import { RowDelete } from '@/components/admin/row-delete';

export const metadata: Metadata = { title: 'Parcels' };

const ALL_STATUSES: ParcelStatus[] = ['active', 'pending', 'sold', 'inactive'];
const SORT_OPTIONS: Array<{ id: AdminSort; label: string }> = [
  { id: 'updated_desc', label: 'Recently updated' },
  { id: 'created_desc', label: 'Recently created' },
  { id: 'title_asc', label: 'Title A–Z' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'price_asc', label: 'Price: low to high' },
];

type SearchParams = Promise<{
  q?: string;
  status?: string;
  state?: string;
  sort?: string;
  page?: string;
}>;

export default async function AdminParcelsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = sp.q?.trim() || null;
  const state = sp.state?.trim() || null;
  const statuses = (() => {
    const raw = sp.status?.trim();
    if (!raw || raw === 'all') return undefined;
    const wanted = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is ParcelStatus => ALL_STATUSES.includes(s as ParcelStatus));
    return wanted.length > 0 ? wanted : undefined;
  })();
  const sort: AdminSort = (SORT_OPTIONS.find((o) => o.id === sp.sort)?.id ?? 'updated_desc');
  const page = Number.parseInt(sp.page ?? '1', 10) || 1;

  const { items, total, totalPages } = await listAllParcelsForAdmin({
    statuses,
    state,
    search,
    sort,
    page,
  });

  const currentStatus = sp.status ?? 'all';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parcels</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {total} {total === 1 ? 'listing' : 'listings'} total
          </p>
        </div>
        <Link
          href="/admin/parcels/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
        >
          <Plus className="h-4 w-4" />
          New parcel
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="GET">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Search
          </label>
          <input
            type="search"
            name="q"
            defaultValue={search ?? ''}
            placeholder="Title, APN, or county"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Status
          </label>
          <select
            name="status"
            defaultValue={currentStatus}
            className="h-[38px] rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="all">All</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
            State
          </label>
          <select
            name="state"
            defaultValue={state ?? ''}
            className="h-[38px] rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Any</option>
            {Object.entries(US_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Sort
          </label>
          <select
            name="sort"
            defaultValue={sort}
            className="h-[38px] rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-[38px] rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          Apply
        </button>
      </form>

      <BulkActions>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-400">
              <tr>
                <th className="w-10 px-3 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Location</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Acreage</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Updated</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm text-neutral-500"
                  >
                    No parcels match these filters.
                  </td>
                </tr>
              ) : (
                items.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        name="selected"
                        value={parcel.id}
                        form="bulk-form"
                        className="h-4 w-4 rounded border-neutral-300 accent-emerald-600"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/parcels/${parcel.id}/edit`}
                        className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                      >
                        {parcel.title}
                      </Link>
                      <div className="mt-0.5 font-mono text-xs text-neutral-400">
                        {parcel.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutral-600 dark:text-neutral-400">
                      {[parcel.county, stateName(parcel.state)].filter(Boolean).join(', ')}
                    </td>
                    <td className="px-3 py-3">{formatPrice(parcel.price)}</td>
                    <td className="px-3 py-3 text-neutral-600 dark:text-neutral-400">
                      {formatAcreage(parcel.acreage)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                          STATUS_BADGE_CLASSES[parcel.status],
                        )}
                      >
                        {STATUS_LABELS[parcel.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {new Date(parcel.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'UTC',
                      })}
                      <span className="ml-1 text-neutral-400">UTC</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <RowStatus id={parcel.id} status={parcel.status} />
                        <RowDelete id={parcel.id} title={parcel.title} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BulkActions>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          params={{ q: search, status: sp.status ?? null, state, sort }}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | null | undefined>;
}) {
  const buildHref = (p: number) => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) usp.set(k, v);
    }
    if (p !== 1) usp.set('page', String(p));
    const qs = usp.toString();
    return `/admin/parcels${qs ? `?${qs}` : ''}`;
  };
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  return (
    <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
      <Link
        href={buildHref(prev)}
        aria-disabled={page === 1}
        className={page === 1 ? 'pointer-events-none text-neutral-400' : 'font-medium hover:underline'}
      >
        ← Previous
      </Link>
      <span className="text-neutral-500">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(next)}
        aria-disabled={page === totalPages}
        className={page === totalPages ? 'pointer-events-none text-neutral-400' : 'font-medium hover:underline'}
      >
        Next →
      </Link>
    </nav>
  );
}
