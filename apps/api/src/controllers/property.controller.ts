import { Request, Response } from 'express';
import { PrismaClient, PropertyType, PropertyStatus, Currency, UserRole, TransactionType } from '@wayhome/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { SearchService } from '../services/search.service';
import { PointsService } from '../services/points.service';
import { z } from 'zod';

const createPropertySchema = z.object({
  listingType: z.nativeEnum(TransactionType).default(TransactionType.SALE),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  type: z.nativeEnum(PropertyType),
  city: z.string().min(2).max(100),
  zona: z.string().min(2).max(100),
  address: z.string().min(5).max(300),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(1).max(10),
  siperfaqeMin: z.number().min(10).max(10000),
  siperfaqeMax: z.number().min(10).max(10000),
  price: z.number().min(100).max(100000000),
  currency: z.nativeEnum(Currency).default(Currency.EUR),
  ashensor: z.boolean().default(false),
  badges: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  gallery: z.array(z.string().url()).default([]),
  virtualTourUrl: z.string().url().optional().or(z.literal('')),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  parkingSpaces: z.number().int().min(0).max(10).optional(),
  balcony: z.boolean().default(false),
  garden: z.boolean().default(false),
  agentOwnerId: z.string().optional(),
  collaboratingAgentId: z.string().optional(),
  clientId: z.string().nullable().optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const searchPropertiesSchema = z.object({
  q: z.string().optional(),
  listingType: z.nativeEnum(TransactionType).optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  zona: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  siperfaqeMin: z.coerce.number().optional(),
  siperfaqeMax: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  ashensor: z.coerce.boolean().optional(),
  badges: z.string().optional(), // comma-separated
  featured: z.coerce.boolean().optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  agentId: z.string().optional(),
  officeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

export class PropertyController {
  constructor(
    private prisma: PrismaClient,
    private searchService: SearchService,
    private pointsService: PointsService
  ) {}

  /**
   * Create new property
   * POST /api/v1/properties
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const data = createPropertySchema.parse(req.body);
      
      // Validate siperfaqe range
      if (data.siperfaqeMax < data.siperfaqeMin) {
        res.status(400).json({
          success: false,
          message: 'Maximum surface area must be greater than minimum',
        });
        return;
      }
      
      // Ensure user has office assigned
      if (!authReq.user.officeId) {
        res.status(400).json({
          success: false,
          message: 'User must be assigned to an office to create properties',
        });
        return;
      }
      
      // Validate collaborating agent if provided
      if (data.collaboratingAgentId) {
        const collaborator = await this.prisma.user.findUnique({
          where: { id: data.collaboratingAgentId },
          select: { id: true, role: true, officeId: true },
        });
        
        if (!collaborator) {
          res.status(400).json({
            success: false,
            message: 'Collaborating agent not found',
          });
          return;
        }
        
        if (!['AGENT', 'MANAGER'].includes(collaborator.role)) {
          res.status(400).json({
            success: false,
            message: 'Collaborating agent must be an agent or manager',
          });
          return;
        }
      }
      
      // Validate client if provided
      if (data.clientId) {
        const client = await this.prisma.client.findUnique({
          where: { id: data.clientId },
          select: { id: true, officeId: true },
        });
        if (!client) {
          res.status(400).json({ success: false, message: 'Client not found' });
          return;
        }
        if (authReq.user.role !== UserRole.SUPER_ADMIN && client.officeId !== authReq.user.officeId) {
          res.status(403).json({ success: false, message: 'Cannot assign client from different office' });
          return;
        }
      }

      // Create property
      const property = await this.prisma.property.create({
        data: {
          ...data,
          officeId: authReq.user.officeId,
          agentOwnerId: authReq.user.userId,
          status: PropertyStatus.LISTED,
        },
        include: {
          agentOwner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true,
            },
          },
          collaboratingAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              email: true,
            },
          },
          office: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      });
      
      // Award points for property listing
      await this.pointsService.awardPoints({
        agentId: authReq.user.userId,
        actionType: 'PROPERTY_LISTED',
        points: 5,
        meta: { propertyId: property.id },
      });
      
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create property',
      });
    }
  };

  /**
   * Get properties with search and filters
   * GET /api/v1/properties
   */
  search = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const params = searchPropertiesSchema.parse(req.query);
      
      const filters: any = {};
      // Office restriction for non-super-admins
      if (authReq.user.role !== UserRole.SUPER_ADMIN) {
        filters.officeId = authReq.user.officeId;
      } else if (params.officeId) {
        filters.officeId = params.officeId;
      }
      
      // Apply search filters
      if (params.q) filters.q = params.q; // Add search query support
      if (params.listingType) (filters as any).listingType = params.listingType;
      if (params.type) filters.type = params.type;
      if (params.city) filters.city = params.city;
      if (params.zona) filters.zona = params.zona;
      if (params.priceMin) filters.priceMin = params.priceMin;
      if (params.priceMax) filters.priceMax = params.priceMax;
      if (params.siperfaqeMin) filters.siperfaqeMin = params.siperfaqeMin;
      if (params.siperfaqeMax) filters.siperfaqeMax = params.siperfaqeMax;
      if (params.bedrooms) filters.bedrooms = params.bedrooms;
      if (params.bathrooms) filters.bathrooms = params.bathrooms;
      if (params.ashensor !== undefined) filters.ashensor = params.ashensor;
      if (params.featured !== undefined) filters.featured = params.featured;
      if (params.status) filters.status = params.status;
      if (params.badges) filters.badges = params.badges.split(',').map(b => b.trim());
      if (params.agentId) filters.agentId = params.agentId;
      
      const options = {
        limit: params.limit,
        offset: (params.page - 1) * params.limit,
        orderBy: params.orderBy,
        orderDirection: params.orderDirection,
        includeRelations: true,
      };
      
      const properties = await this.searchService.searchProperties(filters, options);
      
      // Get total count for pagination
      const totalCount = await this.prisma.property.count({
        where: this.buildWhereClause(filters, authReq),
      });
      
      res.json({
        success: true,
        data: {
          properties,
          pagination: {
            page: params.page,
            limit: params.limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / params.limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to search properties',
      });
    }
  };

  /**
   * Get single property by ID
   * GET /api/v1/properties/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      
      const property = await this.prisma.property.findUnique({
        where: { id },
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
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
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
          priceHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          views: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          documents: {
            orderBy: { createdAt: 'desc' },
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
      
      // Check office access
      if (authReq.user.role !== UserRole.SUPER_ADMIN && authReq.user.officeId !== property.officeId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this property',
        });
        return;
      }
      
      // Track view for analytics
      await this.searchService.trackPropertyView(property.id, authReq.user.userId);
      
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
  };

  /**
   * Update property
   * PATCH /api/v1/properties/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('=== PROPERTY UPDATE API ===');
      console.log('Property ID:', req.params.id);
      console.log('Request body:', req.body);
      
      const { id } = req.params;
      const authReq = req as AuthRequest;
      
      console.log('Parsing with schema...');
      const data = updatePropertySchema.parse(req.body);
      console.log('Parsed data:', data);
      
      // Find existing property
      const existingProperty = await this.prisma.property.findUnique({
        where: { id },
        select: { 
          id: true, 
          agentOwnerId: true, 
          officeId: true, 
          price: true, 
          currency: true 
        },
      });
      
      if (!existingProperty) {
        res.status(404).json({
          success: false,
          message: 'Property not found',
        });
        return;
      }
      
      // Check permissions
      const canEdit = 
        authReq.user.role === UserRole.SUPER_ADMIN ||
        (authReq.user.role === UserRole.OFFICE_ADMIN && authReq.user.officeId === existingProperty.officeId) ||
        authReq.user.userId === existingProperty.agentOwnerId;
      
      if (!canEdit) {
        res.status(403).json({
          success: false,
          message: 'Access denied to update this property',
        });
        return;
      }
      
      // Validate collaborating agent if provided
      if (data.collaboratingAgentId) {
        const collaborator = await this.prisma.user.findUnique({
          where: { id: data.collaboratingAgentId },
          select: { id: true, role: true, officeId: true },
        });
        
        if (!collaborator) {
          res.status(400).json({
            success: false,
            message: 'Collaborating agent not found',
          });
          return;
        }
        
        if (!['AGENT', 'MANAGER'].includes(collaborator.role)) {
          res.status(400).json({
            success: false,
            message: 'Collaborating agent must be an agent or manager',
          });
          return;
        }
      }
      
      // Validate client if provided (and not null)
      if (data.clientId !== undefined) {
        if (data.clientId === null) {
          // Allow clearing client assignment
        } else {
          const client = await this.prisma.client.findUnique({
            where: { id: data.clientId },
            select: { id: true, officeId: true },
          });
          if (!client) {
            res.status(400).json({ success: false, message: 'Client not found' });
            return;
          }
          if (authReq.user.role !== UserRole.SUPER_ADMIN && client.officeId !== existingProperty.officeId) {
            res.status(403).json({ success: false, message: 'Cannot assign client from different office' });
            return;
          }
        }
      }

      // Validate agentOwnerId if being changed
      if (data.agentOwnerId && data.agentOwnerId !== existingProperty.agentOwnerId) {
        const newOwner = await this.prisma.user.findUnique({
          where: { id: data.agentOwnerId },
          select: { id: true, role: true, officeId: true },
        });
        
        if (!newOwner || !['AGENT', 'MANAGER'].includes(newOwner.role)) {
          res.status(400).json({
            success: false,
            message: 'Invalid agent owner',
          });
          return;
        }
        
        // Only super admin can reassign across offices
        if (authReq.user.role !== UserRole.SUPER_ADMIN && 
            newOwner.officeId !== authReq.user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Cannot assign property to agent from different office',
          });
          return;
        }
      }
      
      // Track price changes
      if (data.price && data.price !== existingProperty.price) {
        await this.prisma.propertyPriceHistory.create({
          data: {
            propertyId: id,
            oldPrice: existingProperty.price,
            newPrice: data.price,
            currency: data.currency || existingProperty.currency,
            changedBy: authReq.user.userId,
          },
        });
      }
      
      // Update property
      const property = await this.prisma.property.update({
        where: { id },
        data,
        include: {
          agentOwner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true,
            },
          },
          collaboratingAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              email: true,
            },
          },
          office: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      });
      
      res.json({
        success: true,
        message: 'Property updated successfully',
        data: property,
      });
    } catch (error) {
      console.error('=== PROPERTY UPDATE ERROR ===');
      console.error('Error details:', error);
      
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', error.errors);
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update property',
      });
    }
  };

  /**
   * Delete property
   * DELETE /api/v1/properties/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      
      // Find existing property
      const existingProperty = await this.prisma.property.findUnique({
        where: { id },
        select: { 
          id: true, 
          agentOwnerId: true, 
          officeId: true,
          title: true,
        },
      });
      
      if (!existingProperty) {
        res.status(404).json({
          success: false,
          message: 'Property not found',
        });
        return;
      }
      
      // Check permissions
      const canDelete = 
        authReq.user.role === UserRole.SUPER_ADMIN ||
        (authReq.user.role === UserRole.OFFICE_ADMIN && authReq.user.officeId === existingProperty.officeId) ||
        authReq.user.userId === existingProperty.agentOwnerId;
      
      if (!canDelete) {
        res.status(403).json({
          success: false,
          message: 'Access denied to delete this property',
        });
        return;
      }
      
      // Delete property and related records
      await this.prisma.$transaction([
        this.prisma.propertyView.deleteMany({ where: { propertyId: id } }),
        this.prisma.propertyPriceHistory.deleteMany({ where: { propertyId: id } }),
        this.prisma.comment.deleteMany({ where: { entityType: 'PROPERTY', entityId: id } }),
        this.prisma.property.delete({ where: { id } }),
      ]);
      
      res.json({
        success: true,
        message: 'Property deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete property',
      });
    }
  };

  /**
   * Get similar properties
   * GET /api/v1/properties/:id/similar
   */
  getSimilar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 6;
      
      const similarProperties = await this.searchService.getSimilarProperties(id, limit);
      
      res.json({
        success: true,
        data: similarProperties,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get similar properties',
      });
    }
  };

  /**
   * Add or update property badges
   * POST /api/v1/properties/:id/badges
   */
  updateBadges = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { badges } = req.body;
      const authReq = req as AuthRequest;
      
      if (!Array.isArray(badges)) {
        res.status(400).json({
          success: false,
          message: 'Badges must be an array',
        });
        return;
      }
      
      // Only super admin and office admin can manage badges
      if (!['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(authReq.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to manage badges',
        });
        return;
      }
      
      const property = await this.prisma.property.update({
        where: { id },
        data: { badges },
        select: { id: true, title: true, badges: true },
      });
      
      res.json({
        success: true,
        message: 'Property badges updated successfully',
        data: property,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update property badges',
      });
    }
  };

  /**
   * Build where clause for property queries
   */
  private buildWhereClause(filters: any, authReq: AuthRequest): any {
    const where: any = {};
    
    // Office filter based on user role
    if (authReq.user.role !== UserRole.SUPER_ADMIN) {
      where.officeId = authReq.user.officeId;
    } else if (filters.officeId) {
      where.officeId = filters.officeId;
    }
    
    // Apply other filters
    if (filters.type) where.type = filters.type;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.zona) where.zona = { contains: filters.zona, mode: 'insensitive' };
    if (filters.status) where.status = filters.status;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.ashensor !== undefined) where.ashensor = filters.ashensor;
    
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.price = {};
      if (filters.priceMin !== undefined) where.price.gte = filters.priceMin;
      if (filters.priceMax !== undefined) where.price.lte = filters.priceMax;
    }
    
    if (filters.bedrooms !== undefined) where.bedrooms = { gte: filters.bedrooms };
    if (filters.bathrooms !== undefined) where.bathrooms = { gte: filters.bathrooms };
    
    if (filters.badges && filters.badges.length > 0) {
      where.badges = { hasSome: filters.badges };
    }
    
    return where;
  }

  /**
   * Get property documents
   * GET /api/v1/properties/:id/documents
   */
  getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;

      // Verify property exists and user has access
      const property = await this.prisma.property.findUnique({
        where: { id },
        select: { 
          id: true, 
          officeId: true, 
          agentOwnerId: true, 
          collaboratingAgentId: true 
        },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          message: 'Property not found',
        });
        return;
      }

      // Check access permissions
      const hasAccess = authReq.user.role === UserRole.SUPER_ADMIN ||
                       (authReq.user.role === UserRole.OFFICE_ADMIN && authReq.user.officeId === property.officeId) ||
                       authReq.user.userId === property.agentOwnerId ||
                       authReq.user.userId === property.collaboratingAgentId;

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Get documents
      const documents = await this.prisma.propertyDocument.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error('Failed to get property documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get property documents',
      });
    }
  };
}
