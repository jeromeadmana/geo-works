import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { parcelPhotos, parcels } from '../src/db/schema';
import { slugify } from '../src/lib/slug';

type SeedParcel = {
  title: string;
  description: string;
  price: number;
  acreage: number;
  apn: string;
  state: string;
  county: string;
  lat: number;
  lng: number;
  status: 'active' | 'pending' | 'sold' | 'inactive';
  terms?: Record<string, unknown>;
  financing?: Record<string, unknown>;
  featured?: boolean;
  photos?: { url: string; alt?: string; isPrimary?: boolean }[];
};

const SEED: SeedParcel[] = [
  {
    title: '160 Acres in Brewster County, TX',
    description:
      'Wide-open high-desert acreage near Big Bend with expansive mountain views and year-round legal access. Ideal for an off-grid retreat, hunting camp, or long-term hold. Power is at the property line; well will need to be drilled. No HOA, no building restrictions.',
    price: 59500,
    acreage: 160,
    apn: '0001-0012-0160',
    state: 'TX',
    county: 'Brewster',
    lat: 29.891,
    lng: -103.312,
    status: 'active',
    featured: true,
    terms: { title: 'Warranty deed', access: 'Year-round legal access', hoa: 'None' },
    financing: { down_payment_usd: 5950, monthly_usd: 579, term_months: 120, interest_apr: 9.9 },
  },
  {
    title: '40 Acres Near Marfa — Presidio County, TX',
    description:
      'Remote high-desert parcel one hour from Marfa. Night skies certified by the county as some of the darkest in the lower 48. Seller-held financing available with a low down payment.',
    price: 17900,
    acreage: 40,
    apn: '0042-0881-0040',
    state: 'TX',
    county: 'Presidio',
    lat: 30.298,
    lng: -104.012,
    status: 'active',
    financing: { down_payment_usd: 1790, monthly_usd: 189, term_months: 120, interest_apr: 9.9 },
  },
  {
    title: '80 Acres Off-Grid — Luna County, NM',
    description:
      'Flat, buildable high-desert acreage between Deming and Columbus. Gravel county road access, no flood plain, no restrictions on RV living. Clean title, no back taxes.',
    price: 22500,
    acreage: 80,
    apn: 'NM-LUN-3201-0080',
    state: 'NM',
    county: 'Luna',
    lat: 32.105,
    lng: -107.724,
    status: 'active',
    financing: { down_payment_usd: 2250, monthly_usd: 249, term_months: 120, interest_apr: 9.9 },
  },
  {
    title: '120 Acres with Mountain Views — Sierra County, NM',
    description:
      'Rolling acreage with panoramic views of the Black Range. Several flat building sites identified, seasonal creek crosses the eastern corner, mature juniper scattered throughout.',
    price: 48900,
    acreage: 120,
    apn: 'NM-SIE-7704-0120',
    state: 'NM',
    county: 'Sierra',
    lat: 33.1,
    lng: -107.3,
    status: 'pending',
  },
  {
    title: '5 Acres — San Luis Valley, Costilla County, CO',
    description:
      'Flat, dry-lot acreage in the San Luis Valley. No HOA, no building timeline, clean title. Cash price or owner financing available.',
    price: 8500,
    acreage: 5,
    apn: 'CO-COS-5501-0005',
    state: 'CO',
    county: 'Costilla',
    lat: 37.245,
    lng: -105.418,
    status: 'active',
    financing: { down_payment_usd: 850, monthly_usd: 99, term_months: 96, interest_apr: 9.9 },
  },
  {
    title: '40 Acres — Apache County, AZ',
    description:
      'Big-sky acreage in northeast Arizona. Dirt-road access, no utilities, cabin-friendly zoning. Perfect for an off-grid hunting retreat.',
    price: 19500,
    acreage: 40,
    apn: 'AZ-APA-1122-0040',
    state: 'AZ',
    county: 'Apache',
    lat: 35.412,
    lng: -109.501,
    status: 'active',
  },
  {
    title: '1 Acre in Mohave County, AZ',
    description:
      'One buildable acre near Kingman. Close to Route 66 and Lake Havasu. Power at the road, no HOA, modular homes allowed.',
    price: 6900,
    acreage: 1,
    apn: 'AZ-MOH-3309-0001',
    state: 'AZ',
    county: 'Mohave',
    lat: 35.511,
    lng: -114.008,
    status: 'active',
    featured: true,
    financing: { down_payment_usd: 690, monthly_usd: 79, term_months: 96, interest_apr: 9.9 },
  },
  {
    title: '20 Acres Near Tonopah — Nye County, NV',
    description:
      'Twenty acres of unspoiled high desert north of Tonopah. Stunning mountain views, zero restrictions on RVs and tiny homes, year-round dry road access.',
    price: 14500,
    acreage: 20,
    apn: 'NV-NYE-4401-0020',
    state: 'NV',
    county: 'Nye',
    lat: 37.301,
    lng: -117.041,
    status: 'active',
  },
  {
    title: '20 Acres Bordering Public Land — Park County, MT',
    description:
      'Twenty acres of wooded mountain land in Park County, Montana, bordering hundreds of thousands of acres of public forest. Bring your hunt camp or build a small cabin — the view will never be built out.',
    price: 128000,
    acreage: 20,
    apn: 'MT-PAR-6603-0020',
    state: 'MT',
    county: 'Park',
    lat: 45.512,
    lng: -110.612,
    status: 'active',
    featured: true,
  },
  {
    title: '640 Acres — Fremont County, WY',
    description:
      'A full section of Wyoming high plains. Three-sided fencing, a seasonal spring, rolling topography with a mesa on the north boundary. Excellent hunting for pronghorn and mule deer.',
    price: 395000,
    acreage: 640,
    apn: 'WY-FRE-9912-0640',
    state: 'WY',
    county: 'Fremont',
    lat: 43.001,
    lng: -108.501,
    status: 'active',
  },
  {
    title: '10 Acres in Challis — Custer County, ID',
    description:
      'Ten acres near the Salmon River with a mix of timbered and open meadow. Power at the road, approved building envelope, no HOA.',
    price: 62000,
    acreage: 10,
    apn: 'ID-CUS-2201-0010',
    state: 'ID',
    county: 'Custer',
    lat: 44.412,
    lng: -114.301,
    status: 'sold',
  },
  {
    title: '1.25 Acres in Williston — Levy County, FL',
    description:
      'One-and-a-quarter acres of high-and-dry Florida land. County-maintained paved road frontage, cleared building site, minutes to Williston and a short drive to Gainesville.',
    price: 24900,
    acreage: 1.25,
    apn: 'FL-LEV-1105-0001',
    state: 'FL',
    county: 'Levy',
    lat: 29.312,
    lng: -82.801,
    status: 'active',
    financing: { down_payment_usd: 2490, monthly_usd: 259, term_months: 120, interest_apr: 9.9 },
  },
  {
    title: '0.5 Acres in Central Florida — Polk County, FL',
    description:
      'Half-acre buildable lot between Tampa and Orlando. Residential zoning, no HOA, manufactured homes allowed.',
    price: 12500,
    acreage: 0.5,
    apn: 'FL-POL-4487-0500',
    state: 'FL',
    county: 'Polk',
    lat: 27.901,
    lng: -81.712,
    status: 'active',
    financing: { down_payment_usd: 1250, monthly_usd: 149, term_months: 96, interest_apr: 9.9 },
  },
  {
    title: '2 Acres Near Atlanta — Cherokee County, GA',
    description:
      'Wooded two-acre parcel 45 minutes north of Atlanta. Paved county-road access, power and fiber available at the road, no HOA.',
    price: 48500,
    acreage: 2,
    apn: 'GA-CHE-7701-0002',
    state: 'GA',
    county: 'Cherokee',
    lat: 34.212,
    lng: -84.501,
    status: 'active',
  },
  {
    title: '5 Acres in the Blue Ridge — Yancey County, NC',
    description:
      'Five mountain acres with a level building site, southern exposure, and long-range views toward Mount Mitchell. Drilled well needed; power at the easement.',
    price: 72500,
    acreage: 5,
    apn: 'NC-YAN-5512-0005',
    state: 'NC',
    county: 'Yancey',
    lat: 35.901,
    lng: -82.301,
    status: 'active',
  },
  {
    title: '10 Acres — Fentress County, TN',
    description:
      'Ten acres of mature hardwoods and cleared pasture on the Cumberland Plateau. Great hunting, camping, or a homestead base.',
    price: 42000,
    acreage: 10,
    apn: 'TN-FEN-3301-0010',
    state: 'TN',
    county: 'Fentress',
    lat: 36.412,
    lng: -84.901,
    status: 'active',
  },
  {
    title: '40 Acres in the Ouachitas — Scott County, AR',
    description:
      'Forty acres of Ozark/Ouachita foothills with running stream and ATV trails. Borders National Forest on the south boundary.',
    price: 38900,
    acreage: 40,
    apn: 'AR-SCO-2201-0040',
    state: 'AR',
    county: 'Scott',
    lat: 34.912,
    lng: -94.012,
    status: 'active',
  },
  {
    title: '160 Acres Farm Ground — Ochiltree County, OK',
    description:
      'Class-II dryland wheat ground in the Oklahoma panhandle. All-weather county-road access, currently leased to a local operator — lease is transferable.',
    price: 224000,
    acreage: 160,
    apn: 'OK-OCH-0001-0160',
    state: 'OK',
    county: 'Ochiltree',
    lat: 36.512,
    lng: -100.801,
    status: 'active',
  },
  {
    title: '80 Acres Near Payson — Gila County, AZ',
    description:
      'Eighty acres of pine and juniper country near Payson. Perfect elevation for a summer retreat, great hunting, and dark-sky stargazing.',
    price: 169000,
    acreage: 80,
    apn: 'AZ-GIL-4412-0080',
    state: 'AZ',
    county: 'Gila',
    lat: 33.812,
    lng: -110.812,
    status: 'pending',
  },
  {
    title: '35 Acres Near Crater Lake — Klamath County, OR',
    description:
      'Thirty-five acres of high-desert timberland 40 minutes from Crater Lake. Dirt-road access, level building spots, established spring on the western boundary.',
    price: 95000,
    acreage: 35,
    apn: 'OR-KLA-8821-0035',
    state: 'OR',
    county: 'Klamath',
    lat: 42.501,
    lng: -121.501,
    status: 'inactive',
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL not set. Fill in .env.local first.');
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log(`Seeding ${SEED.length} parcels…`);

  // Clean slate for geo_parcels (cascades to geo_parcel_photos via FK).
  // Affects only geo_* tables — nothing else on the shared DB is touched.
  await db.delete(parcels);

  const rows = SEED.map((p) => ({
    slug: slugify(p.title),
    title: p.title,
    description: p.description,
    price: String(p.price),
    acreage: String(p.acreage),
    apn: p.apn,
    state: p.state,
    county: p.county,
    lat: p.lat,
    lng: p.lng,
    status: p.status,
    terms: p.terms ?? {},
    financing: p.financing ?? {},
    featured: p.featured ?? false,
  }));

  const inserted = await db.insert(parcels).values(rows).returning({
    id: parcels.id,
    slug: parcels.slug,
  });

  // Attach photos where provided.
  const photoRows: Array<typeof parcelPhotos.$inferInsert> = [];
  for (const p of SEED) {
    if (!p.photos || p.photos.length === 0) continue;
    const match = inserted.find((r) => r.slug === slugify(p.title));
    if (!match) continue;
    p.photos.forEach((photo, idx) => {
      photoRows.push({
        parcelId: match.id,
        url: photo.url,
        alt: photo.alt,
        sortOrder: idx,
        isPrimary: photo.isPrimary ?? idx === 0,
      });
    });
  }
  if (photoRows.length > 0) {
    await db.insert(parcelPhotos).values(photoRows);
  }

  const counts = SEED.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Inserted ${inserted.length} parcels:`);
  for (const [status, n] of Object.entries(counts)) {
    console.log(`  · ${status}: ${n}`);
  }
  console.log(`Photos inserted: ${photoRows.length}`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
