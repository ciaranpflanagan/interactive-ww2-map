/**
 * Turn a Wikipedia cite locator into a link to the exact revision and section that was cited.
 *
 * Locators look like `Article § Section › Subsection (revision 123)`; the revision marker may also be
 * written `(oldid 123)` or `(rev. 123)`, sections may be separated by `§` or `›`, and free-text notes
 * may follow after `;` or `,` (e.g. `; article cites Zaloga (2005)`).
 */
export interface WikipediaLocator { article: string; section?: string; revision?: string }

const REVISION = /\((?:revision|oldid|rev\.)\s*(\d+)\)/;

export function parseWikipediaLocator(locator: string): WikipediaLocator | undefined {
  const revision = locator.match(REVISION)?.[1];
  // Everything after the revision marker is a note, as is anything after ';'.
  const main = locator.split(REVISION)[0].split(';')[0].trim();
  const sectionStart = main.indexOf(' § ');
  const article = (sectionStart >= 0 ? main.slice(0, sectionStart) : main.split(/,| \(/)[0]).trim();
  if (!article) return undefined;
  let section: string | undefined;
  if (sectionStart >= 0) {
    // First section path only: "A › B and § C" or "A, § B" lists several; link the first.
    // Split only where another '§' follows, so names like "Terrain and defenses" stay whole.
    const path = main.slice(sectionStart + 3).split(/,? and § |, § /)[0];
    const parts = path.split(/\s*[§›]\s*/).map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last.toLowerCase() !== 'lead') section = last;
  }
  return { article, ...(section ? { section } : {}), ...(revision ? { revision } : {}) };
}

const underscore = (s: string) => encodeURIComponent(s.replace(/ /g, '_'));

export function wikipediaUrl(locator: string): string | undefined {
  const p = parseWikipediaLocator(locator);
  if (!p) return undefined;
  const title = underscore(p.article);
  const base = p.revision
    ? `https://en.wikipedia.org/w/index.php?title=${title}&oldid=${p.revision}`
    : `https://en.wikipedia.org/wiki/${title}`;
  return p.section ? `${base}#${underscore(p.section)}` : base;
}
