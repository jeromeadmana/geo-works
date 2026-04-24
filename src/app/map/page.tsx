import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Map',
  description: 'Interactive map of U.S. parcels — coming in Phase 2.',
};

export default function MapPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium tracking-wide text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-200">
        Phase 2
      </span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        Interactive map is on the way
      </h1>
      <p className="mt-3 max-w-xl text-neutral-600 dark:text-neutral-400">
        Mapbox clustering, state-level filtering, and a mobile bottom-sheet land
        in Phase 2. For now, browse the parcel list and jump into detail pages.
      </p>
      <Link
        href="/parcels"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      >
        Browse parcels
      </Link>
    </div>
  );
}
