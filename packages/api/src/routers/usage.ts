import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { standardRateLimit } from '../middleware/rateLimiter';
import { dateRangeSchema } from '../types';
import type { UsageType } from '@diffit/db';

/**
 * Usage router for anonymous tracking
 */
export const usageRouter = router({
  // Get public usage statistics
  publicStats: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'year']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let startDate: Date;
      
      switch (input.period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      // Get usage counts by type
      const usageByType = await ctx.db.usage.groupBy({
        by: ['type'],
        where: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        _count: true,
      });
      
      // Get total counts
      const totalDiffs = await ctx.db.diff.count({
        where: {
          visibility: 'PUBLIC',
          status: 'ACTIVE',
          createdAt: {
            gte: startDate,
          },
        },
      });
      
      const totalComments = await ctx.db.comment.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: startDate,
          },
        },
      });
      
      const totalCollections = await ctx.db.collection.count({
        where: {
          isPublic: true,
          createdAt: {
            gte: startDate,
          },
        },
      });
      
      // Calculate totals
      const totals = usageByType.reduce((acc, item) => ({
        ...acc,
        [item.type]: item._count,
      }), {} as Record<UsageType, number>);
      
      return {
        period: input.period,
        startDate,
        endDate: now,
        totals,
        stats: {
          totalDiffs,
          totalComments,
          totalCollections,
        },
      };
    }),
  
  // Get daily activity for public display
  dailyActivity: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      days: z.number().int().min(1).max(30).default(7),
    }))
    .query(async ({ ctx, input }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
      
      // Get daily diff creation
      const dailyDiffs = await ctx.db.$queryRaw<Array<{
        date: Date;
        count: bigint;
      }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM "Diff"
        WHERE visibility = 'PUBLIC'
          AND status = 'ACTIVE'
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      // Format results
      const activity = dailyDiffs.map(item => ({
        date: item.date,
        diffs: Number(item.count),
      }));
      
      return {
        days: input.days,
        startDate,
        endDate,
        activity,
      };
    }),
  
  // Track anonymous usage (internal use)
  track: publicProcedure
    .use(standardRateLimit)
    .input(z.object({
      type: z.nativeEnum({
        DIFF_CREATE: 'DIFF_CREATE',
        DIFF_VIEW: 'DIFF_VIEW',
        API_CALL: 'API_CALL',
        FILE_UPLOAD: 'FILE_UPLOAD',
        EXPORT: 'EXPORT',
        SHARE: 'SHARE',
      } as const),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get IP address from request
      const ipAddress = ctx.req.headers.get('x-forwarded-for') || 
                       ctx.req.headers.get('x-real-ip') || 
                       'unknown';
      
      const userAgent = ctx.req.headers.get('user-agent') || 'unknown';
      
      await ctx.db.usage.create({
        data: {
          type: input.type,
          metadata: input.metadata,
          ipAddress: ipAddress.split(',')[0].trim(), // Take first IP if multiple
          userAgent,
        },
      });
      
      return { success: true };
    }),
});