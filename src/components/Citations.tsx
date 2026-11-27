import type { Cite, Source } from '../types';

/** Inline superscript markers. The full list renders at the bottom of the panel. */
export function CiteMarks({ cites, index, onJump }: { cites: Cite[]; index: (c: Cite) => number; onJump?: (n: number) => void }) {
  return (
    <sup className="cites">
      {cites.map((c, i) => {
        const n = index(c);
        return (
          <a key={i} href={`#cite-${n}`} title={c.locator ?? c.source}
            onClick={onJump && ((ev) => {
              // Leave modified and non-primary clicks to the browser (new tab, new window).
              if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
              ev.preventDefault(); onJump(n);
            })}>[{n}]</a>
        );
      })}
    </sup>
  );
}

export function sourceUrl(c: Cite, s?: Source): string | undefined {
  if (c.source === 'wikidata' && c.locator) {
    const [q, p] = c.locator.split(' ');
    return `https://www.wikidata.org/wiki/${q}${p?.startsWith('P') ? `#${p}` : ''}`;
  }
  if (c.source === 'osm' && c.locator) return `https://www.openstreetmap.org/${c.locator}`;
  return s?.url;
}

export function CitationList({ cites, sources }: { cites: Cite[]; sources: Record<string, Source> }) {
  return (
    <ol className="citation-list">
      {cites.map((c, i) => {
        const s = sources[c.source];
        const url = sourceUrl(c, s);
        return (
          <li key={i} id={`cite-${i + 1}`} tabIndex={-1}>
            {url ? <a href={url} target="_blank" rel="noreferrer">{s?.title ?? c.source}</a> : s?.title ?? c.source}
            {s?.author && <>, {s.author}</>}
            {s?.year && <> ({s.year})</>}
            {c.locator && <>. <span className="locator">{c.locator}</span></>}
            {c.quote && <blockquote>“{c.quote}”</blockquote>}
            <span className={`src-type src-${s?.type}`}>{s?.type}</span>
          </li>
        );
      })}
    </ol>
  );
}
