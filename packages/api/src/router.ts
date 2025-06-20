import { router, publicProcedure } from './trpc';
import { diffRouter } from './routers/diff';
import { collectionRouter } from './routers/collection';
import { commentRouter } from './routers/comment';
import { usageRouter } from './routers/usage';
import { webhookRouter } from './routers/webhook';
import { logging } from './middleware/logging';
import { performHealthCheck, getApiMetrics } from './utils/monitoring';
import { z } from 'zod';

/**
 * Main API router combining all sub-routers
 */
export const appRouter = router({
  // Health check endpoint
  health: publicProcedure
    .query(async ({ ctx }) => {
      const health = await performHealthCheck(ctx);
      return health;
    }),
  
  // API metrics endpoint (requires authentication)
  metrics: publicProcedure
    .use(logging)
    .input(z.object({
      adminToken: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Simple admin check - in production use proper admin authentication
      if (input.adminToken !== process.env.ADMIN_TOKEN) {
        throw new Error('Unauthorized');
      }
      
      const metrics = await getApiMetrics();
      return metrics;
    }),
  
  // API version info
  version: publicProcedure
    .query(() => ({
      version: '2.0.0',
      api: 'tRPC',
      features: [
        'rate-limiting',
        'websocket-support',
        'file-uploads',
        'webhooks',
        'real-time-collaboration',
      ],
    })),
  
  // Sub-routers
  diff: diffRouter,
  collection: collectionRouter,
  comment: commentRouter,
  usage: usageRouter,
  webhook: webhookRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;