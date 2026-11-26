import { useEffect, useMemo, useState } from 'react';
import type { Source, WW2Event } from './types';
import { DAY, span, toDay } from './time';
import MapView from './components/MapView';
import Timeline from './components/Timeline';
import EventPanel from './components/EventPanel';
import AboutDialog from './components/AboutDialog';

export default function App() {
  const [events, setEvents] = useState<WW2Event[] | null>(null);
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState(toDay('1944-06-06'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetch('data/events.json').then((r) => r.json()), fetch('data/sources.json').then((r) => r.json())])
      .then(([e, s]) => { setEvents(e); setSources(s); })
      .catch((e) => setError(String(e)));
  }, []);

  // Test/automation hook: lets e2e tests open an event without clicking a canvas pixel.
  useEffect(() => { (window as unknown as { __selectEvent: typeof setSelectedId }).__selectEvent = setSelectedId; }, []);

  const range = useMemo<[number, number]>(() => {
    if (!events?.length) return [toDay('1944-06-01'), toDay('1944-09-30')];
    const spans = events.map(span);
    return [Math.min(...spans.map((s) => s[0])) - DAY, Math.max(...spans.map((s) => s[1])) + DAY];
  }, [events]);

  const selected = events?.find((e) => e.id === selectedId) ?? null;
  const byId = useMemo(() => new Map(events?.map((e) => [e.id, e]) ?? []), [events]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Interactive WW2 Map <span className="scope">Normandy, 1944</span></h1>
        <button className="link" onClick={() => setAboutOpen(true)}>Sources &amp; method</button>
      </header>
      {error && <div className="error" role="alert">Could not load data: {error}</div>}
      <main className="stage">
        <MapView events={events ?? []} day={day} selectedId={selectedId} onSelect={setSelectedId} />
        {selected && (
          <EventPanel event={selected} sources={sources} byId={byId} onSelect={setSelectedId} onClose={() => setSelectedId(null)} />
        )}
      </main>
      <Timeline events={events ?? []} range={range} day={day} onChange={setDay} />
      {aboutOpen && <AboutDialog sources={sources} events={events ?? []} onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
