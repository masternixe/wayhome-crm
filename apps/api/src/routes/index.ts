import { Router } from 'express';
import express from 'express';
import path from 'path';
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
import { OfficeController } from '../controllers/office.controller';
import { CacheService } from '../services/cache.service';
import { 
  createCacheMiddleware,
  createPropertyCacheMiddleware,
  createPropertyDetailsCacheMiddleware,
  createAnalyticsCacheMiddleware,
  createSearchCacheMiddleware,
  createStaticCacheMiddleware,
  createCacheInvalidationMiddleware
} from '../middleware/cache.middleware';
import { AuthMiddleware, requireAuth, requireAgent, requireManager, requireOfficeAdmin, requireSuperAdmin } from '../middleware/auth.middleware';
import Redis from 'ioredis';

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
  
  // Initialize cache service
  const cacheService = new CacheService(redisConnection);

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
  const uploadController = new UploadController(prisma, cacheService);
  const officeController = new OfficeController(prisma);

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
  router.get('/properties', 
    requireAgent(authService),
    createPropertyCacheMiddleware(cacheService),
    propertyController.search
  );
  router.post('/properties', 
    requireAgent(authService),
    createCacheInvalidationMiddleware(cacheService, ['properties:*', 'api:properties:*', 'analytics:*']),
    propertyController.create
  );
  router.get('/properties/:id', 
    requireAgent(authService),
    createPropertyDetailsCacheMiddleware(cacheService),
    propertyController.getById
  );
  router.patch('/properties/:id', 
    requireAgent(authService),
    createCacheInvalidationMiddleware(cacheService, (req) => [
      `property:${req.params.id}`,
      'properties:*',
      'api:properties:*',  // Add this for public API cache
      'analytics:*'
    ]),
    propertyController.update
  );
  router.delete('/properties/:id', 
    requireAgent(authService),
    createCacheInvalidationMiddleware(cacheService, (req) => [
      `property:${req.params.id}`,
      'properties:*',
      'api:properties:*',  // Add this for public API cache
      'analytics:*'
    ]),
    propertyController.delete
  );
  router.get('/properties/:id/similar', 
    createPropertyCacheMiddleware(cacheService),
    propertyController.getSimilar
  );
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
  
  // Office management routes
  router.get('/offices', requireAuth(authService), officeController.getAll.bind(officeController));
  router.post('/offices', requireSuperAdmin(authService), officeController.create.bind(officeController));
  router.get('/offices/:id', requireAuth(authService), officeController.getById.bind(officeController));
  router.patch('/offices/:id', requireSuperAdmin(authService), officeController.update.bind(officeController));
  router.delete('/offices/:id', requireSuperAdmin(authService), officeController.delete.bind(officeController));
  router.get('/offices/:id/stats', requireAuth(authService), officeController.getStats.bind(officeController));

  // Opportunities routes
  router.get('/opportunities', 
    requireAgent(authService),
    createCacheMiddleware(cacheService, { ttl: 300 }), // 5 minutes
    opportunityController.search.bind(opportunityController)
  );
  router.post('/opportunities', requireAgent(authService), opportunityController.create.bind(opportunityController));
  router.get('/opportunities/stats', requireAgent(authService), opportunityController.getStats.bind(opportunityController));
  router.get('/opportunities/:id', requireAgent(authService), opportunityController.getById.bind(opportunityController));
  router.patch('/opportunities/:id', requireAgent(authService), opportunityController.update.bind(opportunityController));
  router.patch('/opportunities/:id/stage', requireAgent(authService), opportunityController.updateStage.bind(opportunityController));
  router.post('/opportunities/:id/convert-to-transaction', requireAgent(authService), opportunityController.convertToTransaction.bind(opportunityController));
  router.delete('/opportunities/:id', requireManager(authService), opportunityController.delete.bind(opportunityController));

  // Clients routes
  router.get('/clients', 
    requireAgent(authService),
    createCacheMiddleware(cacheService, { ttl: 300 }), // 5 minutes
    clientController.search.bind(clientController)
  );
  router.post('/clients', requireAgent(authService), clientController.create.bind(clientController));
  router.get('/clients/stats', requireAgent(authService), clientController.getStats.bind(clientController));
  router.get('/clients/:id', requireAgent(authService), clientController.getById.bind(clientController));
  router.patch('/clients/:id', requireAgent(authService), clientController.update.bind(clientController));
  router.delete('/clients/:id', requireManager(authService), clientController.delete.bind(clientController));

  // Transactions routes
  router.get('/transactions', 
    requireAgent(authService),
    createCacheMiddleware(cacheService, { ttl: 300 }), // 5 minutes
    transactionController.search.bind(transactionController)
  );
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
  router.get('/settings', settingsController.getSettings.bind(settingsController));
  router.patch('/settings', requireSuperAdmin(authService), settingsController.updateSettings.bind(settingsController));
  router.post('/settings/background-image', requireSuperAdmin(authService), ...uploadController.uploadBackgroundImage);
  router.get('/settings/exchange-rates', settingsController.getExchangeRates.bind(settingsController));
  
  // System Settings routes
  router.get('/system-settings', requireSuperAdmin(authService), settingsController.getSystemSettings.bind(settingsController));
  router.post('/system-settings', requireSuperAdmin(authService), settingsController.updateSystemSettings.bind(settingsController));

  // Upload routes
  router.post('/upload/document', requireAuth(authService), ...uploadController.uploadDocument);
  router.post('/upload/documents', requireAuth(authService), ...uploadController.uploadDocuments);
  router.post('/upload/image', requireAuth(authService), ...uploadController.uploadImage);
  // Client documents
  router.post('/upload/client-document', requireAuth(authService), ...uploadController.uploadClientDocument);
  router.post('/upload/client-documents', requireAuth(authService), ...uploadController.uploadClientDocuments);
  router.delete('/upload/client-document/:clientId/:filename', requireAuth(authService), uploadController.deleteClientDocument.bind(uploadController));
  router.delete('/upload/document/:id', requireAuth(authService), uploadController.deleteDocument.bind(uploadController));
  router.patch('/upload/document/:id/visibility', requireAuth(authService), uploadController.updateDocumentVisibility.bind(uploadController));
  router.get('/properties/:id/documents', requireAgent(authService), propertyController.getDocuments.bind(propertyController));
  
  // Note: uploads static route is configured later with permissive cross-origin headers

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
  router.post('/users', requireAuth(authService), authController.register);
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

  // Delete user/agent
  router.delete('/users/:id', requireAuth(authService), async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req as any;

      // Only admins can delete users
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'OFFICE_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Access denied - only admins can delete users',
        });
        return;
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          officeId: true,
          _count: {
            select: {
              ownedProperties: true,
              assignedLeads: true,
              ownedOpportunities: true,
              primaryTransactions: true,
              ownedClients: true,
            },
          },
        },
      });

      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Office admins can only delete users from their office
      if (user.role === 'OFFICE_ADMIN' && targetUser.officeId !== user.officeId) {
        res.status(403).json({
          success: false,
          message: 'Access denied - can only delete users from your office',
        });
        return;
      }

      // Cannot delete yourself
      if (user.userId === id) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
        return;
      }

      // Cannot delete super admins (unless you are one)
      if (targetUser.role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Cannot delete super admin accounts',
        });
        return;
      }

      // Check if user has active data - warn but allow deletion
      const hasActiveData = 
        targetUser._count.ownedProperties > 0 ||
        targetUser._count.assignedLeads > 0 ||
        targetUser._count.ownedOpportunities > 0 ||
        targetUser._count.primaryTransactions > 0 ||
        targetUser._count.ownedClients > 0;

      if (hasActiveData) {
        // For now, we'll prevent deletion if user has active data
        // In the future, we might want to reassign or archive instead
        res.status(400).json({
          success: false,
          message: `Cannot delete ${targetUser.firstName} ${targetUser.lastName} - user has active properties, leads, transactions, or clients. Please reassign their data first.`,
          data: {
            properties: targetUser._count.ownedProperties,
            leads: targetUser._count.assignedLeads,
            opportunities: targetUser._count.ownedOpportunities,
            transactions: targetUser._count.primaryTransactions,
            clients: targetUser._count.ownedClients,
          },
        });
        return;
      }

      // Try to permanently delete the user first
      try {
        await prisma.user.delete({
          where: { id },
        });

        res.json({
          success: true,
          message: `User ${targetUser.firstName} ${targetUser.lastName} deleted successfully`,
        });
      } catch (deleteError: any) {
        // If deletion fails due to foreign key constraints, perform soft delete instead
        if (deleteError.code === 'P2003' || deleteError.message?.includes('foreign key constraint')) {
          console.log(`Cannot permanently delete user ${id}, performing soft delete instead`);
          
          // Soft delete: deactivate the user and clear sensitive data
          await prisma.user.update({
            where: { id },
            data: {
              status: 'INACTIVE',
              email: `deleted_${Date.now()}_${targetUser.email}`, // Prevent email conflicts
              phone: null,
              avatar: null,
              firstName: '[DELETED]',
              lastName: 'USER',
            },
          });

          res.json({
            success: true,
            message: `User ${targetUser.firstName} ${targetUser.lastName} has been deactivated (soft deleted) due to existing data references`,
          });
          return;
        }
        throw deleteError; // Re-throw if it's not a constraint error
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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

  // Public property search (for website) with caching
  router.get('/public/properties', 
    createPropertyCacheMiddleware(cacheService),
    async (req, res) => {
    try {
      const filters = {
        status: ['LISTED', 'SOLD', 'RENTED', 'UNDER_OFFER'] as any,
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
      if (req.query.agentId !== undefined) {
        filters.agentId = req.query.agentId as string;
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
  router.get('/public/properties/:id',
    createPropertyDetailsCacheMiddleware(cacheService),
    async (req, res) => {
    try {
      const { id } = req.params;

      const property = await prisma.property.findUnique({
        where: { 
          id, 
          status: { in: ['LISTED', 'SOLD', 'RENTED', 'UNDER_OFFER'] }
        },
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
          collaboratingAgent: {
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
          role: { in: ['AGENT', 'MANAGER', 'OFFICE_ADMIN', 'SUPER_ADMIN'] },
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

      // Transform agents to handle super admin without office
      const transformedAgents = agents.map(agent => {
        const transformed = {
          ...agent,
          // Change Super Admin name for frontend display
          firstName: agent.role === 'SUPER_ADMIN' ? 'Way Home' : agent.firstName,
          lastName: agent.role === 'SUPER_ADMIN' ? 'Real Estate' : agent.lastName,
          office: agent.office || (agent.role === 'SUPER_ADMIN' ? {
            id: 'default',
            name: 'Way Home Real Estate Zyra',
            city: 'Tirana'
          } : null)
        };
        
        if (agent.role === 'SUPER_ADMIN') {
          console.log('🏢 Super Admin transformed:', { 
            original: `${agent.firstName} ${agent.lastName}`, 
            transformed: `${transformed.firstName} ${transformed.lastName}`,
            office: transformed.office?.name 
          });
        }
        
        return transformed;
      });

      // Always return success with data array (empty if no agents)
      res.json({
        success: true,
        data: Array.isArray(transformedAgents) ? transformedAgents : [],
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

  // Upload routes
  router.post('/upload', requireAuth(authService), ...uploadController.uploadDocument);
  router.post('/upload/image', requireAuth(authService), ...uploadController.uploadImage);

  // Serve uploaded files with CORS headers and aggressive caching
  router.use('/uploads', (req, res, next) => {
    // Override security headers for uploads
    res.removeHeader('Cross-Origin-Resource-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
    
    // Set permissive CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Aggressive caching for images (1 year)
    res.header('Cache-Control', 'public, max-age=31536000, immutable');
    res.header('Expires', new Date(Date.now() + 31536000000).toUTCString());
    
    // Add ETag support for better caching
    res.header('ETag', `"${req.url}"`);
    
    next();
  }, createStaticCacheMiddleware(), express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: 31536000000, // 1 year in milliseconds
    immutable: true,
    etag: true,
    lastModified: true
  }));

  return router;
}
