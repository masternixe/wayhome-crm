import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';
import { z } from 'zod';

const createTransactionSchema = z.object({
  type: z.enum(['SALE', 'RENT']),
  propertyId: z.string(),
  clientId: z.string(),
  opportunityId: z.string().optional(),
  primaryAgentId: z.string(),
  collaboratingAgentId: z.string().optional(),
  splitRatio: z.number().min(0).max(1).default(0.5),
  grossAmount: z.number().positive(),
  commissionAmount: z.number().positive(),
  currency: z.enum(['EUR', 'ALL']).default('EUR'),
  closeDate: z.string().optional(),
  contractNumber: z.string().optional(),
  notes: z.string().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'CLOSED', 'CANCELLED']),
});

export class TransactionController {
  constructor(private prisma: PrismaClient) {}

  async search(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { 
        type,
        status,
        propertyId,
        clientId,
        primaryAgentId,
        collaboratingAgentId,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        limit = 20, 
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build where clause based on user role and filters
      const where: any = {};

      // Office filter - non-super-admins can only see transactions from their office
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      // Agent filter - agents can only see transactions they're involved in
      if (user.role === 'AGENT') {
        where.OR = [
          { primaryAgentId: user.userId },
          { collaboratingAgentId: user.userId },
        ];
      }

      // Type filter
      if (type) {
        where.type = type;
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // Property filter
      if (propertyId) {
        where.propertyId = propertyId;
      }

      // Client filter
      if (clientId) {
        where.clientId = clientId;
      }

      // Agent filters
      if (primaryAgentId) {
        where.primaryAgentId = primaryAgentId;
      }
      if (collaboratingAgentId) {
        where.collaboratingAgentId = collaboratingAgentId;
      }

      // Amount range filter
      if (minAmount || maxAmount) {
        where.grossAmount = {};
        if (minAmount) where.grossAmount.gte = Number(minAmount);
        if (maxAmount) where.grossAmount.lte = Number(maxAmount);
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const transactions = await this.prisma.transaction.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              zona: true,
              price: true,
              type: true,
              bedrooms: true,
              bathrooms: true,
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
          opportunity: {
            select: {
              id: true,
              stage: true,
              estimatedValue: true,
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
          office: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await this.prisma.transaction.count({ where });

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
          },
        },
      });
    } catch (error) {
      console.error('Failed to search transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search transactions',
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

      // Agent filter - agents can only see transactions they're involved in
      if (user.role === 'AGENT') {
        where.OR = [
          { primaryAgentId: user.userId },
          { collaboratingAgentId: user.userId },
        ];
      }

      const transaction = await this.prisma.transaction.findFirst({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              description: true,
              address: true,
              city: true,
              zona: true,
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
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
              email: true,
              preferredCurrency: true,
              notes: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              stage: true,
              estimatedValue: true,
              probability: true,
              notes: true,
            },
          },
          primaryAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          collaboratingAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
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
          documents: {
            orderBy: {
              createdAt: 'desc',
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
        },
      });

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found or access denied',
        });
        return;
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error('Failed to get transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const validation = createTransactionSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Verify property, client, and agents belong to user's office (for non-super-admins)
      if (user.role !== 'SUPER_ADMIN') {
        const [property, client, primaryAgent] = await Promise.all([
          this.prisma.property.findUnique({
            where: { id: data.propertyId },
            select: { officeId: true },
          }),
          this.prisma.client.findUnique({
            where: { id: data.clientId },
            select: { officeId: true },
          }),
          this.prisma.user.findUnique({
            where: { id: data.primaryAgentId },
            select: { officeId: true },
          }),
        ]);

        if (!property || property.officeId !== user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Property not found in your office',
          });
          return;
        }

        if (!client || client.officeId !== user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Client not found in your office',
          });
          return;
        }

        if (!primaryAgent || primaryAgent.officeId !== user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Primary agent not found in your office',
          });
          return;
        }

        // Check collaborating agent if provided
        if (data.collaboratingAgentId) {
          const collaboratingAgent = await this.prisma.user.findUnique({
            where: { id: data.collaboratingAgentId },
            select: { officeId: true },
          });

          if (!collaboratingAgent || collaboratingAgent.officeId !== user.officeId) {
            res.status(403).json({
              success: false,
              message: 'Collaborating agent not found in your office',
            });
            return;
          }
        }
      }

      // Calculate commission splits based on new structure
      // Super Admin always gets 50% of commission
      const superAdminShare = data.commissionAmount * 0.5;
      
      // Remaining 50% is split between agents
      const remainingCommission = data.commissionAmount * 0.5;
      
      let agentSharePrimary: number;
      let agentShareCollaborator: number | null = null;
      
      if (data.collaboratingAgentId) {
        // If there's a collaborating agent, split the remaining 50% equally (25% each)
        agentSharePrimary = remainingCommission * 0.5; // 25% of total
        agentShareCollaborator = remainingCommission * 0.5; // 25% of total
      } else {
        // If no collaborating agent, primary agent gets all remaining 50%
        agentSharePrimary = remainingCommission; // 50% of total
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          ...data,
          officeId: user.officeId,
          closeDate: data.closeDate ? new Date(data.closeDate) : null,
          status: 'OPEN',
          superAdminShare,
          agentSharePrimary,
          agentShareCollaborator,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
            },
          },
          primaryAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          collaboratingAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          office: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const validation = updateTransactionSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Check if transaction exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      if (user.role === 'AGENT') {
        where.OR = [
          { primaryAgentId: user.userId },
          { collaboratingAgentId: user.userId },
        ];
      }

      const existingTransaction = await this.prisma.transaction.findFirst({
        where,
        select: { id: true, status: true },
      });

      if (!existingTransaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found or access denied',
        });
        return;
      }

      // Don't allow updates to closed transactions
      if (existingTransaction.status === 'CLOSED') {
        res.status(400).json({
          success: false,
          message: 'Cannot update a closed transaction',
        });
        return;
      }

      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: {
          ...data,
          closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobile: true,
            },
          },
          primaryAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          collaboratingAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          office: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const validation = updateStatusSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid status',
          errors: validation.error.errors,
        });
        return;
      }

      const { status } = validation.data;

      // Check if transaction exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      if (user.role === 'AGENT') {
        where.OR = [
          { primaryAgentId: user.userId },
          { collaboratingAgentId: user.userId },
        ];
      }

      const existingTransaction = await this.prisma.transaction.findFirst({
        where,
        select: { id: true, status: true },
      });

      if (!existingTransaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found or access denied',
        });
        return;
      }

      // If closing the transaction, set close date
      const updateData: any = { status };
      if (status === 'CLOSED' && existingTransaction.status !== 'CLOSED') {
        updateData.closeDate = new Date();
      }

      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: updateData,
        include: {
          property: {
            select: {
              id: true,
              title: true,
            },
          },
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
        data: transaction,
      });
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Only managers and above can delete transactions
      if (!['MANAGER', 'OFFICE_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete transactions',
        });
        return;
      }

      // Check if transaction exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const existingTransaction = await this.prisma.transaction.findFirst({
        where,
        select: { id: true, status: true },
      });

      if (!existingTransaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found or access denied',
        });
        return;
      }

      // Don't allow deletion of closed transactions
      if (existingTransaction.status === 'CLOSED') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete a closed transaction',
        });
        return;
      }

      await this.prisma.transaction.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
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
      if (user.role === 'AGENT') {
        where.OR = [
          { primaryAgentId: user.userId },
          { collaboratingAgentId: user.userId },
        ];
      }

      const [
        totalTransactions,
        openCount,
        pendingCount,
        closedCount,
        cancelledCount,
        totalRevenue,
        totalCommission,
        avgTransactionValue,
        salesCount,
        rentalsCount,
      ] = await Promise.all([
        this.prisma.transaction.count({ where }),
        this.prisma.transaction.count({ where: { ...where, status: 'OPEN' } }),
        this.prisma.transaction.count({ where: { ...where, status: 'PENDING' } }),
        this.prisma.transaction.count({ where: { ...where, status: 'CLOSED' } }),
        this.prisma.transaction.count({ where: { ...where, status: 'CANCELLED' } }),
        this.prisma.transaction.aggregate({
          where: { ...where, status: 'CLOSED' },
          _sum: { grossAmount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, status: 'CLOSED' },
          _sum: { commissionAmount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, status: 'CLOSED' },
          _avg: { grossAmount: true },
        }),
        this.prisma.transaction.count({ where: { ...where, type: 'SALE' } }),
        this.prisma.transaction.count({ where: { ...where, type: 'RENT' } }),
      ]);

      res.json({
        success: true,
        data: {
          totalTransactions,
          statusBreakdown: {
            open: openCount,
            pending: pendingCount,
            closed: closedCount,
            cancelled: cancelledCount,
          },
          typeBreakdown: {
            sales: salesCount,
            rentals: rentalsCount,
          },
          financials: {
            totalRevenue: totalRevenue._sum.grossAmount || 0,
            totalCommission: totalCommission._sum.commissionAmount || 0,
            averageTransactionValue: Math.round(avgTransactionValue._avg.grossAmount || 0),
          },
          conversionRate: totalTransactions > 0 ? Math.round((closedCount / totalTransactions) * 100) : 0,
        },
      });
    } catch (error) {
      console.error('Failed to get transaction stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
