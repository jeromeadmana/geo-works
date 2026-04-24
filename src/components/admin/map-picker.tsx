'use client';

import mapboxgl, { type LngLatLike } from 'mapbox-gl';
import { useEffect, useRef } from 'react';

const US_CENTER: LngLatLike = [-98.5, 39.5];

export function MapPicker({
  token,
  lat,
  lng,
  onChange,
}: {
  token: string;
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep the latest onChange handler accessible from long-lived Mapbox
  // event listeners without re-initializing the map on every render.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // One-time init.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    mapboxgl.accessToken = token;

    const initialCoords: [number, number] | null =
      lat != null && lng != null ? [lng, lat] : null;

    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCoords ?? US_CENTER,
      zoom: initialCoords ? 11 : 3.4,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const placeOrMove = (nextLat: number, nextLng: number) => {
      if (!markerRef.current) {
        const marker = new mapboxgl.Marker({ color: '#059669', draggable: true })
          .setLngLat([nextLng, nextLat])
          .addTo(map);
        marker.on('dragend', () => {
          const { lng: ln, lat: la } = marker.getLngLat();
          onChangeRef.current(la, ln);
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([nextLng, nextLat]);
      }
    };

    map.on('click', (e) => {
      const { lng: newLng, lat: newLat } = e.lngLat;
      placeOrMove(newLat, newLng);
      onChangeRef.current(newLat, newLng);
    });

    if (initialCoords) placeOrMove(lat as number, lng as number);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Reflect external lat/lng edits (e.g. typed into the form fields) into
  // the existing marker, without re-initializing the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;
    if (!markerRef.current) {
      const marker = new mapboxgl.Marker({ color: '#059669', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.on('dragend', () => {
        const { lng: ln, lat: la } = marker.getLngLat();
        onChangeRef.current(la, ln);
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }
  }, [lat, lng]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10">
      <div ref={containerRef} className="absolute inset-0" />
      <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs text-neutral-600 shadow-sm dark:bg-neutral-900/90 dark:text-neutral-300">
        Click or drag marker to set the location.
      </p>
    </div>
  );
}
