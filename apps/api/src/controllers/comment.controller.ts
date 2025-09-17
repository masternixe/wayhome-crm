import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';
import { z } from 'zod';

const createCommentSchema = z.object({
  entityType: z.enum(['CLIENT', 'PROPERTY', 'LEAD', 'OPPORTUNITY', 'TRANSACTION']),
  entityId: z.string(),
  body: z.string().min(1),
  isInternal: z.boolean().default(true),
});

const updateCommentSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().optional(),
});

export class CommentController {
  constructor(private prisma: PrismaClient) {}

  async getByEntity(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { entityType, entityId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Validate entity type
      if (!['CLIENT', 'PROPERTY', 'LEAD', 'OPPORTUNITY', 'TRANSACTION'].includes(entityType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid entity type',
        });
        return;
      }

      // Build where clause
      const where: any = {
        entityType,
        entityId,
      };

      // Office filter for non-super-admins
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const comments = await this.prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await this.prisma.comment.count({ where });

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
          },
        },
      });
    } catch (error) {
      console.error('Failed to get comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comments',
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

      const comment = await this.prisma.comment.findUnique({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      if (!comment) {
        res.status(404).json({
          success: false,
          message: 'Comment not found or access denied',
        });
        return;
      }

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      console.error('Failed to get comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const validation = createCommentSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const { entityType, entityId, body, isInternal } = validation.data;

      // Verify the entity exists and user has access to it
      let hasAccess = false;
      let entityOfficeId: string | undefined;
      const where = user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {};

      switch (entityType) {
        case 'CLIENT': {
          const client = await this.prisma.client.findFirst({
            where: { id: entityId, ...where },
            select: { id: true, officeId: true },
          });
          hasAccess = !!client;
          entityOfficeId = client?.officeId;
          break;
        }

        case 'PROPERTY': {
          const property = await this.prisma.property.findFirst({
            where: { id: entityId, ...where },
            select: { id: true, officeId: true },
          });
          hasAccess = !!property;
          entityOfficeId = property?.officeId;
          break;
        }

        case 'LEAD': {
          const lead = await this.prisma.lead.findFirst({
            where: { id: entityId, ...where },
            select: { id: true, officeId: true },
          });
          hasAccess = !!lead;
          entityOfficeId = lead?.officeId;
          break;
        }

        case 'OPPORTUNITY': {
          const opportunity = await this.prisma.opportunity.findFirst({
            where: { id: entityId, ...where },
            select: { id: true, officeId: true },
          });
          hasAccess = !!opportunity;
          entityOfficeId = opportunity?.officeId;
          break;
        }

        case 'TRANSACTION': {
          const transaction = await this.prisma.transaction.findFirst({
            where: { id: entityId, ...where },
            select: { id: true, officeId: true },
          });
          hasAccess = !!transaction;
          entityOfficeId = transaction?.officeId;
          break;
        }
      }

      if (!hasAccess) {
        res.status(404).json({
          success: false,
          message: `${entityType.toLowerCase()} not found or access denied`,
        });
        return;
      }

      const comment = await this.prisma.comment.create({
        data: {
          entityType,
          entityId,
          body,
          isInternal,
          authorId: user.userId,
          officeId: entityOfficeId || user.officeId!,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      console.error('Failed to create comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;
      const validation = updateCommentSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Check if comment exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const existingComment = await this.prisma.comment.findUnique({
        where,
        select: { id: true, authorId: true },
      });

      if (!existingComment) {
        res.status(404).json({
          success: false,
          message: 'Comment not found or access denied',
        });
        return;
      }

      // Only the author or managers+ can edit comments
      if (user.role === 'AGENT' && existingComment.authorId !== user.userId) {
        res.status(403).json({
          success: false,
          message: 'You can only edit your own comments',
        });
        return;
      }

      const comment = await this.prisma.comment.update({
        where: { id },
        data,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      console.error('Failed to update comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { id } = req.params;

      // Check if comment exists and user has access
      const where: any = { id };
      if (user.role !== 'SUPER_ADMIN') {
        where.officeId = user.officeId;
      }

      const existingComment = await this.prisma.comment.findUnique({
        where,
        select: { id: true, authorId: true },
      });

      if (!existingComment) {
        res.status(404).json({
          success: false,
          message: 'Comment not found or access denied',
        });
        return;
      }

      // Only the author or managers+ can delete comments
      if (user.role === 'AGENT' && existingComment.authorId !== user.userId) {
        res.status(403).json({
          success: false,
          message: 'You can only delete your own comments',
        });
        return;
      }

      await this.prisma.comment.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getMyComments(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { limit = 50, offset = 0, entityType } = req.query;

      const where: any = {
        authorId: user.userId,
      };

      if (entityType) {
        where.entityType = entityType;
      }

      const comments = await this.prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await this.prisma.comment.count({ where });

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
          },
        },
      });
    } catch (error) {
      console.error('Failed to get my comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comments',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
