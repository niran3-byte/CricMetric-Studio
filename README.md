# Cricmetric Studio

Cricmetric Studio is a dashboard-first cricket analytics project using React, TypeScript, Vite, Express, Node.js, and MongoDB. The Phase 1 interface and API support player search and profile exploration while keeping source coverage and missing data visible.

## Run locally

1. Install Node.js 22+ and npm 10.9.9.
2. Run `npm install`.
3. Copy `.env.example` to `.env`. Add a MongoDB connection string as `MONGODB_URI` only if you have a permitted MongoDB deployment and credentials. Never commit `.env`.
4. Run `npm run dev` and open the local development server on port 3000.
5. Run `npm run typecheck`, `npm test`, and `npm run build` for verification.

Without `MONGODB_URI`, the app serves two explicitly identified synthetic demonstration profiles. They are not real players, teams, matches, venues, or scorecards. A configured but unreachable MongoDB instance is reported as unavailable while the interface continues to label the demonstration data. When MongoDB is connected, the API reads only schema-valid documents in the `players` and `batting_innings` collections; ordinary application startup does not seed, update, or delete database documents. No MongoDB URI was supplied for Phase 1, so a live MongoDB connection and database-backed read have not been verified.

If you explicitly intend to initialize an empty MongoDB database with synthetic demo records, review the destination first and run `npm run db:seed-sample -- --confirm-illustrative`. The command refuses to seed if any `players`, `matches`, `venues`, `match_innings`, or `batting_innings` record already exists. It adds unique provider/entity/deduplication indexes and inserts only records classified as illustrative samples. The emptiness check and inserts are not an atomic transaction, so run it only against a quiescent database intentionally reserved for synthetic sample data. Do not run this command against production or a database containing real data.

## API

- `GET /api/health`
- `GET /api/players?search=&team=&format=`
- `GET /api/players/:playerId`
- `GET /api/players/:playerId/innings?format=&limit=`
- `GET /api/players/:playerId/dashboard?format=&limit=`

The dashboard endpoint returns metric definitions, null values for calculations not yet implemented, sample sizes, warnings, data-source metadata, coverage, and missing fields. It does not calculate a Form Index without a calibrated reference population.

## Scope and data rights

Phase 1 establishes the project foundation and dashboard shell. It does not include licensed-feed ingestion, manual/CSV imports, authentication, comparison workflows, or the calibrated metric suite. The owner field in the future user-dataset schema is not an authorization boundary; add authentication and dataset ownership enforcement before exposing private datasets. Do not scrape ESPNcricinfo, bypass access controls, present synthetic records as facts, or claim complete coverage. Connect only a dataset/provider whose licence permits the intended use and retain source and licence notes.
