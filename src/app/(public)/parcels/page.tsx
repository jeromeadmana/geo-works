import type { Metadata } from 'next';
import Link from 'next/link';
import { ParcelCard } from '@/components/parcel-card';
import { listActiveParcels } from '@/lib/parcels';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'All parcels',
  description: 'Browse every available land parcel listed on GeoWorks.',
};

export default async function ParcelsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number.parseInt(pageParam ?? '1', 10) || 1;

  const { items, total, totalPages } = await listActiveParcels({ page });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            All parcels
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {total} {total === 1 ? 'listing' : 'listings'} available
          </p>
        </div>
        <Link
          href="/map"
          className="inline-flex h-9 items-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-medium transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          View on map
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((parcel) => (
            <ParcelCard key={parcel.id} parcel={parcel} />
          ))}
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
      <h3 className="text-base font-semibold">No parcels yet</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Run <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">npm run db:seed</code> to
        populate some sample listings.
      </p>
    </div>
  );
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  return (
    <nav className="mt-10 flex items-center justify-between" aria-label="Pagination">
      <Link
        href={`/parcels?page=${prev}`}
        aria-disabled={page === 1}
        className={
          page === 1
            ? 'pointer-events-none text-sm text-neutral-400'
            : 'text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100'
        }
      >
        ← Previous
      </Link>
      <span className="text-sm text-neutral-500">
        Page {page} of {totalPages}
      </span>
      <Link
        href={`/parcels?page=${next}`}
        aria-disabled={page === totalPages}
        className={
          page === totalPages
            ? 'pointer-events-none text-sm text-neutral-400'
            : 'text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100'
        }
      >
        Next →
      </Link>
    </nav>
  );
}
