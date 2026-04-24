import Link from 'next/link';
import { listActiveParcels } from '@/lib/parcels';
import { ParcelCard } from '@/components/parcel-card';

export const revalidate = 60;

export default async function HomePage() {
  const { items } = await listActiveParcels({ page: 1, pageSize: 3 });
  const featured = items;

  return (
    <>
      <section className="relative overflow-hidden border-b border-black/5 bg-gradient-to-b from-emerald-50 via-white to-white dark:border-white/10 dark:from-emerald-950/40 dark:via-neutral-950 dark:to-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium tracking-wide text-emerald-800 uppercase dark:bg-emerald-900/40 dark:text-emerald-200">
              U.S. land · owner financing
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
              Land, on a map. Not lost in a spreadsheet.
            </h1>
            <p className="mt-5 text-lg text-neutral-600 sm:text-xl dark:text-neutral-400">
              Browse vetted parcels across the lower 48, pan and zoom the live
              map, and jump straight into details — acreage, price, APN, and
              owner-financing terms when available.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Open the map
              </Link>
              <Link
                href="/parcels"
                className="inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              >
                Browse parcels
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Fresh listings
              </h2>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                A handful of parcels we&apos;re watching this week.
              </p>
            </div>
            <Link
              href="/parcels"
              className="hidden text-sm font-medium text-emerald-700 hover:underline sm:inline dark:text-emerald-400"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((parcel) => (
              <ParcelCard key={parcel.id} parcel={parcel} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
