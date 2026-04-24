import { getMappableParcels, toMapFeatures } from '@/lib/parcels';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await getMappableParcels();
  const body = toMapFeatures(rows);

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
