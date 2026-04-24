'use client';

import mapboxgl, {
  type GeoJSONSource,
  type LngLatLike,
  type MapLayerMouseEvent,
} from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { MapFeatureCollection, MapFeatureProperties } from '@/lib/parcels';
import { ParcelMapPanel } from '@/components/parcel-map-panel';

type FilterId = 'active' | 'pending' | 'sold' | 'all';

const FILTER_OPTIONS: Array<{ id: FilterId; label: string }> = [
  { id: 'active', label: 'Available' },
  { id: 'pending', label: 'Pending' },
  { id: 'sold', label: 'Sold' },
  { id: 'all', label: 'All' },
];

const US_CENTER: LngLatLike = [-98.5, 39.5];
const DEFAULT_ZOOM = 3.4;

const STATUS_COLORS = {
  active: '#059669',
  pending: '#d97706',
  sold: '#e11d48',
} as const;

export function ParcelMap({
  token,
  initialFeatures,
  initialFocusId,
}: {
  token: string;
  initialFeatures: MapFeatureCollection;
  initialFocusId?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapReadyRef = useRef(false);

  const [filter, setFilter] = useState<FilterId>(
    initialFocusId ? 'all' : 'active',
  );
  const [selected, setSelected] = useState<MapFeatureProperties | null>(null);

  const filteredFeatures = useMemo<MapFeatureCollection>(() => {
    if (filter === 'all') return initialFeatures;
    return {
      type: 'FeatureCollection',
      features: initialFeatures.features.filter(
        (f) => f.properties.status === filter,
      ),
    };
  }, [filter, initialFeatures]);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = token;

    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: prefersDark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: US_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right',
    );
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.on('load', () => {
      map.addSource('parcels', {
        type: 'geojson',
        data: filteredFeatures,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'parcels',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': STATUS_COLORS.active,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 28],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'parcels',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13,
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'parcels',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'active', STATUS_COLORS.active,
            'pending', STATUS_COLORS.pending,
            'sold', STATUS_COLORS.sold,
            '#6b7280',
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.on('click', 'clusters', (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id as number | undefined;
        if (clusterId === undefined) return;
        const source = map.getSource('parcels') as GeoJSONSource | undefined;
        source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          if (feature.geometry.type !== 'Point') return;
          map.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom: zoom ?? 10,
          });
        });
      });

      map.on('click', 'unclustered-point', (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        const props = feature.properties as unknown as MapFeatureProperties;
        setSelected(props);
        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: Math.max(map.getZoom(), 8),
        });
      });

      const setPointerCursor = () => {
        map.getCanvas().style.cursor = 'pointer';
      };
      const clearCursor = () => {
        map.getCanvas().style.cursor = '';
      };
      map.on('mouseenter', 'clusters', setPointerCursor);
      map.on('mouseleave', 'clusters', clearCursor);
      map.on('mouseenter', 'unclustered-point', setPointerCursor);
      map.on('mouseleave', 'unclustered-point', clearCursor);

      mapReadyRef.current = true;

      if (initialFocusId) {
        const focused = initialFeatures.features.find(
          (f) => f.properties.id === initialFocusId,
        );
        if (focused) {
          setSelected(focused.properties);
          map.flyTo({
            center: focused.geometry.coordinates as [number, number],
            zoom: 11,
            essential: true,
          });
        }
      }
    });

    return () => {
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Keep the GeoJSON source in sync with the current filter.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const source = map.getSource('parcels') as GeoJSONSource | undefined;
    source?.setData(filteredFeatures);
  }, [filteredFeatures]);

  const count = filteredFeatures.features.length;

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-0 bg-white dark:bg-neutral-950">
      <div className="absolute inset-x-0 top-0 z-10 h-12">
        <FilterBar value={filter} onChange={setFilter} total={count} />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-12">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {count === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-12 flex items-center justify-center">
          <div className="rounded-2xl bg-white/90 px-5 py-3 text-sm text-neutral-700 shadow-lg dark:bg-neutral-900/90 dark:text-neutral-200">
            No listings match this filter.
          </div>
        </div>
      )}

      {selected && (
        <ParcelMapPanel data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function FilterBar({
  value,
  onChange,
  total,
}: {
  value: FilterId;
  onChange: (id: FilterId) => void;
  total: number;
}) {
  return (
    <div className="z-10 flex items-center gap-2 overflow-x-auto border-b border-black/5 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-neutral-950/90">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition',
            value === opt.id
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
          )}
        >
          {opt.label}
        </button>
      ))}
      <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
        {total} {total === 1 ? 'parcel' : 'parcels'}
      </span>
    </div>
  );
}
