import express from 'express';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApiRouter } from './api.js';
import { filterPlayers } from './data.js';
import { SAMPLE_INNINGS, SAMPLE_PLAYERS } from './sample-data.js';
import { classifyMongoUri } from './mongo.js';
import { MatchSchema, MatchInningsSchema, VenueSchema } from './models.js';

const app = express();
app.use('/', createApiRouter());

const sampleSource = SAMPLE_PLAYERS[0]!.source;

describe('Phase 1 data foundation', () => {
  it('keeps demonstration records explicitly classified as illustrative', () => {
    expect(SAMPLE_PLAYERS.every((player) => player.source.type === 'illustrative_sample')).toBe(true);
    expect(SAMPLE_INNINGS.every((innings) => innings.source.type === 'illustrative_sample')).toBe(true);
    expect(SAMPLE_PLAYERS[0]?.source.licenceNote).toContain('Synthetic demonstration records only');
  });

  it('does not collapse players that share a name', () => {
    const first = SAMPLE_PLAYERS[0]!;
    const second = { ...SAMPLE_PLAYERS[1]!, fullName: first.fullName };
    const matches = filterPlayers([first, second], { search: first.fullName });
    expect(matches).toHaveLength(2);
    expect(new Set(matches.map((player) => player.id)).size).toBe(2);
  });

  it('filters format and team without inventing missing values', () => {
    expect(filterPlayers(SAMPLE_PLAYERS, { format: 'ODI' })).toHaveLength(0);
    expect(filterPlayers(SAMPLE_PLAYERS, { team: 'sample xi' })).toHaveLength(2);
    expect(SAMPLE_INNINGS.every((innings) => innings.venue === null && innings.matchDate === null)).toBe(true);
  });

  it('distinguishes missing, malformed, and non-Mongo database URIs without exposing secrets', () => {
    expect(classifyMongoUri(undefined)?.mode).toBe('sample');
    expect(classifyMongoUri('not-a-uri')?.mode).toBe('unavailable');
    expect(classifyMongoUri('postgres://private.example/db')?.message).toContain('mongodb://');
    expect(classifyMongoUri('mongodb://localhost:27017/cricmetric')).toBeNull();
  });

  it('validates match, match-innings, and venue data models with provenance', () => {
    expect(MatchSchema.safeParse({ id: 'm-1', format: 'T20I', source: sampleSource }).success).toBe(true);
    expect(MatchInningsSchema.safeParse({ id: 'mi-1', matchId: 'm-1', inningsNumber: 1, source: sampleSource }).success).toBe(true);
    expect(VenueSchema.safeParse({ id: 'v-1', name: 'A sourced ground', source: sampleSource }).success).toBe(true);
  });
});

describe('player API', () => {
  it('returns search results with the source warning and data-layer state', async () => {
    const response = await request(app).get('/players?search=Alpha&format=T20I').expect(200);
    expect(response.body.players).toHaveLength(1);
    expect(response.body.players[0].id).toBe('sample-batter-alpha');
    expect(response.body.players[0].source.type).toBe('illustrative_sample');
    expect(response.body.warnings).toContain('Illustrative sample records are not real player or scorecard data.');
    expect(response.body.dataLayer.mode).toBe('sample');
  });

  it('returns dashboard metric definitions, missing-data warnings, and null uncalibrated values', async () => {
    const response = await request(app)
      .get('/players/sample-batter-alpha/dashboard?format=T20I&limit=5')
      .expect(200);
    expect(response.body.summary.inningsAvailable).toBe(5);
    expect(response.body.metrics.battingAverage.value).toBeNull();
    expect(response.body.metrics.battingAverage.definition).toContain('not-outs are excluded');
    expect(response.body.metrics.strikeRate.value).toBeNull();
    expect(response.body.metrics.formIndex.value).toBeNull();
    expect(response.body.coverage.missingFields).toContain('venue');
    expect(response.body.warnings.some((warning: string) => warning.includes('not real scorecards'))).toBe(true);
  });

  it('does not return a profile for an unknown identifier', async () => {
    const response = await request(app).get('/players/not-a-player').expect(404);
    expect(response.body.error).toContain('not found');
  });

  it('rejects invalid window sizes instead of silently coercing them', async () => {
    await request(app).get('/players/sample-batter-alpha/dashboard?limit=99').expect(400);
  });
});
