import { MongoClient } from 'mongodb';
import { SAMPLE_INNINGS, SAMPLE_PLAYERS } from '../server/sample-data.js';
import { ensureCricketIndexes } from '../server/indexes.js';
import { classifyMongoUri } from '../server/mongo.js';

async function main(): Promise<void> {
  if (!process.argv.includes('--confirm-illustrative')) {
    throw new Error('Refusing to write sample documents. Rerun with --confirm-illustrative only after confirming this MongoDB database is intended for synthetic demo data.');
  }

  const uri = process.env.MONGODB_URI?.trim();
  const classification = classifyMongoUri(uri);
  if (classification) throw new Error(classification.message);

  const client = new MongoClient(uri!, { serverSelectionTimeoutMS: 4000 });
  try {
    await client.connect();
    const database = client.db();
    const guardedCollections = ['players', 'matches', 'venues', 'match_innings', 'batting_innings'];
    const populated = await Promise.all(guardedCollections.map((name) => database.collection(name).findOne({}, { projection: { _id: 1 } })));
    if (populated.some(Boolean)) {
      throw new Error('Refusing to seed: at least one cricket collection already has data. No documents were inserted.');
    }

    await ensureCricketIndexes(database);
    await database.collection('players').insertMany(SAMPLE_PLAYERS);
    await database.collection('batting_innings').insertMany(SAMPLE_INNINGS);
    console.log(`Inserted ${SAMPLE_PLAYERS.length} explicitly illustrative sample players and ${SAMPLE_INNINGS.length} sample innings.`);
    console.log('These records are synthetic demonstrations, not real scorecards or cricket facts.');
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Sample seeding failed.');
  process.exitCode = 1;
});
