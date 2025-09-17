import { Router } from 'express';
import { PrismaClient } from '@wayhome/database';
import { AuthService } from '../services/auth.service';
import { PointsService } from '../services/points.service';
import { SearchService } from '../services/search.service';
import { StripeService } from '../services/stripe.service';
import { EmailService } from '../workers/email.worker';
import { AuthController } from '../controllers/auth.controller';
import { PropertyController } from '../controllers/property.controller';
import { LeadController } from '../controllers/lead.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { OpportunityController } from '../controllers/opportunity.controller';
import { ClientController } from '../controllers/client.controller';
import { TransactionController } from '../controllers/transaction.controller';
import { CommentController } from '../controllers/comment.controller';
import { TaskController } from '../controllers/task.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { SettingsController } from '../controllers/settings.controller';
import { UploadController } from '../controllers/upload.controller';
import { AuthMiddleware, requireAuth, requireAgent, requireManager, requireOfficeAdmin, requireSuperAdmin } from '../middleware/auth.middleware';
import Redis from 'ioredis';
import express from 'express';
import path from 'path';

export function createRoutes(
  prisma: PrismaClient,
  authService: AuthService,
  pointsService: PointsService,
  searchService: SearchService,
  stripeService: StripeService,
  emailService: EmailService | null,
  redisConnection: Redis | null
): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(authService);

  // Initialize controllers
  const authController = new AuthController(authService, emailService);
  const propertyController = new PropertyController(prisma, searchService, pointsService);
  const leadController = new LeadController(prisma, pointsService);
  const analyticsController = new AnalyticsController(prisma);
  const opportunityController = new OpportunityController(prisma);
  const clientController = new ClientController(prisma);
  const transactionController = new TransactionController(prisma);
  const commentController = new CommentController(prisma);
  const taskController = new TaskController(prisma);
  const dashboardController = new DashboardController(prisma);
  const settingsController = new SettingsController(prisma);
  const uploadController = new UploadController(prisma);

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication routes
  router.post('/auth/register', authController.register);
  router.post('/auth/login', authController.login);
  router.post('/auth/refresh', authController.refresh);
  router.post('/auth/logout', authController.logout);
  router.post('/auth/forgot-password', authController.forgotPassword);
  router.post('/auth/reset-password', authController.resetPassword);
  router.post('/auth/change-password', requireAuth(authService), authController.changePassword);
  router.get('/auth/me', requireAuth(authService), authController.getProfile);

  // Public auth routes
  router.post('/auth/public/register', authController.registerPublic);
  router.post('/auth/public/login', authController.loginPublic);
  router.get('/auth/verify-email', authController.verifyEmail);

  // Properties routes
  router.get('/properties', requireAgent(authService), propertyController.search);
  router.post('/properties', requireAgent(authService), propertyController.create);
  router.get('/properties/:id', requireAgent(authService), propertyController.getById);
  router.patch('/properties/:id', requireAgent(authService), propertyController.update);
  router.delete('/properties/:id', requireAgent(authService), propertyController.delete);
  router.get('/properties/:id/similar', propertyController.getSimilar);
  router.post('/properties/:id/badges', requireOfficeAdmin(authService), propertyController.updateBadges);

  // Leads routes
  router.get('/leads', requireAgent(authService), leadController.search);
  router.post('/leads', requireAgent(authService), leadController.create);
  router.get('/leads/stats', requireAgent(authService), leadController.getStats);
  router.get('/leads/:id', requireAgent(authService), leadController.getById);
  router.patch('/leads/:id', requireAgent(authService), leadController.update);
  router.delete('/leads/:id', requireManager(authService), leadController.delete);
  router.post('/leads/:id/convert', requireAgent(authService), leadController.convertToOpportunity);

  // Analytics routes
  router.get('/analytics', requireManager(authService), analyticsController.getAnalytics.bind(analyticsController));
  router.get('/offices', requireAuth(authService), analyticsController.getOffices.bind(analyticsController));

  // Opportunities routes
  router.get('/opportunities', requireAgent(authService), opportunityController.search.bind(opportunityController));
  router.post('/opportunities', requireAgent(authService), opportunityController.create.bind(opportunityController));
  router.get('/opportunities/stats', requireAgent(authService), opportunityController.getStats.bind(opportunityController));
  router.get('/opportunities/:id', requireAgent(authService), opportunityController.getById.bind(opportunityController));
  router.patch('/opportunities/:id', requireAgent(authService), opportunityController.update.bind(opportunityController));
  router.patch('/opportunities/:id/stage', requireAgent(authService), opportunityController.updateStage.bind(opportunityController));
  router.post('/opportunities/:id/convert-to-transaction', requireAgent(authService), opportunityController.convertToTransaction.bind(opportunityController));
  router.delete('/opportunities/:id', requireManager(authService), opportunityController.delete.bind(opportunityController));

  // Clients routes
  router.get('/clients', requireAgent(authService), clientController.search.bind(clientController));
  router.post('/clients', requireAgent(authService), clientController.create.bind(clientController));
  router.get('/clients/stats', requireAgent(authService), clientController.getStats.bind(clientController));
  router.get('/clients/:id', requireAgent(authService), clientController.getById.bind(clientController));
  router.patch('/clients/:id', requireAgent(authService), clientController.update.bind(clientController));
  router.delete('/clients/:id', requireManager(authService), clientController.delete.bind(clientController));

  // Transactions routes
  router.get('/transactions', requireAgent(authService), transactionController.search.bind(transactionController));
  router.post('/transactions', requireAgent(authService), transactionController.create.bind(transactionController));
  router.get('/transactions/stats', requireAgent(authService), transactionController.getStats.bind(transactionController));
  router.get('/transactions/:id', requireAgent(authService), transactionController.getById.bind(transactionController));
  router.patch('/transactions/:id', requireAgent(authService), transactionController.update.bind(transactionController));
  router.patch('/transactions/:id/status', requireAgent(authService), transactionController.updateStatus.bind(transactionController));
  router.delete('/transactions/:id', requireManager(authService), transactionController.delete.bind(transactionController));

  // Comments routes
  router.get('/comments/:entityType/:entityId', requireAuth(authService), commentController.getByEntity.bind(commentController));
  router.post('/comments', requireAuth(authService), commentController.create.bind(commentController));
  router.get('/comments/my', requireAuth(authService), commentController.getMyComments.bind(commentController));
  router.get('/comments/:id', requireAuth(authService), commentController.getById.bind(commentController));
  router.patch('/comments/:id', requireAuth(authService), commentController.update.bind(commentController));
  router.delete('/comments/:id', requireAuth(authService), commentController.delete.bind(commentController));

  // Tasks routes
  router.get('/tasks', requireAuth(authService), taskController.search.bind(taskController));
  router.post('/tasks', requireAuth(authService), taskController.create.bind(taskController));
  router.get('/tasks/stats', requireAuth(authService), taskController.getStats.bind(taskController));
  router.get('/tasks/my', requireAuth(authService), taskController.getMyTasks.bind(taskController));
  router.get('/tasks/:id', requireAuth(authService), taskController.getById.bind(taskController));
  router.patch('/tasks/:id', requireAuth(authService), taskController.update.bind(taskController));
  router.patch('/tasks/:id/status', requireAuth(authService), taskController.updateStatus.bind(taskController));
  router.delete('/tasks/:id', requireAuth(authService), taskController.delete.bind(taskController));

  // Dashboard routes
  router.get('/dashboard/stats', requireAuth(authService), dashboardController.getStats.bind(dashboardController));
  router.get('/dashboard/quick-stats', requireAuth(authService), dashboardController.getQuickStats.bind(dashboardController));
  router.get('/dashboard/leaderboard', requireAuth(authService), dashboardController.getLeaderboard.bind(dashboardController));
  router.get('/dashboard/recent-activity', requireAuth(authService), dashboardController.getRecentActivity.bind(dashboardController));

  // Settings routes
  router.get('/settings', requireManager(authService), settingsController.getSettings.bind(settingsController));
  router.put('/settings', requireSuperAdmin(authService), settingsController.updateSettings.bind(settingsController));
  router.get('/settings/exchange-rates', settingsController.getExchangeRates.bind(settingsController));

  // Upload routes
  router.post('/upload/document', requireAuth(authService), ...uploadController.uploadDocument);
  router.delete('/upload/document/:id', requireAuth(authService), uploadController.deleteDocument.bind(uploadController));
  router.patch('/upload/document/:id/visibility', requireAuth(authService), uploadController.updateDocumentVisibility.bind(uploadController));
  router.get('/properties/:id/documents', requireAgent(authService), propertyController.getDocuments.bind(propertyController));
  
  // Serve uploaded files
  router.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Global search
  router.get('/search', requireAuth(authService), async (req, res) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      const { user } = req as any;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const results = await searchService.globalSearch(
        q,
        user.role,
        user.officeId,
        { limit: Number(limit), offset: Number(offset) }
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Search failed',
      });
    }
  });

  // Search suggestions
  router.get('/search/suggestions', async (req, res) => {
    try {
      const { q, type = 'all', limit = 10 } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Query is required',
        });
        return;
      }

      const suggestions = await searchService.getSearchSuggestions(
        q,
        type as any,
        Number(limit)
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get suggestions',
      });
    }
  });

  // Users/Agents endpoint
  router.get('/users', requireAuth(authService), async (req, res) => {
    try {
      const { user } = req as any;
      const { role } = req.query;
      
      const where: any = {};
      
      // Role filter
      if (role) {
        const roles = (role as string).split(',');
        where.role = { in: roles };
      }
      
      // Office filter - non-super-admins can only see users from their office
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          officeId: true,
          lastLoginAt: true,
          createdAt: true,
          office: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              phone: true,
            },
          },
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
      });

      // Map status to isActive for frontend compatibility
      const usersWithActiveStatus = users.map(user => ({
        ...user,
        isActive: user.status === 'ACTIVE',
        lastLogin: user.lastLoginAt,
      }));
      
      res.json({
        success: true,
        data: usersWithActiveStatus,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  });

  // Single user detail
  router.get('/users/:id', requireAuth(authService), async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req as any;

      // Access control: Super admin can view anyone. Others limited to same office or self
      const whereUser: any = { id };
      if (user.role !== 'SUPER_ADMIN' && user.userId !== id) {
        whereUser.officeId = user.officeId;
      }

      const found = await prisma.user.findUnique({
        where: whereUser,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          officeId: true,
          lastLoginAt: true,
          createdAt: true,
          avatar: true,
          office: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              phone: true,
            },
          },
        },
      });

      if (!found) {
        res.status(404).json({ success: false, message: 'User not found or access denied' });
        return;
      }

      // Counts
      const [leadsCount, propertiesCount, transactionsCount] = await Promise.all([
        prisma.lead.count({ where: { assignedToId: id, ...(user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {}) } }).catch(() => 0),
        prisma.property.count({ where: { agentOwnerId: id, ...(user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {}) } }).catch(() => 0),
        prisma.transaction.count({
          where: {
            OR: [{ primaryAgentId: id }, { collaboratingAgentId: id }],
            ...(user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {}),
          },
        }).catch(() => 0),
      ]);

      res.json({
        success: true,
        data: {
          ...found,
          isActive: found.status === 'ACTIVE',
          lastLogin: found.lastLoginAt,
          _count: {
            leads: leadsCount,
            opportunities: 0, // Not tracked directly
            properties: propertiesCount,
            transactions: transactionsCount,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  });

  // Update user
  router.patch('/users/:id', requireAuth(authService), async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req as any;

      // Determine permissions
      const isSelf = user.userId === id;
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN';
      if (!isSelf && !isAdmin) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Enforce office boundary for non-super-admins
      if (user.role !== 'SUPER_ADMIN') {
        const target = await prisma.user.findUnique({ where: { id } });
        if (!target || (target.officeId && target.officeId !== user.officeId)) {
          res.status(403).json({ success: false, message: 'Access denied' });
          return;
        }
      }

      // Pick allowed fields
      const {
        firstName,
        lastName,
        phone,
        role,
        status,
        officeId,
        avatar,
      } = req.body || {};

      const data: any = {};
      if (typeof firstName === 'string') data.firstName = firstName;
      if (typeof lastName === 'string') data.lastName = lastName;
      if (typeof phone === 'string' || phone === null) data.phone = phone || null;
      if (typeof avatar === 'string' || avatar === null) data.avatar = avatar || null;

      // Only admins may change role/status/office
      if (isAdmin) {
        if (typeof role === 'string') data.role = role;
        if (typeof status === 'string') data.status = status;
        if (typeof officeId === 'string' || officeId === null) data.officeId = officeId || null;
      }

      if (Object.keys(data).length === 0) {
        res.status(400).json({ success: false, message: 'No valid fields to update' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          officeId: true,
          lastLoginAt: true,
          createdAt: true,
          avatar: true,
          office: {
            select: { id: true, name: true, city: true, address: true, phone: true },
          },
        },
      });

      res.json({
        success: true,
        data: {
          ...updated,
          isActive: updated.status === 'ACTIVE',
          lastLogin: updated.lastLoginAt,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  });

  // Points and leaderboard
  router.get('/agents/:id/points', requireAuth(authService), async (req, res) => {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;
      const { user } = req as any;

      // Check permissions
      if (user.role === 'AGENT' && user.userId !== id) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const points = await pointsService.getAgentPoints(id, Number(days));
      res.json({ success: true, data: points });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get points',
      });
    }
  });

  router.get('/leaderboard', requireAuth(authService), async (req, res) => {
    try {
      const { officeId, limit = 10 } = req.query;
      const { user } = req as any;

      const effectiveOfficeId = user.role === 'SUPER_ADMIN' ? officeId as string : user.officeId;
      const leaderboard = await pointsService.getLeaderboard(effectiveOfficeId, Number(limit));

      res.json({ success: true, data: leaderboard });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get leaderboard',
      });
    }
  });

  // Public property search (for website)
  router.get('/public/properties', async (req, res) => {
    try {
      const filters = {
        status: 'LISTED' as any,
        ...req.query,
      };

      // Convert string parameters to correct types
      if (req.query.featured !== undefined) {
        filters.featured = req.query.featured === 'true';
      }
      if (req.query.ashensor !== undefined) {
        filters.ashensor = req.query.ashensor === 'true';
      }
      if (req.query.priceMin !== undefined) {
        filters.priceMin = Number(req.query.priceMin);
      }
      if (req.query.priceMax !== undefined) {
        filters.priceMax = Number(req.query.priceMax);
      }
      if (req.query.bedrooms !== undefined) {
        filters.bedrooms = Number(req.query.bedrooms);
      }
      if (req.query.bathrooms !== undefined) {
        filters.bathrooms = Number(req.query.bathrooms);
      }

      console.log('🔍 Public properties search filters:', filters);

      const properties = await searchService.searchProperties(filters as any, {
        limit: Number(req.query.limit) || 20,
        offset: Number(req.query.offset) || 0,
        includeRelations: true,
      });

      console.log(`📊 Found ${properties?.length || 0} properties matching filters`);
      if (req.query.featured === 'true') {
        console.log('⭐ Featured properties specifically requested');
        if (properties?.length > 0) {
          console.log('✅ Found featured properties:', properties.map(p => ({ id: p.id, title: p.title, featured: p.featured })));
        } else {
          console.log('❌ No featured properties found');
        }
      }

      // Always return success with data array (empty if no properties)
      res.json({
        success: true,
        data: Array.isArray(properties) ? properties : [],
        total: properties?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching public properties:', error);
      // Return empty data instead of error
      res.json({
        success: true,
        data: [],
        total: 0,
      });
    }
  });

  // Public property detail
  router.get('/public/properties/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const property = await prisma.property.findUnique({
        where: { id, status: 'LISTED' },
        include: {
          agentOwner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true,
              email: true,
            },
          },
          office: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              phone: true,
            },
          },
        },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          message: 'Property not found',
        });
        return;
      }

      // Track view
      await searchService.trackPropertyView(property.id, undefined, req.ip);

      res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get property',
      });
    }
  });

  // Public user listings
  router.post('/public/listings', requireAuth(authService), async (req, res) => {
    try {
      const { user } = req as any;

      if (user.role !== 'PUBLIC_USER') {
        res.status(403).json({
          success: false,
          message: 'Only public users can create listings',
        });
        return;
      }

      const listing = await prisma.userListing.create({
        data: {
          ...req.body,
          publicUserId: user.userId,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create listing',
      });
    }
  });

  // Promote listing
  router.post('/public/listings/:id/promote', requireAuth(authService), async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, slotDuration = 30, successUrl, cancelUrl } = req.body;
      const { user } = req as any;

      if (user.role !== 'PUBLIC_USER') {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const session = await stripeService.createPromotionCheckoutSession({
        userListingId: id,
        amount,
        currency: 'EUR',
        slotDuration,
        successUrl,
        cancelUrl,
      });

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create promotion session',
      });
    }
  });

  // Featured/promoted properties
  router.get('/public/featured-slots', async (req, res) => {
    try {
      const slots = await stripeService.getActiveBiddingSlots();
      res.json({
        success: true,
        data: slots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get featured slots',
      });
    }
  });

  // Public agents endpoint
  router.get('/public/agents', async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const offset = Number(req.query.offset) || 0;

      const agents = await prisma.user.findMany({
        where: {
          role: { in: ['AGENT', 'MANAGER', 'OFFICE_ADMIN'] },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          office: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Always return success with data array (empty if no agents)
      res.json({
        success: true,
        data: Array.isArray(agents) ? agents : [],
        total: agents?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Return empty data instead of error
      res.json({
        success: true,
        data: [],
        total: 0,
      });
    }
  });

  // Public stats endpoint
  router.get('/public/stats', async (req, res) => {
    try {
      const [
        totalProperties,
        soldProperties,
        activeAgents,
        totalCities,
      ] = await Promise.all([
        prisma.property.count({
          where: { status: 'LISTED' }
        }).catch(() => 0),
        prisma.property.count({
          where: { status: 'SOLD' }
        }).catch(() => 0),
        prisma.user.count({
          where: { 
            role: { in: ['AGENT', 'MANAGER', 'OFFICE_ADMIN'] },
            status: 'ACTIVE'
          }
        }).catch(() => 0),
        prisma.property.groupBy({
          by: ['city'],
          where: { status: 'LISTED' }
        }).then(result => result.length).catch(() => 0),
      ]);

      // Always return success with actual counts (0 if no data)
      res.json({
        success: true,
        data: {
          totalProperties: totalProperties || 0,
          soldProperties: soldProperties || 0,
          activeAgents: activeAgents || 0,
          totalCities: totalCities || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Return zero stats instead of error
      res.json({
        success: true,
        data: {
          totalProperties: 0,
          soldProperties: 0,
          activeAgents: 0,
          totalCities: 0,
        },
      });
    }
  });

  // Stripe webhook
  router.post('/webhooks/stripe', async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      await stripeService.handleWebhookEvent(req.body, signature);
      res.status(200).json({ received: true });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Webhook failed',
      });
    }
  });

  // Job application
  router.post('/vacancies', async (req, res) => {
    try {
      const { name, email, phone, message, position, officeId } = req.body;

      const application = await prisma.vacancyApplication.create({
        data: {
          name,
          email,
          phone,
          message,
          position,
          officeId,
          cvUrl: req.body.cvUrl || '', // Would be uploaded separately
        },
      });

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit application',
      });
    }
  });

  return router;
}
