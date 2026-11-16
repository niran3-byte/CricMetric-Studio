import type { Db } from 'mongodb';

export async function ensureCricketIndexes(database: Db): Promise<void> {
  await Promise.all([
    database.collection('players').createIndex({ id: 1 }, { unique: true, name: 'players_id_unique' }),
    database.collection('players').createIndex(
      { provider: 1, providerPlayerId: 1 },
      {
        unique: true,
        name: 'players_provider_identity_unique',
        partialFilterExpression: { provider: { $type: 'string' }, providerPlayerId: { $type: 'string' } },
      },
    ),
    database.collection('matches').createIndex({ id: 1 }, { unique: true, name: 'matches_id_unique' }),
    database.collection('matches').createIndex(
      { provider: 1, providerMatchId: 1 },
      {
        unique: true,
        name: 'matches_provider_identity_unique',
        partialFilterExpression: { provider: { $type: 'string' }, providerMatchId: { $type: 'string' } },
      },
    ),
    database.collection('venues').createIndex({ id: 1 }, { unique: true, name: 'venues_id_unique' }),
    database.collection('venues').createIndex(
      { provider: 1, providerVenueId: 1 },
      {
        unique: true,
        name: 'venues_provider_identity_unique',
        partialFilterExpression: { provider: { $type: 'string' }, providerVenueId: { $type: 'string' } },
      },
    ),
    database.collection('match_innings').createIndex({ id: 1 }, { unique: true, name: 'match_innings_id_unique' }),
    database.collection('match_innings').createIndex({ matchId: 1, inningsNumber: 1 }, { unique: true, name: 'match_innings_scorecard_unique' }),
    database.collection('batting_innings').createIndex({ id: 1 }, { unique: true, name: 'batting_innings_id_unique' }),
    database.collection('batting_innings').createIndex(
      { playerId: 1, matchId: 1, inningsId: 1 },
      {
        unique: true,
        name: 'batting_innings_scorecard_identity_unique',
        partialFilterExpression: { matchId: { $type: 'string' }, inningsId: { $type: 'string' } },
      },
    ),
    database.collection('data_sources').createIndex({ id: 1 }, { unique: true, name: 'data_sources_id_unique' }),
    database.collection('data_sources').createIndex(
      { providerName: 1, sourceRecordId: 1 },
      {
        unique: true,
        name: 'data_sources_provider_record_unique',
        partialFilterExpression: { sourceRecordId: { $type: 'string' } },
      },
    ),
    database.collection('user_datasets').createIndex({ id: 1 }, { unique: true, name: 'user_datasets_id_unique' }),
    database.collection('user_datasets').createIndex({ ownerId: 1, createdAt: -1 }, { name: 'user_datasets_owner_created' }),
  ]);
}
