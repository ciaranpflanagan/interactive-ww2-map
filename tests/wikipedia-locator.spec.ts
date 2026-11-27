import { readdirSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { parseWikipediaLocator, wikipediaUrl } from '../src/wikipedia';

// Pure-function tests; no browser needed, so run them once.
test.describe('Wikipedia locator parser', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'pure logic, runs once'));

  const cases: [string, ReturnType<typeof parseWikipediaLocator>][] = [
    ['Normandy landings § Operations (revision 1386946425)',
      { article: 'Normandy landings', section: 'Operations', revision: '1386946425' }],
    ['Omaha Beach § lead (revision 1388011462)',
      { article: 'Omaha Beach', revision: '1388011462' }],
    ['Normandy American Cemetery and Memorial § Burials § Number of burials (oldid 1361186778)',
      { article: 'Normandy American Cemetery and Memorial', section: 'Number of burials', revision: '1361186778' }],
    ['Pointe du Hoc § Battle › Attack (rev. 1381099170); article cites armyhistory.org, 17 Oct 2016',
      { article: 'Pointe du Hoc', section: 'Attack', revision: '1381099170' }],
    ['Pointe du Hoc § Battle › Attack (rev. 1381099170), quoting Small Unit Actions',
      { article: 'Pointe du Hoc', section: 'Attack', revision: '1381099170' }],
    ['Pointe du Hoc § Aftermath (rev. 1381099170); article cites Bahmanyar (2006) pp. 48–49 and Piehler (2010) p. 161',
      { article: 'Pointe du Hoc', section: 'Aftermath', revision: '1381099170' }],
    ['Pointe du Hoc § Battle › Attack and § Battle › German counter-attacks (rev. 1381099170)',
      { article: 'Pointe du Hoc', section: 'Attack', revision: '1381099170' }],
    ['Pointe du Hoc § Battle › German counter-attacks and § Timeline (6–7 June) (rev. 1381099170)',
      { article: 'Pointe du Hoc', section: 'German counter-attacks', revision: '1381099170' }],
    ['Pointe du Hoc § Background, § Prelude, § Plan, § Battle (Landings, Attack, German counter-attacks), § Aftermath (rev. 1381099170)',
      { article: 'Pointe du Hoc', section: 'Background', revision: '1381099170' }],
    ['Pointe du Hoc, title coordinate {{Coord|49|23|45|N|0|59|20|W}} (rev. 1381099170)',
      { article: 'Pointe du Hoc', revision: '1381099170' }],
    ['Omaha Beach § Terrain and defenses',
      { article: 'Omaha Beach', section: 'Terrain and defenses' }],
    ['Utah Beach', { article: 'Utah Beach' }],
    ['', undefined],
  ];
  for (const [locator, expected] of cases) {
    test(`parses ${JSON.stringify(locator)}`, () => {
      expect(parseWikipediaLocator(locator)).toEqual(expected);
    });
  }

  test('builds revision and section links', () => {
    expect(wikipediaUrl('Normandy American Cemetery and Memorial § Burials § Number of burials (oldid 1361186778)'))
      .toBe('https://en.wikipedia.org/w/index.php?title=Normandy_American_Cemetery_and_Memorial&oldid=1361186778#Number_of_burials');
    expect(wikipediaUrl('Omaha Beach § lead (revision 1388011462)'))
      .toBe('https://en.wikipedia.org/w/index.php?title=Omaha_Beach&oldid=1388011462');
    expect(wikipediaUrl('Pointe du Hoc § Battle › German counter-attacks (rev. 1381099170)'))
      .toBe('https://en.wikipedia.org/w/index.php?title=Pointe_du_Hoc&oldid=1381099170#German_counter-attacks');
    expect(wikipediaUrl('Utah Beach § Assault')).toBe('https://en.wikipedia.org/wiki/Utah_Beach#Assault');
    expect(wikipediaUrl('')).toBeUndefined();
  });

  test('every Wikipedia cite in the data yields a revision link', () => {
    const locators = new Set<string>();
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') {
        const r = o as Record<string, unknown>;
        if (r.source === 'wikipedia' && typeof r.locator === 'string') locators.add(r.locator);
        Object.values(r).forEach(walk);
      }
    };
    for (const f of readdirSync('data/events')) walk(JSON.parse(readFileSync(`data/events/${f}`, 'utf8')));
    expect(locators.size).toBeGreaterThan(0);
    for (const l of locators) {
      expect(wikipediaUrl(l), l).toMatch(/^https:\/\/en\.wikipedia\.org\/w\/index\.php\?title=[^&#]+&oldid=\d+(#[^#]+)?$/);
    }
  });
});
