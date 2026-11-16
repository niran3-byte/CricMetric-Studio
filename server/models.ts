import { z } from 'zod';

export const CricketFormatSchema = z.enum(['Test', 'ODI', 'T20I', 'Domestic']);
export type CricketFormat = z.infer<typeof CricketFormatSchema>;

export const DataSourceSchema = z.object({
  type: z.enum(['illustrative_sample', 'licensed_provider', 'manual_entry']),
  label: z.string().min(1),
  provider: z.string().nullable().default(null),
  sourceRecordId: z.string().nullable().default(null),
  sourceUrl: z.string().url().nullable().default(null),
  licenceNote: z.string().min(1),
  checksum: z.string().nullable().default(null),
  ingestionStatus: z.enum(['sample', 'imported', 'validated', 'corrected', 'rejected']).default('sample'),
  retrievedAt: z.string().datetime().nullable().default(null),
});
export type DataSource = z.infer<typeof DataSourceSchema>;

export const DataSourceRecordSchema = z.object({
  id: z.string().min(1),
  providerName: z.string().min(1),
  sourceRecordId: z.string().nullable().default(null),
  sourceUrl: z.string().url().nullable().default(null),
  retrievedAt: z.string().datetime().nullable().default(null),
  licenceNote: z.string().min(1),
  checksum: z.string().nullable().default(null),
  ingestionStatus: z.enum(['sample', 'imported', 'validated', 'corrected', 'rejected']),
});
export type DataSourceRecord = z.infer<typeof DataSourceRecordSchema>;

export const CoverageSchema = z.object({
  inningsAvailable: z.number().int().nonnegative(),
  formats: z.array(CricketFormatSchema),
  competitions: z.array(z.string()),
  lastUpdated: z.string().datetime().nullable().default(null),
  note: z.string().min(1),
});

export const PlayerSchema = z.object({
  id: z.string().min(1),
  provider: z.string().nullable().default(null),
  providerPlayerId: z.string().nullable().default(null),
  fullName: z.string().min(1),
  knownAs: z.string().nullable().default(null),
  team: z.string().nullable().default(null),
  formats: z.array(CricketFormatSchema),
  playingRole: z.string().nullable().default(null),
  battingHand: z.string().nullable().default(null),
  bowlingStyle: z.string().nullable().default(null),
  createdAt: z.string().datetime().nullable().default(null),
  updatedAt: z.string().datetime().nullable().default(null),
  source: DataSourceSchema,
  coverage: CoverageSchema,
});
export type Player = z.infer<typeof PlayerSchema>;

export const VenueSchema = z.object({
  id: z.string().min(1),
  provider: z.string().nullable().default(null),
  providerVenueId: z.string().nullable().default(null),
  name: z.string().min(1),
  city: z.string().nullable().default(null),
  country: z.string().nullable().default(null),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  pitchType: z.string().nullable().default(null),
  source: DataSourceSchema,
});
export type Venue = z.infer<typeof VenueSchema>;

export const MatchSchema = z.object({
  id: z.string().min(1),
  provider: z.string().nullable().default(null),
  providerMatchId: z.string().nullable().default(null),
  format: CricketFormatSchema,
  competition: z.string().nullable().default(null),
  matchDate: z.string().date().nullable().default(null),
  venueId: z.string().nullable().default(null),
  homeTeam: z.string().nullable().default(null),
  awayTeam: z.string().nullable().default(null),
  tossWinner: z.string().nullable().default(null),
  dayNight: z.boolean().nullable().default(null),
  source: DataSourceSchema,
  retrievedAt: z.string().datetime().nullable().default(null),
});
export type Match = z.infer<typeof MatchSchema>;

export const MatchInningsSchema = z.object({
  id: z.string().min(1),
  matchId: z.string().min(1),
  inningsNumber: z.number().int().positive(),
  battingTeam: z.string().nullable().default(null),
  bowlingTeam: z.string().nullable().default(null),
  teamTotal: z.number().int().nonnegative().nullable().default(null),
  wickets: z.number().int().min(0).max(10).nullable().default(null),
  overs: z.number().nonnegative().nullable().default(null),
  source: DataSourceSchema,
});
export type MatchInnings = z.infer<typeof MatchInningsSchema>;

export const BattingInningsSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  matchId: z.string().nullable().default(null),
  inningsId: z.string().nullable().default(null),
  format: CricketFormatSchema,
  sequence: z.number().int().positive(),
  matchDate: z.string().date().nullable().default(null),
  opponent: z.string().nullable().default(null),
  venue: z.string().nullable().default(null),
  inningsNumber: z.number().int().positive().nullable().default(null),
  runs: z.number().int().nonnegative(),
  ballsFaced: z.number().int().nonnegative().nullable().default(null),
  fours: z.number().int().nonnegative().nullable().default(null),
  sixes: z.number().int().nonnegative().nullable().default(null),
  isNotOut: z.boolean(),
  dismissalType: z.string().nullable().default(null),
  source: DataSourceSchema,
});
export type BattingInnings = z.infer<typeof BattingInningsSchema>;

export const PlayerDatasetSchema = z.object({
  id: z.string().min(1),
  datasetName: z.string().min(1),
  ownerId: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
  source: DataSourceSchema.optional(),
});
export type PlayerDataset = z.infer<typeof PlayerDatasetSchema>;
