import { ImageResponse } from 'next/og';

export const alt = 'GeoWorks — U.S. land for sale';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background:
            'linear-gradient(135deg, #ecfdf5 0%, #ffffff 55%, #d1fae5 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #10b981 0%, #0f766e 100%)',
            }}
          />
          <span
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: '#0a0a0a',
              letterSpacing: '-0.02em',
            }}
          >
            GeoWorks
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 600,
              color: '#0a0a0a',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            Land, on a map. Not lost in a spreadsheet.
          </span>
          <span
            style={{
              fontSize: 28,
              color: '#525252',
              lineHeight: 1.3,
            }}
          >
            Browse vetted parcels across the lower 48. Owner financing and
            clear terms, straight from the listing page.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            fontSize: 22,
            color: '#047857',
            fontWeight: 500,
          }}
        >
          <span
            style={{
              display: 'flex',
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#10b981',
            }}
          />
          <span>U.S. land · owner financing</span>
        </div>
      </div>
    ),
    size,
  );
}
