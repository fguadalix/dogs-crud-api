import express, { Application } from 'express';
import routes from './presentation/routes';
import { errorHandler } from './presentation/middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api', routes);

  // Error handling
  app.use(errorHandler);

  return app;
};
