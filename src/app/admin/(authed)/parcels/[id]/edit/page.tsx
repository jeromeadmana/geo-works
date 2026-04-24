import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getParcelById } from '@/lib/parcels';
import { getPublicCloudinaryConfig } from '@/lib/cloudinary';
import { ParcelForm } from '@/components/admin/parcel-form';
import { PhotoManager } from '@/components/admin/photo-manager';

export const metadata: Metadata = { title: 'Edit parcel' };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ created?: string }>;

export default async function EditParcelPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) notFound();

  const { id } = await params;
  const { created } = await searchParams;
  const parcel = await getParcelById(id);
  if (!parcel) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/admin/parcels" className="hover:underline">
          ← All parcels
        </Link>
      </nav>

      {created && (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Parcel created. Upload photos below and fine-tune the details.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{parcel.title}</h1>
        <Link
          href={`/parcels/${parcel.slug}`}
          target="_blank"
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          View public page ↗
        </Link>
      </div>

      <ParcelForm mode="edit" initial={parcel} mapboxToken={token} />

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Photos
        </h2>
        <PhotoManager
          parcelId={parcel.id}
          initialPhotos={parcel.photos}
          cloud={getPublicCloudinaryConfig()}
        />
      </div>
    </div>
  );
}
