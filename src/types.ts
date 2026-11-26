// Mirrors schema/event.schema.json. The schema is the source of truth.
export interface Cite { source: string; locator?: string; quote?: string }
export type ReviewStatus = 'unreviewed' | 'agent-checked' | 'approved';
export interface WW2Event {
  id: string; name: string; kind: string; parent?: string; wikidata?: string; wikipedia?: string;
  zoom: { min: number; max?: number };
  review: { status: ReviewStatus; by?: string; date?: string; notes?: string };
  time: { start: string; end?: string; precision: string; cite: Cite[] };
  geometry: { type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon'; coordinates: unknown; accuracy: string; cite: Cite[] };
  summary: { text: string; cite: Cite[] };
  facts?: { label: string; value: string; side?: string; disputed?: boolean; cite: Cite[] }[];
  participants?: { name: string; side: string; role?: string; cite: Cite[] }[];
  modern?: { name: string; kind: string; coordinates: [number, number]; osm?: string; url?: string; cite: Cite[] }[];
}
export interface Source { id: string; title: string; type: string; license: string; url?: string; author?: string; publisher?: string; year?: number; notes?: string }
