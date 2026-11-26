/** Compiles data/ into public/data/*.json consumed by the app. Output is gitignored. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, EVENTS_DIR, SOURCES_DIR, readJsonDir, type EventRecord, type SourceRecord } from './lib.ts';

const out = join(ROOT, 'public/data');
mkdirSync(out, { recursive: true });
const events = readJsonDir<EventRecord>(EVENTS_DIR).map((x) => x.data)
  .sort((a, b) => a.time.start.localeCompare(b.time.start) || a.id.localeCompare(b.id));
const sources = Object.fromEntries(readJsonDir<SourceRecord>(SOURCES_DIR).map((x) => [x.data.id, x.data]));
writeFileSync(join(out, 'events.json'), JSON.stringify(events));
writeFileSync(join(out, 'sources.json'), JSON.stringify(sources));
console.log(`built ${events.length} events, ${Object.keys(sources).length} sources -> public/data/`);
