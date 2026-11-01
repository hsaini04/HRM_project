import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isTest } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: env.clientUrls,
      allowedHeaders: ['Content-Type', 'X-Demo-Role', 'X-Demo-Employee'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  if (!isTest) app.use(morgan('dev'));

  app.use('/api', apiRoutes);
  app.use('/api', notFoundHandler);

  // Optional: serve the built React app (after `npm run build`) from the same origin.
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // `root` keeps the dot-file check to index.html itself, so a checkout under a dot-folder still works.
    app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile('index.html', { root: clientDist }));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
