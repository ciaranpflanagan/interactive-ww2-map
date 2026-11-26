import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MLMap, MapLayerMouseEvent } from 'maplibre-gl';
// MapLibre v6 loads its worker as a separate ES module. Vite must emit it as an asset.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

maplibregl.setWorkerUrl(workerUrl);
import type { WW2Event } from '../types';
import { phase } from '../time';

// OpenFreeMap: free, no API key. Attribution is provided by the style itself.
const STYLE = import.meta.env.VITE_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';
const NORMANDY: [number, number] = [-0.7, 49.2];

interface Props { events: WW2Event[]; day: number; selectedId: string | null; onSelect: (id: string | null) => void }

function toFeatures(events: WW2Event[], day: number, zoom: number, selectedId: string | null): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events.flatMap((e) => {
      const p = phase(e, day);
      const visibleAtZoom = zoom >= e.zoom.min - 0.5 && (e.zoom.max === undefined || zoom <= e.zoom.max);
      // Future events are hidden; past events stay as faint context. The selected event is always shown.
      if (e.id !== selectedId && (p === 'future' || !visibleAtZoom)) return [];
      return [{
        type: 'Feature' as const,
        id: e.id,
        geometry: e.geometry as GeoJSON.Geometry,
        properties: { id: e.id, name: e.name, phase: p, review: e.review.status, selected: e.id === selectedId },
      }];
    }),
  };
}

export default function MapView({ events, day, selectedId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(7);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const m = new maplibregl.Map({ container: container.current!, style: STYLE, center: NORMANDY, zoom: 7, attributionControl: { compact: true } });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.addControl(new maplibregl.ScaleControl({}), 'bottom-left');
    m.on('zoomend', () => setZoom(m.getZoom()));
    m.on('load', () => {
      m.addSource('events', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({
        id: 'events-area', type: 'fill', source: 'events', filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': '#b3261e', 'fill-opacity': ['case', ['==', ['get', 'phase'], 'active'], 0.25, 0.08] },
      });
      m.addLayer({
        id: 'events-line', type: 'line', source: 'events', filter: ['!=', ['geometry-type'], 'Point'],
        paint: { 'line-color': '#b3261e', 'line-width': 2, 'line-opacity': ['case', ['==', ['get', 'phase'], 'active'], 0.9, 0.3] },
      });
      m.addLayer({
        id: 'events-point', type: 'circle', source: 'events', filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': ['case', ['get', 'selected'], 10, ['==', ['get', 'phase'], 'active'], 8, 5],
          'circle-color': ['case', ['==', ['get', 'phase'], 'active'], '#b3261e', '#7a7a7a'],
          'circle-opacity': ['case', ['==', ['get', 'phase'], 'active'], 0.95, 0.55],
          'circle-stroke-width': ['case', ['get', 'selected'], 3, 1.5],
          'circle-stroke-color': ['case', ['get', 'selected'], '#111', '#fff'],
        },
      });
      m.addLayer({
        id: 'events-label', type: 'symbol', source: 'events', filter: ['==', ['get', 'phase'], 'active'],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-optional': true },
        paint: { 'text-color': '#2b0b09', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
      });
      for (const layer of ['events-point', 'events-area', 'events-line']) {
        m.on('click', layer, (ev: MapLayerMouseEvent) => onSelectRef.current(String(ev.features?.[0]?.properties?.id)));
        m.on('mouseenter', layer, () => (m.getCanvas().style.cursor = 'pointer'));
        m.on('mouseleave', layer, () => (m.getCanvas().style.cursor = ''));
      }
      setReady(true);
      (window as unknown as { __mapReady: boolean }).__mapReady = true; // e2e hook
    });
    return () => m.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    (map.current!.getSource('events') as GeoJSONSource).setData(toFeatures(events, day, zoom, selectedId));
  }, [ready, events, day, zoom, selectedId]);

  // Fly to a newly selected event.
  useEffect(() => {
    const e = events.find((x) => x.id === selectedId);
    if (!e || !map.current) return;
    const first = (function find(c: unknown): [number, number] | null {
      if (Array.isArray(c) && typeof c[0] === 'number') return c as [number, number];
      return Array.isArray(c) ? find(c[0]) : null;
    })(e.geometry.coordinates);
    if (first) map.current.easeTo({ center: first, zoom: Math.max(map.current.getZoom(), e.zoom.min), duration: 600 });
  }, [selectedId, events]);

  return <div ref={container} className="map" data-testid="map" aria-label="Map of events" />;
}
