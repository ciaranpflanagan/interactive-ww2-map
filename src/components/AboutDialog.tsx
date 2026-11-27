import { useEffect, useRef, useState } from 'react';
import Collapsible from './Collapsible';
import type { Source, WW2Event } from '../types';

export default function AboutDialog({ sources, events, onClose }: { sources: Record<string, Source>; events: WW2Event[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const [registerOpen, setRegisterOpen] = useState(false);
  const register = Object.values(sources).sort((a, b) => a.title.localeCompare(b.title));
  const counts = events.reduce<Record<string, number>>((a, e) => ((a[e.review.status] = (a[e.review.status] ?? 0) + 1), a), {});
  return (
    <dialog ref={ref} className="about" onClose={onClose} aria-label="Sources and method">
      <button className="close" onClick={() => ref.current?.close()} aria-label="Close">×</button>
      <h2>Sources &amp; method</h2>
      <p>
        Every date, place, figure and description on this map carries a citation. Records start life <em>unreviewed</em>
        (imported from Wikidata or drafted by a research agent), are <em>agent-checked</em> when an independent agent has
        confirmed each citation supports its claim, and become <em>approved</em> only after the maintainer reviews them.
        Where reputable sources disagree, figures are shown as ranges and marked disputed.
      </p>
      <p>
        Current status: {counts.approved ?? 0} approved, {counts['agent-checked'] ?? 0} agent-checked, {counts.unreviewed ?? 0} unreviewed.
        All data is open: <a href="https://github.com/ciaranpflanagan/interactive-ww2-map/tree/main/data" target="_blank" rel="noreferrer">browse it on GitHub</a>.
      </p>
      <Collapsible id="source-register" title="Source register" count={register.length} open={registerOpen}
        onToggle={() => setRegisterOpen(!registerOpen)}>
        <ul className="sources">
          {register.map((s) => (
            <li key={s.id}>
              {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
              {s.author && <>, {s.author}</>}{s.year && <> ({s.year})</>}
              <span className="muted">. {s.type}; {s.license}</span>
            </li>
          ))}
        </ul>
      </Collapsible>
      <h3>Map</h3>
      <p className="small">Basemap by OpenFreeMap. Map data © OpenMapTiles, © OpenStreetMap contributors. The basemap shows present-day geography.</p>
    </dialog>
  );
}
