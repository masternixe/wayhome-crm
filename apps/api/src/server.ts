import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@wayhome/database';
import { AuthService } from './services/auth.service';
import { PointsService } from './services/points.service';
import { SearchService } from './services/search.service';
import { StripeService } from './services/stripe.service';
import { CommissionService } from './services/commission.service';
import { EmailService } from './workers/email.worker';
import { createRoutes } from './routes';
import Redis from 'ioredis';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wayhome CRM API',
      version: '1.0.0',
      description: 'Real Estate CRM API with multi-office support, RBAC, and public property listings',
      contact: {
        name: 'Wayhome',
        email: 'support@wayhome.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

async function createApp() {
  const app = express();
  const port = process.env.PORT || 4001;

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    // Allow images and other static resources to be consumed cross-origin (for CRM/frontend)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS configuration
  const corsOptions = {
    origin: [
      process.env.WEB_URL || 'http://localhost:4000',
      process.env.CRM_URL || 'http://localhost:4000/crm',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
  
  app.use(cors(corsOptions));
  
  // Explicitly handle preflight requests
  app.options('*', cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Stripe webhook needs raw body
  app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize database
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Initialize Redis (optional for development)
  let redisConnection: Redis | null = null;
  try {
    if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
      redisConnection = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: null, // Required for BullMQ
      });
    }
  } catch (error) {
    console.log('⚠️ Redis disabled (not configured)');
  }

  // Initialize services
  const authService = new AuthService(
    prisma,
    process.env.JWT_SECRET || 'your-jwt-secret-key',
    process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key'
  );

  const pointsService = new PointsService(prisma);
  const searchService = new SearchService(prisma);
  
  const stripeService = new StripeService(
    prisma,
    process.env.STRIPE_SECRET_KEY!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  const commissionService = new CommissionService({
    EUR_TO_ALL: parseFloat(process.env.EUR_TO_ALL_RATE || '100'),
    ALL_TO_EUR: parseFloat(process.env.ALL_TO_EUR_RATE || '0.01'),
  });

  // Email service is optional for development
  let emailService: EmailService | null = null;
  try {
    if (process.env.SMTP_HOST && process.env.REDIS_URL) {
      emailService = new EmailService(
        prisma,
        redisConnection,
        {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
          },
        }
      );
    }
  } catch (error) {
    console.log('⚠️ Email service disabled (Redis/SMTP not configured)');
  }

  // Initialize search indexes on startup
  try {
    await searchService.initializeSearchIndexes();
    console.log('✅ Search indexes initialized');
  } catch (error) {
    console.error('❌ Failed to initialize search indexes:', error);
  }

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Wayhome CRM API Documentation',
  }));

  // API routes
  app.use('/api/v1', createRoutes(
    prisma,
    authService,
    pointsService,
    searchService,
    stripeService,
    emailService,
    redisConnection
  ));

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      let redisStatus = 'disabled';
      if (redisConnection) {
        try {
          await redisConnection.ping();
          redisStatus = 'connected';
        } catch {
          redisStatus = 'disconnected';
        }
      }
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: redisStatus,
          email: emailService ? 'enabled' : 'disabled',
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // API documentation redirect
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    try {
      if (emailService) await emailService.close();
      if (redisConnection) await redisConnection.quit();
      await prisma.$disconnect();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Start server
  app.listen(port, () => {
    console.log(`🚀 Wayhome CRM API server running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${port}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  return app;
}

// Start the application
createApp().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export { createApp };
