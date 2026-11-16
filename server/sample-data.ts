import type { BattingInnings, Player } from './models.js';

const sampleSource = {
  type: 'illustrative_sample' as const,
  label: 'Illustrative sample dataset · not real scorecards',
  provider: null,
  sourceRecordId: null,
  sourceUrl: null,
  licenceNote: 'Synthetic demonstration records only; no real match, player, team, opponent, venue, or performance claim.',
  checksum: null,
  ingestionStatus: 'sample' as const,
  retrievedAt: null,
};

const sampleCoverage: Player['coverage'] = {
  inningsAvailable: 12,
  formats: ['T20I'],
  competitions: [],
  lastUpdated: null,
  note: 'Demonstration coverage only. No licensed competition or historical coverage is represented.',
};

export const SAMPLE_PLAYERS: Player[] = [
  {
    id: 'sample-batter-alpha',
    provider: null,
    providerPlayerId: null,
    fullName: 'Sample Batter Alpha',
    knownAs: null,
    team: 'Sample XI · illustrative',
    formats: ['T20I'],
    playingRole: 'Batter · sample profile',
    battingHand: null,
    bowlingStyle: null,
    createdAt: null,
    updatedAt: null,
    source: sampleSource,
    coverage: sampleCoverage,
  },
  {
    id: 'sample-batter-beta',
    provider: null,
    providerPlayerId: null,
    fullName: 'Sample Batter Beta',
    knownAs: null,
    team: 'Sample XI · illustrative',
    formats: ['T20I'],
    playingRole: 'Batter · sample profile',
    battingHand: null,
    bowlingStyle: null,
    createdAt: null,
    updatedAt: null,
    source: sampleSource,
    coverage: { ...sampleCoverage, inningsAvailable: 8 },
  },
];

const alphaRuns = [18, 42, 7, 55, 31, 0, 26, 68, 14, 39, 11, 47];
const alphaBalls = [15, 29, 8, 34, 24, 2, 19, 41, 12, 27, 10, 32];
const betaRuns = [8, 21, 0, 46, 17, 33, 4, 28];
const betaBalls = [10, 18, 1, 31, 16, 22, 6, 20];

function makeSampleInnings(playerId: string, runs: number[], balls: number[]): BattingInnings[] {
  return runs.map((score, index) => {
    const isNotOut = index % 4 === 2;
    return {
      id: `${playerId}-sample-innings-${String(index + 1).padStart(2, '0')}`,
      playerId,
      matchId: null,
      inningsId: null,
      format: 'T20I',
      sequence: index + 1,
      matchDate: null,
      opponent: null,
      venue: null,
      inningsNumber: null,
      runs: score,
      ballsFaced: balls[index] ?? null,
      fours: null,
      sixes: null,
      isNotOut,
      dismissalType: isNotOut ? null : 'dismissal not specified · sample',
      source: sampleSource,
    };
  });
}

export const SAMPLE_INNINGS: BattingInnings[] = [
  ...makeSampleInnings('sample-batter-alpha', alphaRuns, alphaBalls),
  ...makeSampleInnings('sample-batter-beta', betaRuns, betaBalls),
];
