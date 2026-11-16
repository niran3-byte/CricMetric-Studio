import { BattingInningsSchema, PlayerSchema, type BattingInnings, type CricketFormat, type Player } from './models.js';
import { getMongoDatabase } from './mongo.js';
import { SAMPLE_INNINGS, SAMPLE_PLAYERS } from './sample-data.js';

function parsePlayers(documents: unknown[]): Player[] {
  return documents.flatMap((document) => {
    const parsed = PlayerSchema.safeParse(document);
    return parsed.success ? [parsed.data] : [];
  });
}

function parseInnings(documents: unknown[]): BattingInnings[] {
  return documents.flatMap((document) => {
    const parsed = BattingInningsSchema.safeParse(document);
    return parsed.success ? [parsed.data] : [];
  });
}

export function filterPlayers(
  players: Player[],
  options: { search?: string; team?: string; format?: CricketFormat },
): Player[] {
  const query = options.search?.trim().toLocaleLowerCase() ?? '';
  const teamQuery = options.team?.trim().toLocaleLowerCase() ?? '';
  return players
    .filter((player) => {
      const nameMatches = !query || [player.fullName, player.knownAs ?? '', player.team ?? '']
        .some((value) => value.toLocaleLowerCase().includes(query));
      const teamMatches = !teamQuery || (player.team ?? '').toLocaleLowerCase().includes(teamQuery);
      const formatMatches = !options.format || player.formats.includes(options.format);
      return nameMatches && teamMatches && formatMatches;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName) || a.id.localeCompare(b.id));
}

export async function listPlayers(options: {
  search?: string;
  team?: string;
  format?: CricketFormat;
} = {}): Promise<Player[]> {
  const database = getMongoDatabase();
  if (!database) return filterPlayers(SAMPLE_PLAYERS, options);
  const documents = await database.collection('players').find({}).limit(1000).toArray();
  return filterPlayers(parsePlayers(documents), options);
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const database = getMongoDatabase();
  if (!database) return SAMPLE_PLAYERS.find((player) => player.id === id) ?? null;
  const document = await database.collection('players').findOne({ id });
  if (!document) return null;
  const parsed = PlayerSchema.safeParse(document);
  return parsed.success ? parsed.data : null;
}

export async function listInningsForPlayer(playerId: string): Promise<BattingInnings[]> {
  const database = getMongoDatabase();
  if (!database) {
    return SAMPLE_INNINGS.filter((innings) => innings.playerId === playerId)
      .sort((a, b) => a.sequence - b.sequence);
  }
  const documents = await database.collection('batting_innings')
    .find({ playerId })
    .sort({ sequence: 1 })
    .limit(5000)
    .toArray();
  return parseInnings(documents).sort((a, b) => a.sequence - b.sequence);
}
