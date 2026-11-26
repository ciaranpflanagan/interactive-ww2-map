import type { WW2Event } from './types';

export const DAY = 86_400_000;
export const toDay = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const fmtDay = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Inclusive day range of an event. Month-precision dates cover the whole month. */
export function span(e: WW2Event): [number, number] {
  const start = toDay(e.time.start);
  let end = e.time.end ? toDay(e.time.end) : start;
  if (e.time.precision === 'month' && !e.time.end) {
    const d = new Date(start);
    end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
  }
  return [start, end];
}

export type Phase = 'active' | 'past' | 'future';
export function phase(e: WW2Event, day: number): Phase {
  const [s, en] = span(e);
  return day < s ? 'future' : day > en ? 'past' : 'active';
}

export function fmtRange(e: WW2Event) {
  const [s, en] = span(e);
  if (e.time.precision === 'month' && !e.time.end)
    return new Date(s).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return s === en ? fmtDay(s) : `${fmtDay(s)} – ${fmtDay(en)}`;
}
