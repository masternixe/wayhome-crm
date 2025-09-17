import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string(),
  assignedToId: z.string(),
  relatedToType: z.enum(['CLIENT', 'PROPERTY', 'LEAD', 'OPPORTUNITY', 'TRANSACTION']),
  relatedToId: z.string(),
  reminder: z.boolean().default(true),
  recurrence: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'DONE', 'CANCELLED']),
});

export class TaskController {
  constructor(private prisma: PrismaClient) {}

  async search(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { 
        status,
        assignedToId,
        createdById,
        relatedToType,
        relatedToId,
        overdue,
        upcoming,
        limit = 20, 
        offset = 0,
        sortBy = 'dueDate',
        sortOrder = 'asc'
      } = req.query;

      // Build where clause based on user role and filters
      const where: any = {};

      // Office filter - non-super-admins can only see tasks from their office
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      // Agent filter - agents can only see tasks assigned to them or created by them
      if (user.role === 'AGENT') {
        where.OR = [
          { assignedToId: user.userId },
          { createdById: user.userId },
        ];
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // Assignment filters
      if (assignedToId) {
        where.assignedToId = assignedToId;
      }
      if (createdById) {
        where.createdById = createdById;
      }

      // Related entity filters
      if (relatedToType) {
        where.relatedToType = relatedToType;
      }
      if (relatedToId) {
        where.relatedToId = relatedToId;
      }

      // Date filters
      const now = new Date();
      if (overdue === 'true') {
        where.dueDate = { lt: now };
        where.status = { not: 'DONE' };
      } else if (upcoming === 'true') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        where.dueDate = { 
          gte: now,
          lte: tomorrow
        };
        where.status = { not: 'DONE' };
      }

      const tasks = await this.prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          createdBy: {
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

      // Add related entity info based on type
      const tasksWithRelatedInfo = await Promise.all(
        tasks.map(async (task) => {
          let relatedEntity = null;

          try {
            switch (task.relatedToType) {
              case 'CLIENT':
                relatedEntity = await this.prisma.client.findUnique({
                  where: { id: task.relatedToId },
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    mobile: true,
                  },
                });
                break;

              case 'PROPERTY':
                relatedEntity = await this.prisma.property.findUnique({
                  where: { id: task.relatedToId },
                  select: {
                    id: true,
                    title: true,
                    address: true,
                    price: true,
                  },
                });
                break;

              case 'LEAD':
                relatedEntity = await this.prisma.lead.findUnique({
                  where: { id: task.relatedToId },
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    leadNumber: true,
                  },
                });
                break;

              case 'OPPORTUNITY':
                relatedEntity = await this.prisma.opportunity.findUnique({
                  where: { id: task.relatedToId },
                  select: {
                    id: true,
                    stage: true,
                    estimatedValue: true,
                    client: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                });
                break;

              case 'TRANSACTION':
                relatedEntity = await this.prisma.transaction.findUnique({
                  where: { id: task.relatedToId },
                  select: {
                    id: true,
                    type: true,
                    status: true,
                    grossAmount: true,
                    client: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                });
                break;
            }
          } catch (error) {
            // Related entity might have been deleted
            console.warn(`Could not fetch related entity for task ${task.id}:`, error);
          }

          return {
            ...task,
            relatedEntity,
          };
        })
      );

      const total = await this.prisma.task.count({ where });

      res.json({
        success: true,
        data: {
          tasks: tasksWithRelatedInfo,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
          },
        },
      });
    } catch (error) {
      console.error('Failed to search tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search tasks',
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

      // Agent filter - agents can only see tasks assigned to them or created by them
      if (user.role === 'AGENT') {
        where.OR = [
          { assignedToId: user.userId },
          { createdById: user.userId },
        ];
      }

      const task = await this.prisma.task.findFirst({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          createdBy: {
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
      });

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found or access denied',
        });
        return;
      }

      // Get related entity info
      let relatedEntity = null;
      try {
        switch (task.relatedToType) {
          case 'CLIENT':
            relatedEntity = await this.prisma.client.findUnique({
              where: { id: task.relatedToId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                mobile: true,
                email: true,
              },
            });
            break;

          case 'PROPERTY':
            relatedEntity = await this.prisma.property.findUnique({
              where: { id: task.relatedToId },
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
              },
            });
            break;

          case 'LEAD':
            relatedEntity = await this.prisma.lead.findUnique({
              where: { id: task.relatedToId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                leadNumber: true,
                mobile: true,
                email: true,
              },
            });
            break;

          case 'OPPORTUNITY':
            relatedEntity = await this.prisma.opportunity.findUnique({
              where: { id: task.relatedToId },
              include: {
                client: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                interestedProperty: {
                  select: {
                    title: true,
                    address: true,
                  },
                },
              },
            });
            break;

          case 'TRANSACTION':
            relatedEntity = await this.prisma.transaction.findUnique({
              where: { id: task.relatedToId },
              include: {
                client: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                property: {
                  select: {
                    title: true,
                    address: true,
                  },
                },
              },
            });
            break;
        }
      } catch (error) {
        console.warn(`Could not fetch related entity for task ${task.id}:`, error);
      }

      res.json({
        success: true,
        data: {
          ...task,
          relatedEntity,
        },
      });
    } catch (error) {
      console.error('Failed to get task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const validation = createTaskSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Verify assigned user exists and is in the same office (for non-super-admins)
      if (user.role !== 'SUPER_ADMIN') {
        const assignedUser = await this.prisma.user.findUnique({
          where: { id: data.assignedToId },
          select: { officeId: true },
        });

        if (!assignedUser || assignedUser.officeId !== user.officeId) {
          res.status(403).json({
            success: false,
            message: 'Assigned user not found in your office',
          });
          return;
        }
      }

      // Verify the related entity exists and user has access to it
      let hasAccess = false;
      const where = user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {};

      switch (data.relatedToType) {
        case 'CLIENT':
          const client = await this.prisma.client.findFirst({
            where: { id: data.relatedToId, ...where },
            select: { id: true },
          });
          hasAccess = !!client;
          break;

        case 'PROPERTY':
          const property = await this.prisma.property.findFirst({
            where: { id: data.relatedToId, ...where },
            select: { id: true },
          });
          hasAccess = !!property;
          break;

        case 'LEAD':
          const lead = await this.prisma.lead.findFirst({
            where: { id: data.relatedToId, ...where },
            select: { id: true },
          });
          hasAccess = !!lead;
          break;

        case 'OPPORTUNITY':
          const opportunity = await this.prisma.opportunity.findFirst({
            where: { id: data.relatedToId, ...where },
            select: { id: true },
          });
          hasAccess = !!opportunity;
          break;

        case 'TRANSACTION':
          const transaction = await this.prisma.transaction.findFirst({
            where: { id: data.relatedToId, ...where },
            select: { id: true },
          });
          hasAccess = !!transaction;
          break;
      }

      if (!hasAccess) {
        res.status(404).json({
          success: false,
          message: `${data.relatedToType.toLowerCase()} not found or access denied`,
        });
        return;
      }

      const task = await this.prisma.task.create({
        data: {
          ...data,
          dueDate: new Date(data.dueDate),
          createdById: user.userId,
          officeId: user.officeId,
          status: 'OPEN',
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
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
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const validation = updateTaskSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Check if task exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      if (user.role === 'AGENT') {
        where.OR = [
          { assignedToId: user.userId },
          { createdById: user.userId },
        ];
      }

      const existingTask = await this.prisma.task.findFirst({
        where,
        select: { id: true, status: true },
      });

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found or access denied',
        });
        return;
      }

      const task = await this.prisma.task.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
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
            },
          },
        },
      });

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
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

      // Check if task exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      if (user.role === 'AGENT') {
        where.OR = [
          { assignedToId: user.userId },
          { createdById: user.userId },
        ];
      }

      const existingTask = await this.prisma.task.findFirst({
        where,
        select: { id: true },
      });

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found or access denied',
        });
        return;
      }

      // If marking as done, set completion date
      const updateData: any = { status };
      if (status === 'DONE') {
        updateData.completedAt = new Date();
      } else if (status === 'OPEN') {
        updateData.completedAt = null;
      }

      const task = await this.prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
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
        data: task,
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Check if task exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }
      if (user.role === 'AGENT') {
        where.OR = [
          { assignedToId: user.userId },
          { createdById: user.userId },
        ];
      }

      const existingTask = await this.prisma.task.findFirst({
        where,
        select: { id: true, createdById: true },
      });

      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found or access denied',
        });
        return;
      }

      // Only task creator or managers+ can delete tasks
      if (user.role === 'AGENT' && existingTask.createdById !== user.userId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete tasks you created',
        });
        return;
      }

      await this.prisma.task.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getMyTasks(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { status, overdue, upcoming, limit = 20, offset = 0 } = req.query;

      const where: any = {
        assignedToId: user.userId,
      };

      if (status) {
        where.status = status;
      }

      // Date filters
      const now = new Date();
      if (overdue === 'true') {
        where.dueDate = { lt: now };
        where.status = { not: 'DONE' };
      } else if (upcoming === 'true') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        where.dueDate = { 
          gte: now,
          lte: tomorrow
        };
        where.status = { not: 'DONE' };
      }

      const tasks = await this.prisma.task.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
        ],
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await this.prisma.task.count({ where });

      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
          },
        },
      });
    } catch (error) {
      console.error('Failed to get my tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tasks',
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
          { assignedToId: user.userId },
          { createdById: user.userId },
        ];
      }

      const now = new Date();
      const [
        totalTasks,
        openTasks,
        doneTasks,
        cancelledTasks,
        overdueTasks,
        upcomingTasks,
      ] = await Promise.all([
        this.prisma.task.count({ where }),
        this.prisma.task.count({ where: { ...where, status: 'OPEN' } }),
        this.prisma.task.count({ where: { ...where, status: 'DONE' } }),
        this.prisma.task.count({ where: { ...where, status: 'CANCELLED' } }),
        this.prisma.task.count({
          where: {
            ...where,
            status: { not: 'DONE' },
            dueDate: { lt: now },
          },
        }),
        this.prisma.task.count({
          where: {
            ...where,
            status: { not: 'DONE' },
            dueDate: {
              gte: now,
              lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalTasks,
          statusBreakdown: {
            open: openTasks,
            done: doneTasks,
            cancelled: cancelledTasks,
          },
          alerts: {
            overdue: overdueTasks,
            upcoming: upcomingTasks,
          },
          completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        },
      });
    } catch (error) {
      console.error('Failed to get task stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
