import type { ReactNode } from 'react';

/** Lists longer than this start collapsed behind a toggle; shorter ones are always shown. */
export const COLLAPSE_OVER = 3;

interface Props {
  id: string; title: string; count: number; open: boolean; onToggle: () => void; children: ReactNode;
}

/** A section heading that hides a long list behind a disclosure button showing its length. */
export default function Collapsible({ id, title, count, open, onToggle, children }: Props) {
  if (count <= COLLAPSE_OVER) return <><h3>{title}</h3>{children}</>;
  return (
    <>
      <h3>
        <button type="button" className="disclosure" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          <span className="chevron" aria-hidden="true">▸</span>{title} ({count})
        </button>
      </h3>
      <div id={id} hidden={!open}>{children}</div>
    </>
  );
}
