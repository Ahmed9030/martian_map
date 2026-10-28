'use client';

import { useEffect, useRef } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from 'maplibre-gl';

export default function Map() {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    setWorkerUrl('/maplibre-gl-worker.mjs');

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [31.2357, 30.0444],
      zoom: 5,
    });

    map.addControl(new NavigationControl(), 'top-right');
    new Marker({ color: '#e11d48' })
      .setLngLat([31.2357, 30.0444])
      .setPopup(new Popup().setText('Cairo, Egypt'))
      .addTo(map);

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainerRef}
      aria-label="Interactive map centered on Cairo, Egypt"
      className="h-[500px] w-full"
    />
  );
}

