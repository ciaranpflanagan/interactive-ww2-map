/**
 * Seeds coarse event records from Wikidata for everything that is (transitively) "part of"
 * the configured root events. Never overwrites an existing file: curated records win.
 *
 *   npm run data:import-wikidata            # default roots (Overlord, Neptune)
 *   npm run data:import-wikidata -- Q123    # other roots
 *
 * Imported records are review.status "unreviewed" and every field cites Wikidata with the
 * exact QID + property, so the provenance is visible in the app.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EVENTS_DIR, type EventRecord } from './lib.ts';

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ['Q8641370' /* Operation Overlord */, 'Q3390891' /* Operation Neptune */];
const UA = 'interactive-ww2-map-importer/0.1 (https://github.com/ciaranpflanagan/interactive-ww2-map)';

const query = `
SELECT ?e ?eLabel ?eDescription ?coord ?start ?startPrec ?end ?endPrec ?date ?datePrec ?article ?type ?part WHERE {
  VALUES ?root { ${ROOTS.map((q) => `wd:${q}`).join(' ')} }
  ?e wdt:P361* ?root .
  OPTIONAL { ?e wdt:P625 ?coord }
  OPTIONAL { ?e p:P580/psv:P580 [ wikibase:timeValue ?start; wikibase:timePrecision ?startPrec ] }
  OPTIONAL { ?e p:P582/psv:P582 [ wikibase:timeValue ?end; wikibase:timePrecision ?endPrec ] }
  OPTIONAL { ?e p:P585/psv:P585 [ wikibase:timeValue ?date; wikibase:timePrecision ?datePrec ] }
  OPTIONAL { ?article schema:about ?e; schema:isPartOf <https://en.wikipedia.org/> }
  OPTIONAL { ?e wdt:P31 ?type }
  OPTIONAL { ?e wdt:P361 ?part }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

type Row = Record<string, { value: string } | undefined>;
const res = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(query), {
  headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
});
if (!res.ok) throw new Error(`Wikidata ${res.status}: ${await res.text()}`);
const rows: Row[] = (await res.json()).results.bindings;

const qid = (r: Row) => r.e!.value.split('/').pop()!;
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const PREC: Record<string, string> = { '11': 'day', '10': 'month' }; // coarser than month is not useful on a timeline
const day = (t: string) => t.replace(/^\+/, '').slice(0, 10);

const KIND: [string, EventRecord['kind']][] = [
  ['Q178561', 'battle'], ['Q645883', 'operation'], ['Q831663', 'operation'], ['Q1261499', 'naval'],
  ['Q2001676', 'landing'], ['Q3199915', 'atrocity'], ['Q40080', 'landing' /* beach: the D-Day beaches are typed as beaches */],
];
const ZOOM: Record<string, number> = { campaign: 4, operation: 5, naval: 5, battle: 7, landing: 8, airborne: 8, action: 10, atrocity: 10, other: 8 };

// One row per entity (dedupe multiple coordinate/date statements: keep the first).
const byQ = new Map<string, Row>();
const typesOf = new Map<string, Set<string>>();
const partsOf = new Map<string, Set<string>>();
const ent = (v?: { value: string }) => v?.value.split('/').pop();
for (const r of rows) {
  const q = qid(r);
  if (!byQ.has(q)) { byQ.set(q, r); typesOf.set(q, new Set()); partsOf.set(q, new Set()); }
  if (r.type) typesOf.get(q)!.add(ent(r.type)!);
  if (r.part) partsOf.get(q)!.add(ent(r.part)!);
}
const slugOf = new Map([...byQ].map(([q, r]) => [q, slug(r.eLabel!.value)]));

const eligible = (q: string) => {
  const r = byQ.get(q)!; const id = slugOf.get(q)!;
  const p = (r.startPrec ?? r.datePrec)?.value;
  return !!id && !/^q[0-9]+$/.test(id) && !!r.coord && !!(r.start ?? r.date) && !!p && !!PREC[p];
};
/** Nearest ancestor (breadth-first up the P361 graph) that will also exist as a record. */
const parentOf = (q: string): string | undefined => {
  const seen = new Set([q]); let frontier = [...partsOf.get(q)!];
  while (frontier.length) {
    const next: string[] = [];
    for (const p of frontier) {
      if (seen.has(p) || !byQ.has(p)) continue;
      seen.add(p);
      if (eligible(p)) return p;
      next.push(...partsOf.get(p)!);
    }
    frontier = next;
  }
};

let written = 0, skipped = 0;
const reasons: Record<string, number> = {};
const skip = (why: string) => { skipped++; reasons[why] = (reasons[why] ?? 0) + 1; };

for (const [q, r] of byQ) {
  const id = slugOf.get(q)!;
  if (!id || /^q[0-9]+$/.test(id)) { skip('no English label'); continue; }
  if (!r.coord) { skip('no coordinates'); continue; }
  const startT = r.start ?? r.date; const startP = r.startPrec ?? r.datePrec;
  if (!startT || !PREC[startP!.value]) { skip('no day/month-precision date'); continue; }
  const file = join(EVENTS_DIR, `${id}.json`);
  if (existsSync(file)) { skip('already exists (curated record kept)'); continue; }

  const [lon, lat] = r.coord.value.replace(/^Point\(|\)$/g, '').split(' ').map(Number);
  const types = [...typesOf.get(q)!];
  const kind = KIND.find(([t]) => types.includes(t))?.[1] ?? 'other';
  const parentQ = parentOf(q);
  const startProp = r.start ? 'P580' : 'P585';
  const end = r.end && PREC[r.endPrec!.value] ? day(r.end.value) : undefined;

  const rec: EventRecord = {
    id, name: r.eLabel!.value, kind,
    ...(parentQ ? { parent: slugOf.get(parentQ)! } : {}),
    wikidata: q,
    ...(r.article ? { wikipedia: r.article.value } : {}),
    zoom: { min: ZOOM[kind] },
    review: { status: 'unreviewed', notes: 'Imported from Wikidata. Single representative coordinate; dates and placement not yet verified against a primary or official source.' },
    time: {
      start: day(startT.value), ...(end && end >= day(startT.value) ? { end } : {}),
      precision: PREC[startP!.value],
      cite: [{ source: 'wikidata', locator: `${q} ${startProp}${end ? ' / P582' : ''}` }],
    },
    geometry: { type: 'Point', coordinates: [lon, lat], accuracy: 'representative', cite: [{ source: 'wikidata', locator: `${q} P625` }] },
    summary: { text: r.eDescription?.value ? r.eDescription.value[0].toUpperCase() + r.eDescription.value.slice(1) + '.' : r.eLabel!.value + '.', cite: [{ source: 'wikidata', locator: `${q} description` }] },
  };
  writeFileSync(file, JSON.stringify(rec, null, 2) + '\n');
  written++;
}
console.log(`wrote ${written}, skipped ${skipped}`, reasons);
