import type { Metadata } from 'next';
import { MapUnavailable } from '@/components/map-unavailable';
import { ParcelMap } from '@/components/parcel-map';
import { getMappableParcels, toMapFeatures } from '@/lib/parcels';

export const metadata: Metadata = {
  title: 'Map',
  description: 'Interactive map of U.S. parcels for sale. Filter by status, click markers for details.',
};

type SearchParams = Promise<{ focus?: string }>;

export default async function MapPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return <MapUnavailable reason="missing_token" />;

  const { focus } = await searchParams;
  const rows = await getMappableParcels();
  const initialFeatures = toMapFeatures(rows);

  return (
    <ParcelMap
      token={token}
      initialFeatures={initialFeatures}
      initialFocusId={focus}
    />
  );
}
