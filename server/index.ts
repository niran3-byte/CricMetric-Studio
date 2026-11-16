import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApiRouter } from './api.js';
import { initializeMongo } from './mongo.js';

const app = express();
const projectRoot = process.cwd();
const clientRoot = resolve(projectRoot, 'client');
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use('/api', createApiRouter());

await initializeMongo();

const httpServer = createServer(app);
if (production) {
  const staticRoot = resolve(projectRoot, 'dist/client');
  app.use(express.static(staticRoot, { index: false }));
  app.use((request, response, next) => {
    if (request.path.startsWith('/api/')) {
      next();
      return;
    }
    response.sendFile(resolve(staticRoot, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    configFile: resolve(projectRoot, 'vite.config.ts'),
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.use(async (request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api/')) {
      next();
      return;
    }
    try {
      const template = await readFile(resolve(clientRoot, 'index.html'), 'utf8');
      const html = await vite.transformIndexHtml(request.originalUrl, template);
      response.status(200).type('html').send(html);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled request error:', error instanceof Error ? error.message : 'unknown error');
  response.status(500).json({ error: 'The request could not be completed.' });
});

httpServer.listen(port, host, () => {
  console.log(`Cricmetric Studio listening on ${host}:${port} (${production ? 'production' : 'development'})`);
});
