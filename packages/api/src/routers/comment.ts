import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { standardRateLimit } from '../middleware/rateLimiter';
import { TRPCError } from '@trpc/server';
import { paginationSchema } from '../types';

/**
 * Comment router for collaboration features
 */
export const commentRouter = router({
  // List comments for a diff
  list: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      diffId: z.string(),
      pagination: paginationSchema.optional(),
      parentId: z.string().nullable().optional(),
      status: z.enum(['ACTIVE', 'RESOLVED', 'DELETED']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { diffId, pagination = { page: 1, limit: 20 }, parentId = null, status } = input;
      const skip = (pagination.page - 1) * pagination.limit;
      
      // Check if diff exists and is public
      const diff = await ctx.db.diff.findUnique({
        where: { id: diffId },
        select: {
          visibility: true,
        },
      });
      
      if (!diff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diff not found',
        });
      }
      
      if (diff.visibility === 'PRIVATE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Comments are not available for private diffs',
        });
      }
      
      const where: any = {
        diffId,
        parentId,
      };
      
      if (status) {
        where.status = status;
      } else {
        where.status = { not: 'DELETED' };
      }
      
      const [items, total] = await Promise.all([
        ctx.db.comment.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                replies: {
                  where: {
                    status: { not: 'DELETED' },
                  },
                },
              },
            },
          },
        }),
        ctx.db.comment.count({ where }),
      ]);
      
      return {
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: skip + items.length < total,
      };
    }),
  
  // Get single comment with replies
  get: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
        include: {
          diff: {
            select: {
              visibility: true,
            },
          },
          replies: {
            where: {
              status: { not: 'DELETED' },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      
      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }
      
      // Check if diff is public
      if (comment.diff.visibility === 'PRIVATE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Comments are not available for private diffs',
        });
      }
      
      if (comment.status === 'DELETED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }
      
      return comment;
    }),
  
  // Create anonymous comment
  create: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      diffId: z.string(),
      content: z.string().min(1).max(5000),
      authorName: z.string().min(1).max(50).default('Anonymous'),
      parentId: z.string().optional(),
      lineNumber: z.number().int().positive().optional(),
      side: z.enum(['left', 'right']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if diff exists and is public
      const diff = await ctx.db.diff.findUnique({
        where: { id: input.diffId },
        select: {
          visibility: true,
          status: true,
        },
      });
      
      if (!diff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diff not found',
        });
      }
      
      if (diff.status !== 'ACTIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot comment on expired or deleted diffs',
        });
      }
      
      if (diff.visibility === 'PRIVATE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Comments are not available for private diffs',
        });
      }
      
      // Check parent comment if replying
      if (input.parentId) {
        const parent = await ctx.db.comment.findUnique({
          where: { id: input.parentId },
          select: { diffId: true },
        });
        
        if (!parent || parent.diffId !== input.diffId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid parent comment',
          });
        }
      }
      
      const comment = await ctx.db.comment.create({
        data: {
          diffId: input.diffId,
          authorName: input.authorName,
          content: input.content,
          parentId: input.parentId,
          lineNumber: input.lineNumber,
          side: input.side,
        },
      });
      
      return comment;
    }),
  
  // Get comment thread (all comments for specific line)
  getThread: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      diffId: z.string(),
      lineNumber: z.number().int().positive(),
      side: z.enum(['left', 'right']),
    }))
    .query(async ({ ctx, input }) => {
      // Check if diff is public
      const diff = await ctx.db.diff.findUnique({
        where: { id: input.diffId },
        select: {
          visibility: true,
        },
      });
      
      if (!diff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diff not found',
        });
      }
      
      if (diff.visibility === 'PRIVATE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Comments are not available for private diffs',
        });
      }
      
      const comments = await ctx.db.comment.findMany({
        where: {
          diffId: input.diffId,
          lineNumber: input.lineNumber,
          side: input.side,
          status: { not: 'DELETED' },
          parentId: null, // Only top-level comments
        },
        orderBy: { createdAt: 'asc' },
        include: {
          replies: {
            where: {
              status: { not: 'DELETED' },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      
      return comments;
    }),
});