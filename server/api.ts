import { Router } from 'express';
import { z } from 'zod';
import { getPlayerById, listInningsForPlayer, listPlayers } from './data.js';
import { getDataLayerStatus } from './mongo.js';
import { CricketFormatSchema } from './models.js';

const SearchQuerySchema = z.object({
  search: z.string().max(100).optional(),
  team: z.string().max(100).optional(),
  format: CricketFormatSchema.optional(),
});

const DashboardQuerySchema = z.object({
  format: CricketFormatSchema.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export function createApiRouter(): Router {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json({ status: 'ok', dataLayer: getDataLayerStatus() });
  });

  router.get('/players', async (request, response) => {
    const query = SearchQuerySchema.safeParse({
      search: request.query.search,
      team: request.query.team,
      format: request.query.format,
    });
    if (!query.success) {
      response.status(400).json({ error: 'Invalid player search filters.', details: query.error.flatten() });
      return;
    }
    const players = await listPlayers(query.data);
    response.json({
      players,
      sampleSize: players.length,
      dataLayer: getDataLayerStatus(),
      warnings: players.some((player) => player.source.type === 'illustrative_sample')
        ? ['Illustrative sample records are not real player or scorecard data.']
        : [],
    });
  });

  router.get('/players/:playerId', async (request, response) => {
    const player = await getPlayerById(request.params.playerId);
    if (!player) {
      response.status(404).json({ error: 'Player not found in the available dataset.' });
      return;
    }
    response.json({ player, dataLayer: getDataLayerStatus() });
  });

  router.get('/players/:playerId/innings', async (request, response) => {
    const parsedQuery = DashboardQuerySchema.safeParse({
      format: request.query.format,
      limit: request.query.limit,
    });
    if (!parsedQuery.success) {
      response.status(400).json({ error: 'Invalid innings filters.', details: parsedQuery.error.flatten() });
      return;
    }
    const player = await getPlayerById(request.params.playerId);
    if (!player) {
      response.status(404).json({ error: 'Player not found in the available dataset.' });
      return;
    }
    const { format, limit } = parsedQuery.data;
    const rows = (await listInningsForPlayer(player.id))
      .filter((innings) => !format || innings.format === format)
      .slice(-limit);
    response.json({
      playerId: player.id,
      innings: rows,
      sampleSize: rows.length,
      definition: 'One row represents one player batting innings; values preserve the source record and missing fields remain null.',
      source: player.source,
      dataLayer: getDataLayerStatus(),
      warnings: player.source.type === 'illustrative_sample'
        ? ['Illustrative sample innings are not real match records.']
        : [],
    });
  });

  router.get('/players/:playerId/dashboard', async (request, response) => {
    const parsedQuery = DashboardQuerySchema.safeParse({
      format: request.query.format,
      limit: request.query.limit,
    });
    if (!parsedQuery.success) {
      response.status(400).json({ error: 'Invalid dashboard filters.', details: parsedQuery.error.flatten() });
      return;
    }
    const player = await getPlayerById(request.params.playerId);
    if (!player) {
      response.status(404).json({ error: 'Player not found in the available dataset.' });
      return;
    }
    const { format, limit } = parsedQuery.data;
    const allRows = await listInningsForPlayer(player.id);
    const matchingRows = allRows.filter((innings) => !format || innings.format === format);
    const innings = matchingRows.slice(-limit);
    const runsRecorded = innings.reduce((total, row) => total + row.runs, 0);
    const notOuts = innings.filter((row) => row.isNotOut).length;
    const dismissed = innings.length - notOuts;
    const sourceIsSample = player.source.type === 'illustrative_sample';
    const warnings = [
      ...(sourceIsSample ? ['Illustrative sample records are not real scorecards or performance claims.'] : []),
      ...(innings.length < 3 ? ['Fewer than 3 innings are available; contextual conclusions are not supported.'] : []),
      ...(innings.some((row) => !row.venue) ? ['Venue is missing for one or more innings; venue analysis is unavailable.'] : []),
      ...(innings.some((row) => row.ballsFaced === null) ? ['Balls faced is missing for one or more innings; strike-rate calculation is unavailable.'] : []),
    ];

    response.json({
      player,
      innings,
      selectedWindow: limit,
      format: format ?? null,
      summary: {
        inningsAvailable: innings.length,
        runsRecorded,
        notOuts,
        timesDismissed: dismissed,
      },
      metrics: {
        battingAverage: {
          value: null,
          unit: 'runs per dismissal',
          sampleSize: innings.length,
          baselineValue: null,
          difference: null,
          confidenceLabel: innings.length < 3 ? 'Insufficient sample' : 'Not calculated in Phase 1',
          definition: 'Batter-credited runs divided by times dismissed; not-outs are excluded from dismissals.',
          warning: 'Core batting calculations are scheduled for the next phase; no value is estimated here.',
        },
        strikeRate: {
          value: null,
          unit: 'runs per 100 balls',
          sampleSize: innings.length,
          baselineValue: null,
          difference: null,
          confidenceLabel: 'Not calculated in Phase 1',
          definition: 'Batter-credited runs divided by balls faced, multiplied by 100; use the source ball-faced definition.',
          warning: 'Core batting calculations are scheduled for the next phase; missing balls are not replaced with zero.',
        },
        formIndex: {
          value: null,
          unit: '0–100 index',
          sampleSize: innings.length,
          baselineValue: null,
          difference: null,
          confidenceLabel: 'Unavailable',
          definition: 'A format-specific calibrated composite relative to a documented reference population.',
          warning: 'No reference population has been calibrated, so a Form Index is intentionally not shown.',
        },
      },
      coverage: {
        source: player.source,
        coverage: player.coverage,
        dataLayer: getDataLayerStatus(),
        lastUpdated: player.source.retrievedAt ?? null,
        availableFields: ['player identity', 'format', 'runs', 'not-out status', 'sample size'],
        missingFields: [
          ...(!innings.some((row) => row.matchDate) ? ['match date'] : []),
          ...(!innings.some((row) => row.opponent) ? ['opponent'] : []),
          ...(!innings.some((row) => row.venue) ? ['venue'] : []),
          ...(!innings.some((row) => row.ballsFaced !== null) ? ['balls faced'] : []),
        ],
      },
      warnings,
    });
  });

  return router;
}
