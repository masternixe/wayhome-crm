import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';
import { z } from 'zod';

const createOpportunitySchema = z.object({
  clientId: z.string(),
  leadId: z.string().optional(),
  interestedPropertyId: z.string().optional(),
  ownerAgentId: z.string().optional(),
  stage: z.enum(['PROSPECT', 'NEGOTIATION', 'OFFER', 'WON', 'LOST']),
  estimatedValue: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateOpportunitySchema = createOpportunitySchema.partial();

export class OpportunityController {
  constructor(private prisma: PrismaClient) {}

  async search(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { 
        stage, 
        clientId, 
        leadId, 
        propertyId,
        ownerAgentId,
        minValue,
        maxValue,
        limit = 20, 
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build where clause based on user role and filters
      const where: any = {};

      // Office filter - non-super-admins can only see opportunities from their office
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      // Stage filter
      if (stage) {
        where.stage = stage;
      }

      // Client filter
      if (clientId) {
        where.clientId = clientId;
      }

      // Lead filter
      if (leadId) {
        where.leadId = leadId;
      }

      // Property filter
      if (propertyId) {
        where.interestedPropertyId = propertyId;
      }

      // Build conditions array for complex filtering
      const conditions = [];

      // Owner agent filter via client ownership
      if (ownerAgentId) {
        conditions.push({ client: { ownerAgentId } });
      }

      // Agent filter - agents can only see opportunities they own or for clients they own
      if (user.role === 'AGENT') {
        conditions.push({
          OR: [
            { ownerAgentId: user.userId },
            { client: { ownerAgentId: user.userId } }
          ]
        });
      }

      // Combine conditions with AND
      if (conditions.length > 0) {
        where.AND = conditions;
      }

      // Value range filter
      if (minValue || maxValue) {
        where.estimatedValue = {};
        if (minValue) where.estimatedValue.gte = Number(minValue);
        if (maxValue) where.estimatedValue.lte = Number(maxValue);
      }

      const opportunities = await this.prisma.opportunity.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              leadNumber: true,
            },
          },
          ownerAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          interestedProperty: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
              type: true,
              bedrooms: true,
              bathrooms: true,
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
              transactions: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await this.prisma.opportunity.count({ where });

      res.json({
        success: true,
        data: {
          opportunities,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
          },
        },
      });
    } catch (error) {
      console.error('Failed to search opportunities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search opportunities',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      const where: any = { id };

      // Office filter for non-super-admins
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const opportunity = await this.prisma.opportunity.findUnique({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              email: true,
              preferredCurrency: true,
              ownerAgentId: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              leadNumber: true,
              mobile: true,
              email: true,
            },
          },
          interestedProperty: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
              currency: true,
              type: true,
              bedrooms: true,
              bathrooms: true,
              siperfaqeMin: true,
              siperfaqeMax: true,
              gallery: true,
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
          ownerAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              dueDate: 'asc',
            },
          },
          transactions: {
            select: {
              id: true,
              type: true,
              status: true,
              grossAmount: true,
              commissionAmount: true,
              currency: true,
              closeDate: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!opportunity) {
        res.status(404).json({
          success: false,
          message: 'Opportunity not found',
        });
        return;
      }

      res.json({
        success: true,
        data: opportunity,
      });
    } catch (error) {
      console.error('Failed to get opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get opportunity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const validation = createOpportunitySchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Verify client belongs to user's office (for non-super-admins)
      if (user.role !== 'SUPER_ADMIN') {
        const client = await this.prisma.client.findUnique({
          where: { id: data.clientId },
          select: { officeId: true },
        });

        if (!client || client.officeId !== user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Access denied - client not in your office',
          });
          return;
        }
      }

      const opportunity = await this.prisma.opportunity.create({
        data: {
          ...data,
          officeId: user.officeId,
          expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              leadNumber: true,
            },
          },
          ownerAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          interestedProperty: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
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

      res.status(201).json({
        success: true,
        data: opportunity,
      });
    } catch (error) {
      console.error('Failed to create opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create opportunity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const validation = updateOpportunitySchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Check if opportunity exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const existingOpportunity = await this.prisma.opportunity.findUnique({
        where,
        select: { id: true },
      });

      if (!existingOpportunity) {
        res.status(404).json({
          success: false,
          message: 'Opportunity not found or access denied',
        });
        return;
      }

      const opportunity = await this.prisma.opportunity.update({
        where: { id },
        data: {
          ...data,
          expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              leadNumber: true,
            },
          },
          ownerAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          interestedProperty: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
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
        data: opportunity,
      });
    } catch (error) {
      console.error('Failed to update opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update opportunity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Check if opportunity exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const existingOpportunity = await this.prisma.opportunity.findUnique({
        where,
        select: { id: true },
      });

      if (!existingOpportunity) {
        res.status(404).json({
          success: false,
          message: 'Opportunity not found or access denied',
        });
        return;
      }

      await this.prisma.opportunity.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Opportunity deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete opportunity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateStage(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const { stage } = req.body;

      if (!['PROSPECT', 'NEGOTIATION', 'OFFER', 'WON', 'LOST'].includes(stage)) {
        res.status(400).json({
          success: false,
          message: 'Invalid stage value',
        });
        return;
      }

      // Check if opportunity exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const existingOpportunity = await this.prisma.opportunity.findUnique({
        where,
        select: { id: true },
      });

      if (!existingOpportunity) {
        res.status(404).json({
          success: false,
          message: 'Opportunity not found or access denied',
        });
        return;
      }

      const opportunity = await this.prisma.opportunity.update({
        where: { id },
        data: { stage },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: opportunity,
      });
    } catch (error) {
      console.error('Failed to update opportunity stage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update opportunity stage',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { user } = req as any;
      
      const where: any = {};
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const [
        totalOpportunities,
        prospectCount,
        negotiationCount,
        offerCount,
        wonCount,
        lostCount,
        totalValue,
        avgProbability,
      ] = await Promise.all([
        this.prisma.opportunity.count({ where }),
        this.prisma.opportunity.count({ where: { ...where, stage: 'PROSPECT' } }),
        this.prisma.opportunity.count({ where: { ...where, stage: 'NEGOTIATION' } }),
        this.prisma.opportunity.count({ where: { ...where, stage: 'OFFER' } }),
        this.prisma.opportunity.count({ where: { ...where, stage: 'WON' } }),
        this.prisma.opportunity.count({ where: { ...where, stage: 'LOST' } }),
        this.prisma.opportunity.aggregate({
          where,
          _sum: { estimatedValue: true },
        }),
        this.prisma.opportunity.aggregate({
          where,
          _avg: { probability: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalOpportunities,
          stageBreakdown: {
            prospect: prospectCount,
            negotiation: negotiationCount,
            offer: offerCount,
            won: wonCount,
            lost: lostCount,
          },
          totalEstimatedValue: totalValue._sum.estimatedValue || 0,
          averageProbability: Math.round(avgProbability._avg.probability || 0),
          conversionRate: totalOpportunities > 0 ? Math.round((wonCount / totalOpportunities) * 100) : 0,
        },
      });
    } catch (error) {
      console.error('Failed to get opportunity stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get opportunity stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Convert opportunity to transaction
   * POST /api/v1/opportunities/:id/convert-to-transaction
   */
  convertToTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const { 
        type, 
        grossAmount, 
        commissionAmount,
        collaboratingAgentId,
        splitRatio = 0.5,
        currency = 'EUR',
        notes 
      } = req.body;

      // Validate required fields
      if (!type || !grossAmount || !commissionAmount) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: type, grossAmount, commissionAmount',
        });
        return;
      }

      // Get opportunity with related data
      const opportunity = await this.prisma.opportunity.findFirst({
        where: { 
          id,
          ...(user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {})
        },
        include: {
          client: true,
          interestedProperty: true,
          ownerAgent: true,
        },
      });

      if (!opportunity) {
        res.status(404).json({
          success: false,
          message: 'Opportunity not found or access denied',
        });
        return;
      }

      if (!opportunity.interestedProperty) {
        res.status(400).json({
          success: false,
          message: 'Cannot create transaction: opportunity must have an interested property',
        });
        return;
      }

      // Calculate commission splits based on new structure
      // Super Admin always gets 50% of commission
      const superAdminShare = commissionAmount * 0.5;
      
      // Remaining 50% is split between agents
      const remainingCommission = commissionAmount * 0.5;
      
      let agentSharePrimary: number;
      let agentShareCollaborator: number | null = null;
      
      if (collaboratingAgentId) {
        // If there's a collaborating agent, split the remaining 50% equally (25% each)
        agentSharePrimary = remainingCommission * 0.5; // 25% of total
        agentShareCollaborator = remainingCommission * 0.5; // 25% of total
      } else {
        // If no collaborating agent, primary agent gets all remaining 50%
        agentSharePrimary = remainingCommission; // 50% of total
      }

      // Create transaction with agent from opportunity
      const transaction = await this.prisma.transaction.create({
        data: {
          type,
          officeId: opportunity.officeId,
          propertyId: opportunity.interestedProperty.id,
          clientId: opportunity.clientId,
          opportunityId: opportunity.id,
          primaryAgentId: opportunity.ownerAgentId || user.userId, // Use opportunity agent or fallback to current user
          collaboratingAgentId,
          splitRatio,
          grossAmount,
          commissionAmount,
          superAdminShare,
          agentSharePrimary,
          agentShareCollaborator,
          currency,
          notes,
          status: 'OPEN',
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
              currency: true,
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
          primaryAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          collaboratingAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              stage: true,
              estimatedValue: true,
            },
          },
        },
      });

      // Update opportunity stage to WON
      await this.prisma.opportunity.update({
        where: { id },
        data: { stage: 'WON' },
      });

      res.status(201).json({
        success: true,
        message: 'Opportunity converted to transaction successfully',
        data: transaction,
      });
    } catch (error) {
      console.error('Failed to convert opportunity to transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert opportunity to transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
