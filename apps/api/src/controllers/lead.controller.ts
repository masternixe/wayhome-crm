import { Request, Response } from 'express';
import { PrismaClient, LeadStatus, UserRole } from '@wayhome/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { PointsService } from '../services/points.service';
import { z } from 'zod';

const createLeadSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  mobile: z.string().min(8).max(20),
  email: z.string().email().optional(),
  rikontakt: z.string().datetime().optional(),
  assignedToId: z.string().nullable().optional(),
  industry: z.string().max(100).optional(),
  leadSource: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
});

const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.nativeEnum(LeadStatus).optional(),
});

const searchLeadsSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  assignedToId: z.string().optional(),
  industry: z.string().optional(),
  leadSource: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  orderBy: z.string().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

export class LeadController {
  constructor(
    private prisma: PrismaClient,
    private pointsService: PointsService
  ) {}

  /**
   * Create new lead
   * POST /api/v1/leads
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      console.log('🔍 Creating lead with data:', req.body);
      
      const data = createLeadSchema.parse(req.body);
      
      // Ensure user has office assigned (except for SUPER_ADMIN)
      if (!authReq.user.officeId && authReq.user.role !== 'SUPER_ADMIN') {
        console.log('❌ User has no office assigned:', authReq.user);
        res.status(400).json({
          success: false,
          message: 'User must be assigned to an office to create leads',
        });
        return;
      }
      
      console.log('✅ User office check passed or bypassed for SUPER_ADMIN:', authReq.user.officeId || 'N/A (SUPER_ADMIN)');
      
      // Generate lead number
      const whereCondition = authReq.user.officeId ? { officeId: authReq.user.officeId } : {};
      const leadCount = await this.prisma.lead.count({ where: whereCondition });
      const leadNumber = `L${String(leadCount + 1).padStart(6, '0')}`;
      
      // Allow creating unassigned leads (optional assignment)
      const assignedToId = data.assignedToId || null;
      
      // For SUPER_ADMIN without office, get the first available office
      let targetOfficeId = authReq.user.officeId;
      if (!targetOfficeId && authReq.user.role === 'SUPER_ADMIN') {
        const firstOffice = await this.prisma.office.findFirst({
          select: { id: true, name: true }
        });
        if (firstOffice) {
          targetOfficeId = firstOffice.id;
          console.log(`🏢 SUPER_ADMIN assigned to first office: ${firstOffice.name} (${firstOffice.id})`);
        } else {
          res.status(400).json({
            success: false,
            message: 'No office available in the system. Please create an office first.',
          });
          return;
        }
      }
      
      // Validate assigned agent (if specified)
      if (assignedToId) {
        const assignedAgent = await this.prisma.user.findUnique({
          where: { id: assignedToId },
          select: { id: true, role: true, officeId: true },
        });
        
        if (!assignedAgent) {
          res.status(400).json({
            success: false,
            message: 'Assigned agent not found',
          });
          return;
        }
        
        // Allow SUPER_ADMIN, OFFICE_ADMIN, MANAGER, and AGENT to be assigned leads
        if (![UserRole.AGENT, UserRole.MANAGER, UserRole.OFFICE_ADMIN, UserRole.SUPER_ADMIN].includes(assignedAgent.role)) {
          res.status(400).json({
            success: false,
            message: 'Lead can only be assigned to agents, managers, or admins',
          });
          return;
        }
        
        // Check if agent belongs to same office (unless super admin)
        if (authReq.user.role !== UserRole.SUPER_ADMIN && 
            assignedAgent.officeId !== authReq.user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Cannot assign lead to agent from different office',
          });
          return;
        }
      }
      
      // Create lead
      const lead = await this.prisma.lead.create({
        data: {
          ...data,
          leadNumber,
          officeId: targetOfficeId,
          assignedToId,
          rikontakt: data.rikontakt ? new Date(data.rikontakt) : null,
          status: LeadStatus.NEW,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              phone: true,
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
      
      // Award points for lead creation (only for agents and managers)
      if (assignedToId) {
        const assignedUser = await this.prisma.user.findUnique({
          where: { id: assignedToId },
          select: { role: true }
        });
        
        if (assignedUser && [UserRole.AGENT, UserRole.MANAGER].includes(assignedUser.role)) {
          await this.pointsService.awardPoints({
            agentId: assignedToId,
            actionType: 'LEAD_CREATED',
            points: 1,
            meta: { leadId: lead.id },
          });
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error) {
      console.error('❌ Lead creation error:', error);
      
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        console.log('🔍 Validation errors:', validationErrors);
        
        res.status(400).json({
          success: false,
          message: `Validation error: ${validationErrors}`,
          errors: error.errors,
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create lead',
      });
    }
  };

  /**
   * Get leads with search and filters
   * GET /api/v1/leads
   */
  search = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const params = searchLeadsSchema.parse(req.query);
      
      const where: any = {};
      
      // Office filter based on user role
      if (authReq.user.role !== UserRole.SUPER_ADMIN) {
        where.officeId = authReq.user.officeId;
      }
      
      // Agent filter - agents can only see their own leads
      if (authReq.user.role === UserRole.AGENT) {
        where.assignedToId = authReq.user.userId;
      } else if (params.assignedToId) {
        if (params.assignedToId === 'unassigned') {
          where.assignedToId = null; // Filter for unassigned leads
        } else {
          where.assignedToId = params.assignedToId;
        }
      }
      
      // Apply search filters
      if (params.q) {
        // If we already have assignedToId filter, combine with AND
        if (where.assignedToId !== undefined) {
          where.AND = [
            { assignedToId: where.assignedToId },
            {
              OR: [
                { firstName: { contains: params.q, mode: 'insensitive' } },
                { lastName: { contains: params.q, mode: 'insensitive' } },
                { mobile: { contains: params.q, mode: 'insensitive' } },
                { email: { contains: params.q, mode: 'insensitive' } },
                { leadNumber: { contains: params.q, mode: 'insensitive' } },
              ]
            }
          ];
          delete where.assignedToId; // Remove the direct property since it's now in AND
        } else {
          where.OR = [
            { firstName: { contains: params.q, mode: 'insensitive' } },
            { lastName: { contains: params.q, mode: 'insensitive' } },
            { mobile: { contains: params.q, mode: 'insensitive' } },
            { email: { contains: params.q, mode: 'insensitive' } },
            { leadNumber: { contains: params.q, mode: 'insensitive' } },
          ];
        }
      }
      
      if (params.status) where.status = params.status;
      if (params.industry) where.industry = { contains: params.industry, mode: 'insensitive' };
      if (params.leadSource) where.leadSource = { contains: params.leadSource, mode: 'insensitive' };
      
      // Date range filter
      if (params.dateFrom || params.dateTo) {
        where.createdAt = {};
        if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
        if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
      }
      
      const [leads, totalCount] = await Promise.all([
        this.prisma.lead.findMany({
          where,
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                phone: true,
              },
            },
            office: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
            _count: {
              select: {
                tasks: true,
                opportunities: true,
              },
            },
          },
          orderBy: { [params.orderBy]: params.orderDirection },
          take: params.limit,
          skip: (params.page - 1) * params.limit,
        }),
        this.prisma.lead.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          leads,
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
        message: 'Failed to search leads',
      });
    }
  };

  /**
   * Get single lead by ID
   * GET /api/v1/leads/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      
      const lead = await this.prisma.lead.findUnique({
        where: { id },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              phone: true,
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
          opportunities: {
            include: {
              interestedProperty: {
                select: {
                  id: true,
                  title: true,
                  city: true,
                  zona: true,
                  price: true,
                  currency: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          tasks: {
            where: { status: 'OPEN' },
            orderBy: { dueDate: 'asc' },
            take: 10,
          },
        },
      });
      
      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
        return;
      }
      
      // Check access permissions
      if (authReq.user.role !== UserRole.SUPER_ADMIN && 
          authReq.user.officeId !== lead.officeId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this lead',
        });
        return;
      }
      
      if (authReq.user.role === UserRole.AGENT && 
          authReq.user.userId !== lead.assignedToId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this lead',
        });
        return;
      }
      
      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get lead',
      });
    }
  };

  /**
   * Update lead
   * PATCH /api/v1/leads/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const data = updateLeadSchema.parse(req.body);
      
      // Find existing lead
      const existingLead = await this.prisma.lead.findUnique({
        where: { id },
        select: { 
          id: true, 
          assignedToId: true, 
          officeId: true,
          status: true,
        },
      });
      
      if (!existingLead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
        return;
      }
      
      // Check permissions
      const canEdit = 
        authReq.user.role === UserRole.SUPER_ADMIN ||
        (authReq.user.role === UserRole.OFFICE_ADMIN && authReq.user.officeId === existingLead.officeId) ||
        (authReq.user.role === UserRole.MANAGER && authReq.user.officeId === existingLead.officeId) ||
        authReq.user.userId === existingLead.assignedToId;
      
      if (!canEdit) {
        res.status(403).json({
          success: false,
          message: 'Access denied to update this lead',
        });
        return;
      }
      
      // Validate assignedToId if being changed
      if (data.assignedToId && data.assignedToId !== existingLead.assignedToId) {
        const newAssignee = await this.prisma.user.findUnique({
          where: { id: data.assignedToId },
          select: { id: true, role: true, officeId: true },
        });
        
        if (!newAssignee || ![UserRole.AGENT, UserRole.MANAGER].includes(newAssignee.role)) {
          res.status(400).json({
            success: false,
            message: 'Invalid assignee',
          });
          return;
        }
        
        if (authReq.user.role !== UserRole.SUPER_ADMIN && 
            newAssignee.officeId !== authReq.user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Cannot assign lead to agent from different office',
          });
          return;
        }
      }
      
      // Update lead
      const updateData: any = { ...data };
      if (data.rikontakt) {
        updateData.rikontakt = new Date(data.rikontakt);
      }
      
      const lead = await this.prisma.lead.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              phone: true,
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
        message: 'Lead updated successfully',
        data: lead,
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
        message: error instanceof Error ? error.message : 'Failed to update lead',
      });
    }
  };

  /**
   * Delete lead
   * DELETE /api/v1/leads/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      
      // Find existing lead
      const existingLead = await this.prisma.lead.findUnique({
        where: { id },
        select: { 
          id: true, 
          assignedToId: true, 
          officeId: true,
          leadNumber: true,
        },
      });
      
      if (!existingLead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
        return;
      }
      
      // Check permissions - only managers and above can delete leads
      const canDelete = 
        authReq.user.role === UserRole.SUPER_ADMIN ||
        (authReq.user.role === UserRole.OFFICE_ADMIN && authReq.user.officeId === existingLead.officeId) ||
        (authReq.user.role === UserRole.MANAGER && authReq.user.officeId === existingLead.officeId);
      
      if (!canDelete) {
        res.status(403).json({
          success: false,
          message: 'Access denied to delete this lead',
        });
        return;
      }
      
      // Delete lead and related records
      await this.prisma.$transaction([
        this.prisma.comment.deleteMany({ where: { entityType: 'LEAD', entityId: id } }),
        this.prisma.task.deleteMany({ where: { relatedToType: 'LEAD', relatedToId: id } }),
        this.prisma.lead.delete({ where: { id } }),
      ]);
      
      res.json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete lead',
      });
    }
  };

  /**
   * Convert lead to opportunity
   * POST /api/v1/leads/:id/convert
   */
  convertToOpportunity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { clientId, interestedPropertyId, notes, estimatedValue } = req.body;
      const authReq = req as AuthRequest;
      
      // Find existing lead
      const lead = await this.prisma.lead.findUnique({
        where: { id },
        select: { 
          id: true, 
          assignedToId: true, 
          officeId: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
        },
      });
      
      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
        return;
      }
      
      // Check permissions
      const canConvert = 
        authReq.user.role === UserRole.SUPER_ADMIN ||
        (authReq.user.role === UserRole.OFFICE_ADMIN && authReq.user.officeId === lead.officeId) ||
        (authReq.user.role === UserRole.MANAGER && authReq.user.officeId === lead.officeId) ||
        authReq.user.userId === lead.assignedToId;
      
      if (!canConvert) {
        res.status(403).json({
          success: false,
          message: 'Access denied to convert this lead',
        });
        return;
      }
      
      let finalClientId = clientId;
      
      // Create client if not provided
      if (!finalClientId) {
        const client = await this.prisma.client.create({
          data: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            mobile: lead.mobile,
            email: lead.email,
            ownerAgentId: lead.assignedToId,
            officeId: lead.officeId,
          },
        });
        finalClientId = client.id;
      }
      
      // Create opportunity
      const opportunity = await this.prisma.opportunity.create({
        data: {
          officeId: lead.officeId,
          clientId: finalClientId,
          leadId: lead.id,
          ownerAgentId: lead.assignedToId, // Preserve agent ownership from lead
          interestedPropertyId,
          notes,
          estimatedValue,
          stage: 'PROSPECT',
        },
        include: {
          client: true,
          interestedProperty: {
            select: {
              id: true,
              title: true,
              city: true,
              zona: true,
              price: true,
              currency: true,
            },
          },
        },
      });
      
      // Update lead status to converted
      await this.prisma.lead.update({
        where: { id },
        data: { status: LeadStatus.CONVERTED },
      });
      
      res.json({
        success: true,
        message: 'Lead converted to opportunity successfully',
        data: opportunity,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to convert lead to opportunity',
      });
    }
  };

  /**
   * Get lead statistics
   * GET /api/v1/leads/stats
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { period = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const where: any = {
        createdAt: { gte: startDate },
      };
      
      // Apply office filter
      if (authReq.user.role !== UserRole.SUPER_ADMIN) {
        where.officeId = authReq.user.officeId;
      }
      
      // Apply agent filter for agents
      if (authReq.user.role === UserRole.AGENT) {
        where.assignedToId = authReq.user.userId;
      }
      
      const [
        totalLeads,
        statusCounts,
        sourceCounts,
        conversionRate
      ] = await Promise.all([
        this.prisma.lead.count({ where }),
        this.prisma.lead.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
        this.prisma.lead.groupBy({
          by: ['leadSource'],
          where: { ...where, leadSource: { not: null } },
          _count: { leadSource: true },
          orderBy: { _count: { leadSource: 'desc' } },
          take: 5,
        }),
        this.prisma.lead.count({
          where: { ...where, status: LeadStatus.CONVERTED },
        }),
      ]);
      
      res.json({
        success: true,
        data: {
          totalLeads,
          conversionRate: totalLeads > 0 ? (conversionRate / totalLeads * 100) : 0,
          statusBreakdown: statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
          topSources: sourceCounts.map(item => ({
            source: item.leadSource,
            count: item._count.leadSource,
          })),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get lead statistics',
      });
    }
  };
}
