import { useEffect, useMemo, useState } from 'react';
import type { WW2Event } from '../types';
import { DAY, fmtDay, span } from '../time';

interface Props { events: WW2Event[]; range: [number, number]; day: number; onChange: (d: number) => void }

export default function Timeline({ events, range, day, onChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [lo, hi] = range;
  const days = Math.round((hi - lo) / DAY);

  // Histogram: how many events are active on each day.
  const counts = useMemo(() => {
    const c = new Array(days + 1).fill(0);
    for (const e of events) {
      const [s, en] = span(e);
      for (let d = Math.max(s, lo); d <= Math.min(en, hi); d += DAY) c[Math.round((d - lo) / DAY)]++;
    }
    return c;
  }, [events, lo, hi, days]);
  const max = Math.max(1, ...counts);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => onChange(Math.min(hi, day + DAY)), 400);
    if (day >= hi) setPlaying(false);
    return () => clearInterval(t);
  }, [playing, day, hi, onChange]);

  return (
    <footer className="timeline">
      <button className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
      <div className="track">
        <div className="histogram" aria-hidden>
          {counts.map((n, i) => <span key={i} style={{ height: `${(n / max) * 100}%` }} />)}
        </div>
        <input
          type="range" min={0} max={days} step={1} value={Math.round((day - lo) / DAY)}
          onChange={(e) => onChange(lo + Number(e.target.value) * DAY)}
          aria-label="Date" aria-valuetext={fmtDay(day)}
        />
      </div>
      <output className="date" data-testid="current-date">{fmtDay(day)}</output>
    </footer>
  );
}
