# Phase 1 data policy

The bundled records exist only to exercise the UI and API. Every sample profile and innings is classified as `illustrative_sample`; the UI says the records are not real scorecards. Sample names, scores, teams, and format context are synthetic. No real opponent, venue, pitch label, date, or source URL is supplied. Never cite sample values as cricket facts.

When `MONGODB_URI` is absent, the API uses the explicitly labelled in-memory sample set. When MongoDB is reachable, the API reads schema-valid records from `players` and `batting_innings`; it does not seed, update, or delete database documents automatically. When a configured MongoDB cannot be reached, the service reports that state and keeps the sample fallback clearly identified.

Before any licensed provider integration, confirm the plan's player/match coverage, intended use rights, attribution, rate limits, cache rules, retention, and redistribution permissions. Do not scrape ESPNcricinfo or bypass access controls. Preserve provenance and distinguish unknown from zero.
