import express from 'express';
import { prisma } from '@hola-tattoo/database';
import { BOT_VERSION, getVersionString } from '../version';
import { ACTIVE_CONFIG } from '../config/botConfigs';

export const healthRouter = express.Router();

healthRouter.get('/', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: {
        number: BOT_VERSION.version,
        name: BOT_VERSION.name,
        releaseDate: BOT_VERSION.releaseDate,
        config: ACTIVE_CONFIG.name,
        full: getVersionString()
      },
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
