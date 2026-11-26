import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

export const ROOT = new URL('..', import.meta.url).pathname;
export const EVENTS_DIR = join(ROOT, 'data/events');
export const SOURCES_DIR = join(ROOT, 'data/sources');

export interface Cite { source: string; locator?: string; quote?: string }
export interface EventRecord {
  id: string; name: string; kind: string; parent?: string; wikidata?: string; wikipedia?: string;
  zoom: { min: number; max?: number };
  review: { status: 'unreviewed' | 'agent-checked' | 'approved'; by?: string; date?: string; notes?: string };
  time: { start: string; end?: string; precision: string; cite: Cite[] };
  geometry: { type: string; coordinates: unknown; accuracy: string; cite: Cite[] };
  summary: { text: string; cite: Cite[] };
  facts?: { label: string; value: string; low?: number; high?: number; side?: string; disputed?: boolean; cite: Cite[] }[];
  participants?: { name: string; side: string; role?: string; cite: Cite[] }[];
  modern?: { name: string; kind: string; coordinates: [number, number]; osm?: string; url?: string; cite: Cite[] }[];
}
export interface SourceRecord { id: string; title: string; type: string; license: string; url?: string; author?: string; publisher?: string; year?: number; accessed?: string; notes?: string }

export function readJsonDir<T>(dir: string): { file: string; data: T }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: basename(f, '.json'), data: JSON.parse(readFileSync(join(dir, f), 'utf8')) as T }));
}

/** Walk every `cite` array anywhere in a record. */
export function allCites(obj: unknown, path = ''): { path: string; cite: Cite }[] {
  const out: { path: string; cite: Cite }[] = [];
  if (Array.isArray(obj)) obj.forEach((v, i) => out.push(...allCites(v, `${path}[${i}]`)));
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'cite' && Array.isArray(v)) v.forEach((c, i) => out.push({ path: `${path}.cite[${i}]`, cite: c as Cite }));
      else out.push(...allCites(v, `${path}.${k}`));
    }
  }
  return out;
}
