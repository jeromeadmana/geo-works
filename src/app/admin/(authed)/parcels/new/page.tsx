import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ParcelForm } from '@/components/admin/parcel-form';

export const metadata: Metadata = { title: 'New parcel' };

export default function NewParcelPage() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/admin/parcels" className="hover:underline">
          ← All parcels
        </Link>
      </nav>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New parcel</h1>
      <ParcelForm mode="create" mapboxToken={token} />
    </div>
  );
}
