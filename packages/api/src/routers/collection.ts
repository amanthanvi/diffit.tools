import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { standardRateLimit } from '../middleware/rateLimiter';
import { TRPCError } from '@trpc/server';
import { paginationSchema } from '../types';
import crypto from 'crypto';

/**
 * Collection router for organizing diffs
 */
export const collectionRouter = router({
  // List public collections
  list: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      pagination: paginationSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, limit: 20 } } = input;
      const skip = (pagination.page - 1) * pagination.limit;
      
      const where = { isPublic: true };
      
      const [items, total] = await Promise.all([
        ctx.db.collection.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                diffs: true,
              },
            },
          },
        }),
        ctx.db.collection.count({ where }),
      ]);
      
      return {
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: skip + items.length < total,
      };
    }),
  
  // Get single collection
  get: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.collection.findUnique({
        where: { slug: input.slug },
        include: {
          diffs: {
            where: {
              status: 'ACTIVE',
              visibility: 'PUBLIC',
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: {
                  comments: true,
                },
              },
            },
          },
          _count: {
            select: {
              diffs: true,
            },
          },
        },
      });
      
      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }
      
      // Check if collection is public
      if (!collection.isPublic) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This collection is private',
        });
      }
      
      return collection;
    }),
  
  // Create anonymous collection
  create: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().default(true), // Default to public for anonymous
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      icon: z.string().emoji().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate unique slug
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const slug = `${baseSlug}-${randomSuffix}`;
      
      const collection = await ctx.db.collection.create({
        data: {
          slug,
          name: input.name,
          description: input.description,
          isPublic: true, // Force public for anonymous collections
          color: input.color,
          icon: input.icon,
        },
      });
      
      return collection;
    }),
  
  // Add diff to collection (only if both are public)
  addDiff: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      collectionId: z.string(),
      diffId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check collection exists and is public
      const collection = await ctx.db.collection.findFirst({
        where: {
          id: input.collectionId,
          isPublic: true,
        },
      });
      
      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found or is not public',
        });
      }
      
      // Check diff exists and is public
      const diff = await ctx.db.diff.findFirst({
        where: {
          id: input.diffId,
          visibility: 'PUBLIC',
          status: 'ACTIVE',
        },
      });
      
      if (!diff) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diff not found or is not public',
        });
      }
      
      // Add diff to collection
      await ctx.db.diff.update({
        where: { id: input.diffId },
        data: { collectionId: input.collectionId },
      });
      
      return { success: true };
    }),
  
  // Remove diff from collection
  removeDiff: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      collectionId: z.string(),
      diffId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check collection is public
      const collection = await ctx.db.collection.findFirst({
        where: {
          id: input.collectionId,
          isPublic: true,
        },
      });
      
      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found or is not public',
        });
      }
      
      // Remove diff from collection
      await ctx.db.diff.update({
        where: {
          id: input.diffId,
          collectionId: input.collectionId,
        },
        data: { collectionId: null },
      });
      
      return { success: true };
    }),
});