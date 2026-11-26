/**
 * Data gate. Fails (exit 1) on any violation. Run in CI on every PR.
 *  - schema validity (schema/*.schema.json)
 *  - file name == id
 *  - every cite references an existing source
 *  - parents exist, no cycles
 *  - time window inside WW2 (schema) and start <= end
 *  - approved records name a reviewer and date
 *  - coordinates are plausible [lon, lat]
 */
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, EVENTS_DIR, SOURCES_DIR, readJsonDir, allCites, type EventRecord, type SourceRecord } from './lib.ts';

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const vEvent = ajv.compile(JSON.parse(readFileSync(join(ROOT, 'schema/event.schema.json'), 'utf8')));
const vSource = ajv.compile(JSON.parse(readFileSync(join(ROOT, 'schema/source.schema.json'), 'utf8')));

const errors: string[] = [];
const err = (file: string, msg: string) => errors.push(`${file}: ${msg}`);

const sources = readJsonDir<SourceRecord>(SOURCES_DIR);
const sourceIds = new Set<string>();
for (const { file, data } of sources) {
  if (!vSource(data)) vSource.errors!.forEach((e) => err(`sources/${file}`, `${e.instancePath} ${e.message}`));
  if (data.id !== file) err(`sources/${file}`, `id "${data.id}" must equal file name`);
  sourceIds.add(data.id);
}

const events = readJsonDir<EventRecord>(EVENTS_DIR);
const byId = new Map<string, EventRecord>();
for (const { file, data } of events) {
  const f = `events/${file}`;
  if (!vEvent(data)) { vEvent.errors!.forEach((e) => err(f, `${e.instancePath} ${e.message}`)); continue; }
  if (data.id !== file) err(f, `id "${data.id}" must equal file name`);
  if (byId.has(data.id)) err(f, `duplicate id`);
  byId.set(data.id, data);

  for (const { path, cite } of allCites(data)) {
    if (!sourceIds.has(cite.source)) err(f, `${path} cites unknown source "${cite.source}" (add data/sources/${cite.source}.json)`);
  }
  if (data.time.end && data.time.end < data.time.start) err(f, `time.end before time.start`);
  if (data.review.status === 'approved' && (!data.review.by || !data.review.date)) err(f, `approved records need review.by and review.date`);
  if (data.zoom.max !== undefined && data.zoom.max < data.zoom.min) err(f, `zoom.max < zoom.min`);

  const pts: number[][] = [];
  const collect = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') pts.push(c as number[]);
    else if (Array.isArray(c)) c.forEach(collect);
  };
  collect(data.geometry.coordinates);
  data.modern?.forEach((m) => pts.push(m.coordinates));
  if (pts.length === 0) err(f, `geometry has no coordinates`);
  for (const [lon, lat] of pts) {
    if (!(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90)) err(f, `invalid coordinate [${lon}, ${lat}] (GeoJSON is [lon, lat])`);
  }
}

for (const e of byId.values()) {
  if (e.parent && !byId.has(e.parent)) err(`events/${e.id}`, `parent "${e.parent}" does not exist`);
  const seen = new Set<string>();
  for (let cur: EventRecord | undefined = e; cur?.parent; cur = byId.get(cur.parent)) {
    if (seen.has(cur.id)) { err(`events/${e.id}`, `parent cycle`); break; }
    seen.add(cur.id);
  }
}

const counts = { unreviewed: 0, 'agent-checked': 0, approved: 0 } as Record<string, number>;
byId.forEach((e) => counts[e.review.status]++);
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
console.log(`✓ ${byId.size} events, ${sourceIds.size} sources valid. Review status: ${JSON.stringify(counts)}`);
