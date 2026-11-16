import { MongoClient, type Db } from 'mongodb';

export type DataLayerStatus = {
  mode: 'sample' | 'mongo' | 'unavailable';
  connected: boolean;
  message: string;
};

let client: MongoClient | null = null;
let database: Db | null = null;
let dataLayerStatus: DataLayerStatus = {
  mode: 'sample',
  connected: false,
  message: 'MongoDB is not configured; showing explicitly labelled illustrative sample records.',
};

export function classifyMongoUri(uri: string | null | undefined): DataLayerStatus | null {
  const candidate = uri?.trim();
  if (!candidate) {
    return {
      mode: 'sample',
      connected: false,
      message: 'MongoDB URI is not configured; showing explicitly labelled illustrative sample records.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      mode: 'unavailable',
      connected: false,
      message: 'MongoDB URI is invalid; showing explicitly labelled illustrative sample records.',
    };
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
    return {
      mode: 'unavailable',
      connected: false,
      message: 'MongoDB URI must use mongodb:// or mongodb+srv://; showing illustrative sample records.',
    };
  }
  return null;
}

export async function initializeMongo(): Promise<DataLayerStatus> {
  const uri = process.env.MONGODB_URI?.trim();
  const classification = classifyMongoUri(uri);
  if (classification) {
    dataLayerStatus = classification;
    return dataLayerStatus;
  }

  try {
    client = new MongoClient(uri!, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    database = client.db();
    await database.command({ ping: 1 });
    dataLayerStatus = {
      mode: 'mongo',
      connected: true,
      message: 'MongoDB is connected. Records are shown only when they pass the application data schema.',
    };
  } catch {
    if (client) await client.close().catch(() => undefined);
    client = null;
    database = null;
    dataLayerStatus = {
      mode: 'unavailable',
      connected: false,
      message: 'MongoDB could not be reached; showing explicitly labelled illustrative sample records.',
    };
  }
  return dataLayerStatus;
}

export function getMongoDatabase(): Db | null {
  return database;
}

export function getDataLayerStatus(): DataLayerStatus {
  return dataLayerStatus;
}
