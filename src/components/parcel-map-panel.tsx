'use client';

import Link from 'next/link';
import { MapPin, X } from 'lucide-react';
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatAcreage,
  formatPrice,
} from '@/lib/format';
import type { MapFeatureProperties } from '@/lib/parcels';
import { stateName } from '@/lib/states';
import { cn } from '@/lib/utils';

export function ParcelMapPanel({
  data,
  onClose,
}: {
  data: MapFeatureProperties;
  onClose: () => void;
}) {
  const location = [data.county, stateName(data.state)].filter(Boolean).join(', ');

  return (
    <aside
      role="dialog"
      aria-label={`${data.title} — summary`}
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border border-b-0 border-black/10 bg-white p-5 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-80 sm:rounded-2xl sm:border-b dark:border-white/10 dark:bg-neutral-900"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <X className="h-4 w-4" />
      </button>

      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
          STATUS_BADGE_CLASSES[data.status],
        )}
      >
        {STATUS_LABELS[data.status]}
      </span>

      <h3 className="mt-2 line-clamp-2 pr-8 text-base font-semibold tracking-tight text-neutral-950 dark:text-white">
        {data.title}
      </h3>

      {location && (
        <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </p>
      )}

      <div className="mt-4 flex items-end justify-between">
        <span className="text-xl font-semibold text-neutral-950 dark:text-white">
          {formatPrice(data.price)}
        </span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatAcreage(data.acreage)}
        </span>
      </div>

      <Link
        href={`/parcels/${data.slug}`}
        className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      >
        View details
      </Link>
    </aside>
  );
}
