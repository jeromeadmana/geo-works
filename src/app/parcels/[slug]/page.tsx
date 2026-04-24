import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatAcreage,
  formatCoord,
  formatPrice,
} from '@/lib/format';
import { getParcelBySlug } from '@/lib/parcels';
import { stateName } from '@/lib/states';
import { cn } from '@/lib/utils';

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const parcel = await getParcelBySlug(slug);
  if (!parcel) return { title: 'Parcel not found' };

  const location = [parcel.county, stateName(parcel.state)].filter(Boolean).join(', ');
  const description = parcel.description?.slice(0, 180) || `${formatAcreage(parcel.acreage)} in ${location}.`;

  return {
    title: parcel.title,
    description,
    openGraph: {
      title: parcel.title,
      description,
      type: 'article',
      images: parcel.photos[0]?.url ? [{ url: parcel.photos[0].url }] : undefined,
    },
  };
}

export default async function ParcelDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const parcel = await getParcelBySlug(slug);
  if (!parcel) notFound();

  const location = [parcel.county, stateName(parcel.state)].filter(Boolean).join(', ');
  const primaryPhoto = parcel.photos.find((p) => p.isPrimary) ?? parcel.photos[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: parcel.title,
    description: parcel.description,
    address: {
      '@type': 'PostalAddress',
      addressRegion: parcel.state,
      addressLocality: parcel.county ?? undefined,
      postalCode: parcel.zipCode ?? undefined,
      streetAddress: parcel.addressLine ?? undefined,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: parcel.lat,
      longitude: parcel.lng,
    },
    offers: parcel.price
      ? {
          '@type': 'Offer',
          price: parcel.price,
          priceCurrency: 'USD',
          availability:
            parcel.status === 'active'
              ? 'https://schema.org/InStock'
              : parcel.status === 'pending'
                ? 'https://schema.org/PreOrder'
                : 'https://schema.org/SoldOut',
        }
      : undefined,
    image: parcel.photos.map((p) => p.url),
  };

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/parcels" className="hover:underline">
          ← All parcels
        </Link>
      </nav>

      <header className="mb-8">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
            STATUS_BADGE_CLASSES[parcel.status],
          )}
        >
          {STATUS_LABELS[parcel.status]}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {parcel.title}
        </h1>
        {location && (
          <p className="mt-2 flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <MapPin className="h-4 w-4" />
            {location}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {primaryPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryPhoto.url}
              alt={primaryPhoto.alt ?? parcel.title}
              className="aspect-[4/3] w-full rounded-2xl bg-neutral-100 object-cover dark:bg-neutral-800"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-50 to-white text-emerald-700 dark:from-emerald-900/40 dark:via-teal-950/40 dark:to-neutral-900 dark:text-emerald-300">
              <MapPin className="h-12 w-12" />
            </div>
          )}

          {parcel.photos.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {parcel.photos.slice(1, 5).map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.alt ?? ''}
                  className="aspect-square rounded-lg bg-neutral-100 object-cover dark:bg-neutral-800"
                />
              ))}
            </div>
          )}

          {parcel.description && (
            <section className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
              <h2 className="text-xl font-semibold">About this parcel</h2>
              <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                {parcel.description}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Asking price</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatPrice(parcel.price)}
            </p>
            <dl className="mt-6 divide-y divide-black/5 text-sm dark:divide-white/10">
              <DetailRow label="Acreage" value={formatAcreage(parcel.acreage)} />
              {parcel.apn && <DetailRow label="APN" value={parcel.apn} mono />}
              <DetailRow
                label="Location"
                value={formatCoord(parcel.lat, parcel.lng)}
                mono
              />
              {parcel.zipCode && (
                <DetailRow label="ZIP code" value={parcel.zipCode} mono />
              )}
              <DetailRow
                label="Status"
                value={STATUS_LABELS[parcel.status]}
              />
            </dl>
          </div>

          {isNonEmptyObject(parcel.terms) && (
            <SidebarSection title="Terms" data={parcel.terms} />
          )}
          {isNonEmptyObject(parcel.financing) && (
            <SidebarSection title="Financing" data={parcel.financing} />
          )}

          <Link
            href={`/map#parcel-${parcel.id}`}
            className="flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            View on map
          </Link>
        </aside>
      </div>
    </article>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={cn('text-neutral-900 dark:text-neutral-100', mono && 'font-mono text-xs')}>
        {value}
      </dd>
    </div>
  );
}

function SidebarSection({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown>;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <h3 className="text-sm font-semibold tracking-tight uppercase text-neutral-500">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <dt className="text-neutral-500 dark:text-neutral-400">{humanizeKey(key)}</dt>
            <dd className="text-right text-neutral-900 dark:text-neutral-100">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}
