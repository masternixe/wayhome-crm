import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';
import { z } from 'zod';

const createOfficeSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().optional(),
  email: z.string().email(),
});

const updateOfficeSchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export class OfficeController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all offices (SUPER_ADMIN sees all, others see only their office)
   * GET /api/v1/offices
   */
  async getAll(req: Request, res: Response) {
    try {
      const { user } = req as any;
      
      const where = user.role === 'SUPER_ADMIN' ? {} : { id: user.officeId };
      
      const offices = await this.prisma.office.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          _count: {
            select: {
              users: true,
              properties: true,
              leads: true,
              clients: true,
              transactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: offices,
      });
    } catch (error) {
      console.error('Failed to fetch offices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch offices',
      });
    }
  }

  /**
   * Get office by ID
   * GET /api/v1/offices/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Non-super-admins can only view their own office
      if (user.role !== 'SUPER_ADMIN' && user.officeId !== id) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const office = await this.prisma.office.findUnique({
        where: { id },
        include: {
          brand: true,
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              status: true,
            },
            orderBy: {
              role: 'asc',
            },
          },
          _count: {
            select: {
              properties: true,
              leads: true,
              clients: true,
              transactions: true,
              opportunities: true,
            },
          },
        },
      });

      if (!office) {
        res.status(404).json({
          success: false,
          message: 'Office not found',
        });
        return;
      }

      res.json({
        success: true,
        data: office,
      });
    } catch (error) {
      console.error('Failed to fetch office:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch office',
      });
    }
  }

  /**
   * Create new office (SUPER_ADMIN only)
   * POST /api/v1/offices
   */
  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;

      // Only SUPER_ADMIN can create offices
      if (user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only super admins can create offices',
        });
        return;
      }

      const validation = createOfficeSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Get the first brand (or create one if none exists)
      let brand = await this.prisma.brand.findFirst();
      
      if (!brand) {
        brand = await this.prisma.brand.create({
          data: {
            name: 'Wayhome',
            logo: '/images/wayhome-logo.png',
          },
        });
      }

      const office = await this.prisma.office.create({
        data: {
          name: data.name,
          city: data.city,
          address: data.address,
          phone: data.phone,
          email: data.email,
          brandId: brand.id,
        },
        include: {
          brand: true,
          _count: {
            select: {
              users: true,
              properties: true,
              leads: true,
              clients: true,
              transactions: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: office,
        message: 'Office created successfully',
      });
    } catch (error) {
      console.error('Failed to create office:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create office',
      });
    }
  }

  /**
   * Update office (SUPER_ADMIN only)
   * PATCH /api/v1/offices/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Only SUPER_ADMIN can update offices
      if (user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only super admins can update offices',
        });
        return;
      }

      const validation = updateOfficeSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      const office = await this.prisma.office.update({
        where: { id },
        data,
        include: {
          brand: true,
          _count: {
            select: {
              users: true,
              properties: true,
              leads: true,
              clients: true,
              transactions: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: office,
        message: 'Office updated successfully',
      });
    } catch (error) {
      console.error('Failed to update office:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update office',
      });
    }
  }

  /**
   * Delete office (SUPER_ADMIN only)
   * DELETE /api/v1/offices/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Only SUPER_ADMIN can delete offices
      if (user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only super admins can delete offices',
        });
        return;
      }

      // Check if office has users
      const usersCount = await this.prisma.user.count({
        where: { officeId: id },
      });

      if (usersCount > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete office with ${usersCount} users. Please reassign or remove users first.`,
        });
        return;
      }

      // Check if office has properties
      const propertiesCount = await this.prisma.property.count({
        where: { officeId: id },
      });

      if (propertiesCount > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete office with ${propertiesCount} properties. Please reassign or remove properties first.`,
        });
        return;
      }

      await this.prisma.office.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Office deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete office:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete office',
      });
    }
  }

  /**
   * Get office statistics
   * GET /api/v1/offices/:id/stats
   */
  async getStats(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Non-super-admins can only view their own office stats
      if (user.role !== 'SUPER_ADMIN' && user.officeId !== id) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const [
        totalUsers,
        activeUsers,
        totalProperties,
        totalLeads,
        totalClients,
        totalTransactions,
        totalRevenue,
      ] = await Promise.all([
        this.prisma.user.count({ where: { officeId: id } }),
        this.prisma.user.count({ where: { officeId: id, status: 'ACTIVE' } }),
        this.prisma.property.count({ where: { officeId: id } }),
        this.prisma.lead.count({ where: { officeId: id } }),
        this.prisma.client.count({ where: { officeId: id } }),
        this.prisma.transaction.count({ where: { officeId: id } }),
        this.prisma.transaction.aggregate({
          where: { officeId: id, status: 'COMPLETED' },
          _sum: { grossAmount: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
          },
          properties: totalProperties,
          leads: totalLeads,
          clients: totalClients,
          transactions: {
            total: totalTransactions,
            revenue: totalRevenue._sum.grossAmount || 0,
          },
        },
      });
    } catch (error) {
      console.error('Failed to fetch office stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch office statistics',
      });
    }
  }
}

