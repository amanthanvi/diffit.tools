import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { standardRateLimit } from '../middleware/rateLimiter';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

// Webhook events that can be subscribed to
const WEBHOOK_EVENTS = [
  'diff.created',
  'diff.updated',
  'diff.deleted',
  'diff.viewed',
  'collection.created',
  'collection.updated',
  'collection.deleted',
  'comment.created',
  'comment.updated',
  'comment.deleted',
] as const;

type WebhookEvent = typeof WEBHOOK_EVENTS[number];

// In-memory webhook store (for demo purposes)
const webhooks = new Map<string, {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: Date;
}>();

export const webhookRouter = router({
  create: publicProcedure
    .use(standardRateLimit)
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.enum(WEBHOOK_EVENTS)),
        secret: z.string().min(32),
      })
    )
    .mutation(async ({ input }) => {
      const webhookId = crypto.randomUUID();
      
      webhooks.set(webhookId, {
        id: webhookId,
        url: input.url,
        events: input.events,
        secret: input.secret,
        active: true,
        createdAt: new Date(),
      });

      return {
        id: webhookId,
        url: input.url,
        events: input.events,
        active: true,
      };
    }),

  list: publicProcedure
    .use(standardRateLimit)
    .query(async () => {
      return Array.from(webhooks.values()).map(webhook => ({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt,
      }));
    }),

  delete: publicProcedure
    .use(standardRateLimit)
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const webhook = webhooks.get(input.id);
      
      if (!webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        });
      }

      webhooks.delete(input.id);
      
      return { success: true };
    }),

  test: publicProcedure
    .use(standardRateLimit)
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const webhook = webhooks.get(input.id);
      
      if (!webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        });
      }

      // Send test webhook
      const testEvent = {
        id: crypto.randomUUID(),
        type: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Test webhook event',
        },
      };

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(testEvent))
        .digest('hex');

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-ID': webhook.id,
          },
          body: JSON.stringify(testEvent),
        });

        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send test webhook',
          cause: error,
        });
      }
    }),
});

// Helper to trigger webhook events
export async function triggerWebhookEvent(
  event: WebhookEvent,
  data: Record<string, any>
) {
  const activeWebhooks = Array.from(webhooks.values()).filter(
    webhook => webhook.active && webhook.events.includes(event)
  );

  const eventPayload = {
    id: crypto.randomUUID(),
    type: event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Send webhooks asynchronously
  await Promise.allSettled(
    activeWebhooks.map(async webhook => {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(eventPayload))
        .digest('hex');

      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-ID': webhook.id,
          },
          body: JSON.stringify(eventPayload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
      } catch (error) {
        console.error(`Failed to send webhook to ${webhook.url}:`, error);
      }
    })
  );
}