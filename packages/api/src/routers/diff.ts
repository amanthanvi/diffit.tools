import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { standardRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { trackUsage } from '../middleware/logging';
import { TRPCError } from '@trpc/server';
import { paginationSchema, sortSchema } from '../types';
import { withCache } from '../utils/redis';
import crypto from 'crypto';

/**
 * Diff router for CRUD operations, sharing, and export
 */
export const diffRouter = router({
  // List diffs with filtering and pagination
  list: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      pagination: paginationSchema.optional(),
      sort: sortSchema.optional(),
      filter: z.object({
        type: z.enum(['TEXT', 'FILE', 'CODE', 'JSON', 'PDF']).optional(),
        visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
        collectionId: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, limit: 20 }, sort, filter } = input;
      const skip = (pagination.page - 1) * pagination.limit;
      
      // Build where clause
      const where: any = {
        status: 'ACTIVE',
        visibility: 'PUBLIC', // Only show public diffs in anonymous mode
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      };
      
      // Apply filters
      if (filter?.type) where.type = filter.type;
      if (filter?.collectionId) where.collectionId = filter.collectionId;
      
      // Search filter
      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
      
      // Execute queries
      const [items, total] = await Promise.all([
        ctx.db.diff.findMany({
          where,
          skip,
          take: pagination.limit,
          orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                comments: true,
              },
            },
          },
        }),
        ctx.db.diff.count({ where }),
      ]);
      
      return {
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: skip + items.length < total,
      };
    }),
  
  // Get single diff
  get: publicProcedure
    .use(trackUsage('DIFF_VIEW'))
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Try cache first
      const cacheKey = `diff:${input.slug}`;
      const diff = await withCache(
        ctx.redis,
        cacheKey,
        300, // 5 minutes
        async () => {
          const diff = await ctx.db.diff.findUnique({
            where: { slug: input.slug },
            include: {
              files: true,
              analytics: true,
              _count: {
                select: {
                  comments: true,
                },
              },
            },
          });
          
          if (!diff) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Diff not found',
            });
          }
          
          // Check if diff is public or unlisted
          if (diff.visibility === 'PRIVATE') {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'This diff is private',
            });
          }
          
          // Check expiration
          if (diff.expiresAt && diff.expiresAt < new Date()) {
            await ctx.db.diff.update({
              where: { id: diff.id },
              data: { status: 'EXPIRED' },
            });
            throw new TRPCError({
              code: 'GONE',
              message: 'This diff has expired',
            });
          }
          
          return diff;
        }
      );
      
      // Update view count asynchronously
      ctx.db.diff.update({
        where: { id: diff.id },
        data: { viewCount: { increment: 1 } },
      }).catch(console.error);
      
      // Update analytics asynchronously
      if (diff.analytics) {
        ctx.db.diffAnalytics.update({
          where: { id: diff.analytics.id },
          data: {
            totalViews: { increment: 1 },
            lastViewedAt: new Date(),
          },
        }).catch(console.error);
      }
      
      return diff;
    }),
  
  // Create diff
  create: publicProcedure
    .use(strictRateLimit)
    .use(trackUsage('DIFF_CREATE'))
    .input(z.object({
      title: z.string().max(200).optional(),
      description: z.string().max(1000).optional(),
      leftContent: z.string().max(1000000), // 1MB limit
      rightContent: z.string().max(1000000),
      leftTitle: z.string().max(100).optional(),
      rightTitle: z.string().max(100).optional(),
      type: z.enum(['TEXT', 'FILE', 'CODE', 'JSON', 'PDF']).default('TEXT'),
      visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PUBLIC'),
      ignoreWhitespace: z.boolean().default(false),
      ignoreCase: z.boolean().default(false),
      contextLines: z.number().int().min(0).max(10).default(3),
      expiresInHours: z.number().int().min(1).max(720).optional(), // Max 30 days
      collectionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate unique slug
      const slug = crypto.randomBytes(6).toString('base64url');
      
      // Calculate expiration
      const expiresAt = input.expiresInHours
        ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
        : null;
      
      // Create diff (all diffs are public in anonymous mode)
      const diff = await ctx.db.diff.create({
        data: {
          slug,
          title: input.title,
          description: input.description,
          leftContent: input.leftContent,
          rightContent: input.rightContent,
          leftTitle: input.leftTitle,
          rightTitle: input.rightTitle,
          type: input.type,
          visibility: 'PUBLIC', // Force public in anonymous mode
          ignoreWhitespace: input.ignoreWhitespace,
          ignoreCase: input.ignoreCase,
          contextLines: input.contextLines,
          expiresAt,
          collectionId: input.collectionId,
        },
      });
      
      // Create analytics record
      await ctx.db.diffAnalytics.create({
        data: {
          diffId: diff.id,
        },
      });
      
      return diff;
    }),
  
  // Export diff
  export: publicProcedure
    .use(standardRateLimit)
    .use(trackUsage('EXPORT'))
    .input(z.object({
      slug: z.string(),
      format: z.enum(['json', 'html', 'markdown', 'patch']),
    }))
    .query(async ({ ctx, input }) => {
      // Get diff (this also checks permissions)
      const procedure = diffRouter._def.procedures.get as any;
      const diff = await procedure.call({
        ctx,
        input: { slug: input.slug },
        type: 'query',
      });
      
      // Generate export based on format
      switch (input.format) {
        case 'json':
          return {
            format: 'json',
            content: JSON.stringify(diff, null, 2),
            mimeType: 'application/json',
            filename: `diff-${diff.slug}.json`,
          };
          
        case 'html':
          // TODO: Implement HTML export with syntax highlighting
          return {
            format: 'html',
            content: `<html><!-- Diff HTML --></html>`,
            mimeType: 'text/html',
            filename: `diff-${diff.slug}.html`,
          };
          
        case 'markdown':
          return {
            format: 'markdown',
            content: `# ${diff.title || 'Untitled Diff'}\n\n${diff.description || ''}\n\n<!-- Diff content -->`,
            mimeType: 'text/markdown',
            filename: `diff-${diff.slug}.md`,
          };
          
        case 'patch':
          return {
            format: 'patch',
            content: `--- ${diff.leftTitle || 'a'}\n+++ ${diff.rightTitle || 'b'}\n<!-- Patch content -->`,
            mimeType: 'text/plain',
            filename: `diff-${diff.slug}.patch`,
          };
      }
    }),
});