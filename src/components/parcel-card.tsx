import Link from 'next/link';
import { MapPin } from 'lucide-react';
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatAcreage,
  formatPrice,
} from '@/lib/format';
import { stateName } from '@/lib/states';
import { cn } from '@/lib/utils';
import type { ParcelWithPhotos } from '@/lib/parcels';

export function ParcelCard({ parcel }: { parcel: ParcelWithPhotos }) {
  const primaryPhoto = parcel.photos.find((p) => p.isPrimary) ?? parcel.photos[0];
  const location = [parcel.county, stateName(parcel.state)].filter(Boolean).join(', ');

  return (
    <Link
      href={`/parcels/${parcel.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {primaryPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.alt ?? parcel.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-teal-50 to-white text-emerald-700 dark:from-emerald-900/40 dark:via-teal-950/40 dark:to-neutral-900 dark:text-emerald-300">
            <MapPin className="h-10 w-10" />
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
            STATUS_BADGE_CLASSES[parcel.status],
          )}
        >
          {STATUS_LABELS[parcel.status]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-neutral-950 dark:text-white">
          {parcel.title}
        </h3>
        {location && (
          <p className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-lg font-semibold text-neutral-950 dark:text-white">
            {formatPrice(parcel.price)}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatAcreage(parcel.acreage)}
          </span>
        </div>
      </div>
    </Link>
  );
}
