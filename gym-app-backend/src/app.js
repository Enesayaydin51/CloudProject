const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const config = require('./config/env');
const logger = require('./infrastructure/logging/logger');
const authRoutes = require('./presentation/routes/authRoutes');
const foodRoutes = require('./presentation/routes/foodRoutes');
const aiRoutes = require('./presentation/routes/aiRoutes');
const trainingProgramRoutes = require('./presentation/routes/trainingProgramRoutes');
const { errorHandler } = require('./presentation/middleware/errorHandler');
const dbConnection = require('./infrastructure/database/connection');
const redisClient = require('./infrastructure/cache/redisClient');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gym App API',
      version: '1.0.0',
      description: 'Gym App Backend API Documentation',
    },
    servers: [
      {
        url: config.publicApiUrl,
        description: config.isProduction ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: "JWT token girin. Önce /api/auth/login endpoint'inden token alın.",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/presentation/routes/*.js', './src/presentation/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    })
  );

  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/auth', authRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/program', trainingProgramRoutes);

  app.get('/health', async (req, res) => {
    let dbStatus = 'disconnected';
    try {
      const pool = dbConnection.getPool();
      if (pool) {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      }
    } catch {
      dbStatus = 'error';
    }

    const healthy = dbStatus === 'connected';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'OK' : 'DEGRADED',
      message: 'Gym App Backend',
      database: dbStatus,
      redis: redisClient.isReady() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/test-db', async (req, res) => {
    try {
      const result = await dbConnection.query('SELECT NOW() as current_time');
      res.status(200).json({
        success: true,
        message: 'Database connection successful',
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message,
      });
    }
  });

  app.use(errorHandler);

  app.use((req, res) => {
    res.status(404).json({
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  return app;
}

module.exports = { createApp };
