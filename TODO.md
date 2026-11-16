# Cricmetric Studio — Phase 1 To Do

Status key: `[ ]` open, `[x]` complete only when the described outcome has been implemented and verified.

## 1. MERN + TypeScript project foundation

- [x] Establish the requested MERN architecture: React + TypeScript + Vite frontend, and Node.js + Express + TypeScript API, with environment-based configuration and server-side secrets.
- [x] Define MongoDB models for players, matches, venues, match innings, batting innings, provenance/data sources, and private user datasets.
- [x] Include stable provider IDs, schema validation, duplicate-prevention indexes, timestamps, data freshness, and licence/source notes in the relevant models. Unique indexes are created by the explicit seed command, not automatically on application startup.
- [ ] Connect to MongoDB only when a valid URI is configured; otherwise present clear unavailable/error states. Do not silently substitute another database. The absent/invalid URI and sample-mode paths are implemented and checked; a real MongoDB connection/read path remains unverified because no `MONGODB_URI` was supplied.
- [x] Provide only explicitly labelled illustrative sample records when no permitted provider dataset is available. In-memory samples are marked as synthetic and not real scorecards. The optional Mongo seed command requires `--confirm-illustrative` and refuses to write if cricket collections already contain records; no Mongo database was modified for this task.

## 2. Player search and selection

- [x] Build player search with optional team and format context.
- [x] Disambiguate name collisions using available identifying details; do not merge distinct players based on name alone. Duplicate-name behavior is covered by a test that confirms distinct IDs remain distinct.
- [x] Provide clear coverage messaging and routes from search/player-list results to player profiles.

## 3. Player profile and dashboard shell

- [x] Build a responsive player profile/dashboard shell, displaying identity details only when sourced.
- [x] Include format and recent-innings controls, contextual filter placeholders, provenance, coverage and last-updated details, and reset behavior.
- [ ] Expose Phase 1 API endpoints for player search, player profile, and database-backed innings/dashboard data. Search/profile/dashboard APIs pass live HTTP checks in illustrative sample mode; actual MongoDB-backed reads await a configured, authorized MongoDB URI.
- [x] API responses return definitions, units, sample sizes, warnings, source metadata, and missing-data states without inventing values.
- [x] Present accessible KPI, recent-innings, trend, consistency, and conditions panel shells; distinguish unavailable metrics and small samples clearly.
- [x] Avoid decorative gauges and unsupported estimates. Do not infer pitch, weather, or performance effects when reliable source values are absent.

## 4. Data provenance, coverage, and source integrity

- [x] Preserve and display source/provenance and freshness information for player and innings records.
- [x] Make data coverage visible; never imply complete player, competition, format, venue, or historical coverage without evidence.
- [x] Do not scrape ESPNcricinfo, bypass access controls, or redistribute proprietary data. Any external provider/dataset must permit the intended use; retain attribution/licence notes.
- [x] Do not fabricate player records, venues, pitch types, or match statistics. Any bundled sample records are explicitly identified as synthetic illustrative data and are not presented as cricket facts.

## 5. Phase 1 quality and verification

- [x] Add validation and tests for model/API behavior, player-name collisions, missing/invalid MongoDB URI states, provenance display, missing context, and clearly labelled sample records.
- [x] Run the app and applicable verification commands before claiming Phase 1 complete; resolve actionable failures. `npm run check` passes 9 tests, `npm run build` succeeds, and live HTTP checks pass for health, home page, route manifest, player search, and dashboard response.
- [x] At the end of Phase 1, report changed files, setup/run commands, verification results, known limitations, and the exact next roadmap step.
- [x] State the next step as implementing tested dashboard calculations and filters, followed by manual/CSV entry and broader integrations. Do not mark future phases complete in Phase 1.
