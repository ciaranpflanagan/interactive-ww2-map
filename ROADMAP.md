# Roadmap

The foreman turns the first unfinished milestone into issues. Tick items off as their PRs merge.
The maintainer edits this file to steer the factory.

## M1 Foundation ✅
- [x] Data schema with mandatory citations, source register, validator
- [x] Wikidata importer: 41 coarse Overlord/Neptune events, all `unreviewed`
- [x] Map, timeline scrubber, event panel with numbered sources, "Sources & method" dialog
- [x] CI, data gate, automerge, Azure Static Web Apps via Bicep, agent roles

## M2 D-Day beaches in depth
- [ ] Fix the five beach records: real summaries, `parent` → a new "D-Day landings (Neptune assault phase)" event, `kind: landing`
- [ ] Omaha Beach in depth: polygon for the beach, sector events (Charlie, Dog Green/White/Red, Easy Green/Red, Fox Green/Red) at zoom ≥ 12, landing times, assaulting units, casualty ranges, modern places (Normandy American Cemetery, Overlord Museum, Les Braves memorial, surviving WN strongpoints)
- [ ] Pointe du Hoc (2nd and 5th Ranger Battalions)
- [ ] Utah Beach in depth (same depth as Omaha)
- [ ] Gold, Juno and Sword: beach polygons, sectors, assaulting divisions, casualties (Canadian and UK official histories)
- [ ] Airborne: Operation Tonga (Pegasus Bridge, Merville Battery), US 82nd and 101st drop zones, Sainte-Mère-Église
- [ ] Verify or replace the US Army CMH source URLs (the site blocks automated fetching)

## M3 Campaign accuracy
- [ ] Fix known Wikidata import errors: Operation Totalize placed at Caen centre; Normandy landings end date 29 Aug; Battle of Graignes date; Operation Atlantic date
- [ ] Battle for Cherbourg, Carentan, Caen operations (Epsom, Charnwood, Goodwood, Totalize, Tractable), Operation Cobra (missing from Wikidata import), Falaise Pocket: curated with official histories
- [ ] Representative points → approximate areas or axes of advance where sources allow
- [ ] Civilian toll in Normandy (e.g. bombing of Caen, Saint-Lô), with equal care

## M4 Experience
- [ ] Deep links: `?event=omaha-beach&date=1944-06-06&z=12` (shareable URLs)
- [ ] Search and filters (kind, side, review status)
- [ ] Selecting an event moves the timeline into its date range; keyboard navigation on the timeline
- [ ] Then and now: a swipe comparison of IGN 1944 aerial photography against the modern map (check IGN licence terms first, as a `needs-human` decision)
- [ ] Clustering and declutter at low zoom; panel must not cover the selected marker
- [ ] Accessibility pass (keyboard, screen reader labels, contrast); dark-mode map style
- [ ] Code-split MapLibre (bundle > 500 kB)

## M5 Beyond Normandy (needs maintainer decision on order)
- [ ] Generalise the importer roots and scope label; next theatre TBD
