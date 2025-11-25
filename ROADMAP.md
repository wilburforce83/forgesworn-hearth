# Ironsworn Campaign Manager – Outstanding Work Roadmap

This document tracks the remaining work needed to reach the full product vision described in the project specification. It should be updated as new feature requests arrive.

## Backend
- [In Progress] Expand CRUD coverage: campaigns (update/delete), characters (standalone endpoints), vows/progress tracks, sites/delves, session log entries, bonds/assets, campaign notes/timeline.
- Map state persistence: discovered flags, tile metadata (biome, weather, notes, linked site IDs), per-campaign map retrieval/upsert, tile generation endpoints that return tile + narrative.
- Oracle delivery: list/browse endpoints for core + delve oracles with categories/tags; optional search.
- Moves: move definitions endpoint (categories, text, roll type), manual roll validation; optional dice verification.
- Session log export endpoint (optional) and pagination.
- LLM proxy endpoints: narrative expansion for oracle/map/delve tiles, background expansions, session-story weaving; caching/offline fallback.
- Data backup/import/export endpoints for campaigns and related data.
- Auth/tenancy decisions (if any) — currently absent.

## Frontend – Global/State
- [In Progress] Finalize domain models shared across sections (Campaign, Character, Vow/ProgressTrack, Site/Delve, MapTile, SessionLogEntry, Asset, Bond).
- [In Progress] Harden store: normalized entities, loading/error status per slice, persistence of settings, optimistic updates and refresh from API.
- [In Progress] Central API client: complete coverage for all CRUD endpoints above; oracle list fetcher; move definitions fetcher.
- Routing integration: ensure campaign/character selection flows are stable and do not loop; deep links for sites/log entries; quick-oracle drawer accessible globally.

## Frontend – Sections

### Dashboard
- Pull active campaign from store; show live stats (characters, vows, sites, recent log).
- Quick actions wired (open map, make move with selected character, new note) and create log entries.
- Surface campaign truths/notes and last explored hex/site.

### Campaigns
- List + detail panes backed by API/store.
- Edit campaign name/description/truths/tags; save/update/delete.
- Manage party assignments; manage campaign-level vows and assets.
- Show active sites/delves and hex map footprint; link out to map/site detail.

### Characters
- Full CRUD; portrait upload URL; background/pronouns/notes.
- Stat editing with validation; track controls enforcing momentum rules and debility effects.
- Bonds tracking; asset management UI (3 abilities, checkboxes, per-asset tracks).
- Vow list scoped to character; quick-roll buttons per stat hooking into Moves; sync to session log.

### Moves
- Load move list from backend definitions; categorize and searchable.
- Detailed move text (trigger/outcomes); form for inputs (character, stat/track, modifiers, progress score).
- Action/progress roll resolution using dice helper; show dice visually; manual override option.
- Log outcomes to session log; allow pinning to log; optionally auto-open oracle drawer on miss/weak hit.

### Oracles
- Fetch/browse core + delve oracles; category tree/tabs and search.
- Table view with roll buttons; chain to secondary tables when present.
- Quick-oracle drawer accessible from layout/topbar; logs to session log with roll/result text.
- Optional narrative expansion via LLM.

### World Map
- Drive map from campaign map state (discovered tiles, metadata); load/save via API.
- Side panel on tile click: coords, biome, discovered toggle, notes, linked sites, features; save changes.
- Explore action calls backend tile generation (or reveal area) and logs map events; use blank.png for undiscovered tiles.
- Center on linked site; indicate party location (if tracked); filter explored vs hidden.

### Sites & Delves
- CRUD for sites with rank/theme/domain; load theme/domain names from oracle data.
- Progress track UI for delve progress; record discoveries/dangers; link to map tile.
- Quick delve moves/oracles shortcuts; logging of discoveries and progress marks.
- Filter active/completed; link to map centering.

### Session Log / Journal
- Timeline grouped by date with type filters; expandable entries with details/dice.
- Freeform notes and pinned entries; edit/delete.
- Export to Markdown/clipboard; optional import.
- Auto-ingest logs from moves/oracles/map/site/character updates; pagination or lazy-load.

### Settings
- Theme variants (earthy light/dusk) applied via CSS variables.
- LLM model selection and narration level toggles.
- Data backup/import UI.
- Auto-log toggles and dice visibility preferences; persist to localStorage.

## Map Logic Integration
- Ensure map generation endpoint integrates with existing world generator/biome logic; extend to include features/weather.
- Sync frontend map state with backend hex map; reconcile local tile rendering with stored discovery status.
- Maintain compatibility with existing HexWorldMap component props/behaviour.

## Narrative & Oracle Integration
- Wrap oracle rolls with optional LLM narration and store in log.
- Tile exploration/delve room generation can request LLM embellishment.
- Session-story weaving tool that compiles recent log entries into narrative summaries.

## Assets & UI Polish
- Consistent earthy styling across new components; responsive grids/cards/side panels.
- Visual dice display for moves; oracle roll presentation; progress tracks with boxes/ticks.
- Accessibility pass (focus states, labels, keyboard navigation).

## Weak Spots / Inconsistencies
- Store currently mixes loading/error globally and lacks normalization; may cause unnecessary rerenders.
- API surface incomplete: no oracle list/move definition fetchers; no vow/site CRUD endpoints in client.
- Map state currently local in HexWorldScreen; needs campaign-scoped persistence and side panel.
- Moves/oracles use hardcoded sample data; must be replaced with real backend data.
- Assets/bonds not modeled in UI or API yet.
- LLM integration absent; settings UI has no effect.

## Recommended Implementation Order
1) Solidify domain models and store structure; finish API client coverage.  
2) Backend CRUD completion for campaigns/characters/vows/sites/logs/map.  
3) Map integration: campaign-scoped tiles, side panel, exploration flow + logging.  
4) Moves system with real definitions, rolling, and logging; character quick-roll hooks.  
5) Oracle browser + quick drawer with logging; wire narrative expansion hook.  
6) Sites/Delves CRUD + progress + map linkage.  
7) Session log timeline, filters, export/import, pinned notes.  
8) Assets/bonds UI, campaign vows, and character sheets polish.  
9) Settings (theme, logging, backup), LLM integration and narrative features.  
10) Final UI polish/responsiveness/accessibility pass.

## Pending Decisions / Libraries
- State management is custom context; confirm whether to keep or switch to Zustand/Redux for normalization.
- Choose dice/visual components (keep bespoke vs adopt lightweight lib).
- LLM client/proxy approach (Ollama/local vs remote), request/response formats, and caching strategy.
- Asset data source (manual JSON import vs backend collection) and bond tracking structure.
