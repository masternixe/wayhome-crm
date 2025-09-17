import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';
import { z } from 'zod';

const createClientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobile: z.string().min(1),
  email: z.string().email().optional(),
  preferredCurrency: z.enum(['EUR', 'ALL']).default('EUR'),
  notes: z.string().optional(),
  ownerAgentId: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

export class ClientController {
  constructor(private prisma: PrismaClient) {}

  async search(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { 
        search,
        ownerAgentId,
        preferredCurrency,
        limit = 20, 
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build where clause based on user role and filters
      const where: any = {};

      // Office filter - non-super-admins can only see clients from their office
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      // Agent filter - agents can only see their own clients unless they're managers+
      if (user.role === 'AGENT') {
        where.ownerAgentId = user.userId;
      } else if (ownerAgentId) {
        where.ownerAgentId = ownerAgentId;
      }

      // Search filter
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Currency filter
      if (preferredCurrency) {
        where.preferredCurrency = preferredCurrency;
      }

      const clients = await this.prisma.client.findMany({
        where,
        include: {
          ownerAgent: {
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
          _count: {
            select: {
              opportunities: true,
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

      // Calculate additional stats for each client
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          const [lastActivity, totalSpent] = await Promise.all([
            this.prisma.opportunity.findFirst({
              where: { clientId: client.id },
              orderBy: { updatedAt: 'desc' },
              select: { updatedAt: true },
            }),
            this.prisma.transaction.aggregate({
              where: { clientId: client.id },
              _sum: { grossAmount: true },
            }),
          ]);

          return {
            ...client,
            lastActivity: lastActivity?.updatedAt || client.createdAt,
            totalSpent: totalSpent._sum.grossAmount || 0,
          };
        })
      );

      const total = await this.prisma.client.count({ where });

      res.json({
        success: true,
        data: {
          clients: clientsWithStats,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
          },
        },
      });
    } catch (error) {
      console.error('Failed to search clients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search clients',
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

      // Agent filter - agents can only see their own clients unless they're managers+
      if (user.role === 'AGENT') {
        where.ownerAgentId = user.userId;
      }

      const client = await this.prisma.client.findUnique({
        where,
        include: {
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
          office: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              phone: true,
            },
          },
          properties: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
              currency: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          opportunities: {
            include: {
              interestedProperty: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  price: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          transactions: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                },
              },
              primaryAgent: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
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

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found or access denied',
        });
        return;
      }

      // Calculate additional stats
      const totalSpent = await this.prisma.transaction.aggregate({
        where: { clientId: client.id },
        _sum: { grossAmount: true },
      });

      const lastActivity = client.opportunities.length > 0 
        ? client.opportunities[0].updatedAt 
        : client.createdAt;

      res.json({
        success: true,
        data: {
          ...client,
          totalSpent: totalSpent._sum.grossAmount || 0,
          lastActivity,
        },
      });
    } catch (error) {
      console.error('Failed to get client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get client',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const validation = createClientSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Check if client with same mobile already exists in the office
      const existingClient = await this.prisma.client.findFirst({
        where: {
          mobile: data.mobile,
          officeId: user.officeId,
        },
      });

      if (existingClient) {
        res.status(409).json({
          success: false,
          message: 'A client with this mobile number already exists in your office',
        });
        return;
      }

      // If ownerAgentId is not provided, assign to current user (if they're an agent)
      const ownerAgentId = data.ownerAgentId || (user.role === 'AGENT' ? user.userId : null);

      const client = await this.prisma.client.create({
        data: {
          ...data,
          officeId: user.officeId,
          ownerAgentId,
        },
        include: {
          ownerAgent: {
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
          _count: {
            select: {
              opportunities: true,
              transactions: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...client,
          totalSpent: 0,
          lastActivity: client.createdAt,
        },
      });
    } catch (error) {
      console.error('Failed to create client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create client',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const validation = updateClientSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Check if client exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      if (user.role === 'AGENT') {
        where.ownerAgentId = user.userId;
      }

      const existingClient = await this.prisma.client.findUnique({
        where,
        select: { id: true, mobile: true },
      });

      if (!existingClient) {
        res.status(404).json({
          success: false,
          message: 'Client not found or access denied',
        });
        return;
      }

      // Check for mobile number conflicts if mobile is being updated
      if (data.mobile && data.mobile !== existingClient.mobile) {
        const conflictingClient = await this.prisma.client.findFirst({
          where: {
            mobile: data.mobile,
            officeId: user.officeId,
            NOT: { id },
          },
        });

        if (conflictingClient) {
          res.status(409).json({
            success: false,
            message: 'A client with this mobile number already exists in your office',
          });
          return;
        }
      }

      const client = await this.prisma.client.update({
        where: { id },
        data,
        include: {
          ownerAgent: {
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
          _count: {
            select: {
              opportunities: true,
              transactions: true,
            },
          },
        },
      });

      // Calculate additional stats
      const totalSpent = await this.prisma.transaction.aggregate({
        where: { clientId: client.id },
        _sum: { grossAmount: true },
      });

      const lastActivity = await this.prisma.opportunity.findFirst({
        where: { clientId: client.id },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      });

      res.json({
        success: true,
        data: {
          ...client,
          totalSpent: totalSpent._sum.grossAmount || 0,
          lastActivity: lastActivity?.updatedAt || client.createdAt,
        },
      });
    } catch (error) {
      console.error('Failed to update client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update client',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Check if client exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      if (user.role === 'AGENT') {
        where.ownerAgentId = user.userId;
      }

      const existingClient = await this.prisma.client.findUnique({
        where,
        include: {
          _count: {
            select: {
              opportunities: true,
              transactions: true,
            },
          },
        },
      });

      if (!existingClient) {
        res.status(404).json({
          success: false,
          message: 'Client not found or access denied',
        });
        return;
      }

      // Check if client has transactions - don't allow deletion if they do
      if (existingClient._count.transactions > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete client with existing transactions. Archive the client instead.',
        });
        return;
      }

      // Delete the client (this will cascade delete opportunities, comments, tasks)
      await this.prisma.client.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete client',
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
        where.ownerAgentId = user.userId;
      }

      const [
        totalClients,
        newClientsThisMonth,
        totalRevenue,
        avgClientValue,
        topSpenders,
      ] = await Promise.all([
        this.prisma.client.count({ where }),
        this.prisma.client.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            client: user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : undefined,
          },
          _sum: { grossAmount: true },
        }),
        this.prisma.transaction.groupBy({
          by: ['clientId'],
          where: {
            client: user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : undefined,
          },
          _sum: { grossAmount: true },
          _avg: { grossAmount: true },
        }),
        this.prisma.client.findMany({
          where,
          include: {
            transactions: {
              select: {
                grossAmount: true,
              },
            },
          },
          take: 5,
        }),
      ]);

      // Calculate average client value
      const avgValue = avgClientValue.length > 0 
        ? avgClientValue.reduce((sum, client) => sum + (client._avg.grossAmount || 0), 0) / avgClientValue.length
        : 0;

      // Process top spenders
      const processedTopSpenders = topSpenders
        .map(client => ({
          ...client,
          totalSpent: client.transactions.reduce((sum, t) => sum + t.grossAmount, 0),
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          totalClients,
          newClientsThisMonth,
          totalRevenue: totalRevenue._sum.grossAmount || 0,
          averageClientValue: Math.round(avgValue),
          topSpenders: processedTopSpenders,
        },
      });
    } catch (error) {
      console.error('Failed to get client stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get client stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
