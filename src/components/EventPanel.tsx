import type { Cite, Source, WW2Event } from '../types';
import { fmtRange } from '../time';
import { CitationList, CiteMarks } from './Citations';

const REPO = 'https://github.com/ciaranpflanagan/interactive-ww2-map';
const REVIEW_LABEL = {
  unreviewed: 'Unreviewed: imported or drafted, not yet checked',
  'agent-checked': 'Citations checked by an automated agent; awaiting human review',
  approved: 'Reviewed and approved by the maintainer',
} as const;

interface Props {
  event: WW2Event; sources: Record<string, Source>; byId: Map<string, WW2Event>;
  onSelect: (id: string) => void; onClose: () => void;
}

export default function EventPanel({ event: e, sources, byId, onSelect, onClose }: Props) {
  // Number citations in order of first appearance.
  const list: Cite[] = [];
  const key = (c: Cite) => `${c.source}|${c.locator ?? ''}|${c.quote ?? ''}`;
  const index = (c: Cite) => {
    let i = list.findIndex((x) => key(x) === key(c));
    if (i < 0) { list.push(c); i = list.length - 1; }
    return i + 1;
  };
  const parent = e.parent ? byId.get(e.parent) : undefined;
  const children = [...byId.values()].filter((x) => x.parent === e.id);
  const issueUrl = `${REPO}/issues/new?template=correction.yml&title=${encodeURIComponent(`Correction: ${e.name}`)}&event=${encodeURIComponent(e.id)}`;

  return (
    <aside className="panel" aria-label={e.name} data-testid="event-panel">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      {parent && <button className="breadcrumb link" onClick={() => onSelect(parent.id)}>↑ {parent.name}</button>}
      <h2>{e.name}</h2>
      <p className="when">{fmtRange(e)}<CiteMarks cites={e.time.cite} index={index} /></p>
      <p className={`review review-${e.review.status}`}>{REVIEW_LABEL[e.review.status]}</p>

      <p>{e.summary.text}<CiteMarks cites={e.summary.cite} index={index} /></p>

      {!!e.facts?.length && (
        <table className="facts">
          <tbody>
            {e.facts.map((f, i) => (
              <tr key={i}>
                <th scope="row">{f.label}</th>
                <td>{f.value}{f.disputed && <span className="disputed" title="Sources disagree"> disputed</span>}<CiteMarks cites={f.cite} index={index} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!!e.participants?.length && (
        <>
          <h3>Forces</h3>
          <ul className="participants">
            {e.participants.map((p, i) => <li key={i} className={`side-${p.side}`}>{p.name}{p.role && ` (${p.role})`}<CiteMarks cites={p.cite} index={index} /></li>)}
          </ul>
        </>
      )}

      {!!e.modern?.length && (
        <>
          <h3>There today</h3>
          <ul className="modern">
            {e.modern.map((m, i) => (
              <li key={i}>
                {m.url ? <a href={m.url} target="_blank" rel="noreferrer">{m.name}</a> : m.name} <span className="muted">({m.kind})</span>
                <CiteMarks cites={m.cite} index={index} />
              </li>
            ))}
          </ul>
        </>
      )}

      {!!children.length && (
        <>
          <h3>Part of this</h3>
          <ul className="children">
            {children.map((c) => <li key={c.id}><button className="link" onClick={() => onSelect(c.id)}>{c.name}</button></li>)}
          </ul>
        </>
      )}

      <p className="muted small">
        Location: {e.geometry.accuracy === 'representative' ? 'a single representative point for the whole event' : e.geometry.accuracy}
        <CiteMarks cites={e.geometry.cite} index={index} />
      </p>

      <h3>Sources</h3>
      <CitationList cites={list} sources={sources} />
      <p className="small">
        {e.wikipedia && <><a href={e.wikipedia} target="_blank" rel="noreferrer">Wikipedia</a> · </>}
        {e.wikidata && <><a href={`https://www.wikidata.org/wiki/${e.wikidata}`} target="_blank" rel="noreferrer">Wikidata</a> · </>}
        <a href={`${REPO}/blob/main/data/events/${e.id}.json`} target="_blank" rel="noreferrer">Raw record</a> ·{' '}
        <a href={issueUrl} target="_blank" rel="noreferrer">Report a correction</a>
      </p>
    </aside>
  );
}
