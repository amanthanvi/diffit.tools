import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { auth, withPermission } from '../middleware/auth';
import { standardRateLimit } from '../middleware/rateLimiter';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import type { WebhookConfig, WebhookEvent } from '../types';

// Webhook events that can be subscribed to
const WEBHOOK_EVENTS = [
  'diff.created',
  'diff.updated',
  'diff.deleted',
  'diff.viewed',
  'comment.created',
  'comment.updated',
  'comment.resolved',
  'collection.created',
  'collection.updated',
  'collection.deleted',
  'user.upgraded',
  'apikey.created',
  'apikey.revoked',
] as const;

/**
 * Webhook router for integrations
 */
export const webhookRouter = router({
  // List webhooks
  list: publicProcedure
    .use(auth)
    .use(withPermission('webhook:read'))
    .query(async ({ ctx }) => {
      // For now, return mock data
      // In production, you'd store webhooks in the database
      const webhooks: WebhookConfig[] = [
        {
          url: 'https://example.com/webhook',
          events: ['diff.created', 'diff.updated'],
          secret: 'wh_secret_xxx',
          active: true,
        },
      ];
      
      return webhooks.map(webhook => ({
        ...webhook,
        secret: `${webhook.secret.substring(0, 10)}...`, // Mask secret
      }));
    }),
  
  // Create webhook
  create: publicProcedure
    .use(auth)
    .use(withPermission('webhook:create'))
    .use(standardRateLimit)
    .input(z.object({
      url: z.string().url(),
      events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
      active: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate URL
      try {
        const url = new URL(input.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid webhook URL',
        });
      }
      
      // Generate webhook secret
      const secret = `wh_secret_${crypto.randomBytes(24).toString('base64url')}`;
      
      // TODO: Store webhook in database
      const webhook: WebhookConfig = {
        url: input.url,
        events: input.events,
        secret,
        active: input.active,
      };
      
      // Test webhook with ping event
      await sendWebhookEvent(webhook, {
        id: crypto.randomUUID(),
        type: 'ping',
        data: {
          message: 'Webhook configured successfully',
        },
        timestamp: new Date(),
        signature: '',
      });
      
      return {
        webhook: {
          ...webhook,
          secret, // Return full secret only on creation
        },
        message: 'Save the webhook secret securely. You won\'t be able to see it again.',
      };
    }),
  
  // Update webhook
  update: publicProcedure
    .use(auth)
    .use(withPermission('webhook:update'))
    .use(standardRateLimit)
    .input(z.object({
      id: z.string(),
      url: z.string().url().optional(),
      events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Update webhook in database
      return { success: true };
    }),
  
  // Delete webhook
  delete: publicProcedure
    .use(auth)
    .use(withPermission('webhook:delete'))
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Delete webhook from database
      return { success: true };
    }),
  
  // Test webhook
  test: publicProcedure
    .use(auth)
    .use(withPermission('webhook:test'))
    .use(standardRateLimit)
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Get webhook from database
      const webhook: WebhookConfig = {
        url: 'https://example.com/webhook',
        events: ['diff.created'],
        secret: 'wh_secret_test',
        active: true,
      };
      
      // Send test event
      const event: WebhookEvent = {
        id: crypto.randomUUID(),
        type: 'test',
        data: {
          message: 'This is a test webhook event',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
        signature: '',
      };
      
      try {
        await sendWebhookEvent(webhook, event);
        return {
          success: true,
          message: 'Test webhook sent successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to send test webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),
  
  // Get webhook logs
  logs: publicProcedure
    .use(auth)
    .use(withPermission('webhook:read'))
    .input(z.object({
      webhookId: z.string(),
      limit: z.number().int().positive().max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Get webhook logs from database
      return {
        logs: [
          {
            id: '1',
            webhookId: input.webhookId,
            event: 'diff.created',
            status: 'success',
            statusCode: 200,
            duration: 145,
            timestamp: new Date(),
          },
          {
            id: '2',
            webhookId: input.webhookId,
            event: 'diff.updated',
            status: 'failed',
            statusCode: 500,
            duration: 1023,
            error: 'Internal server error',
            timestamp: new Date(Date.now() - 3600000),
          },
        ],
      };
    }),
  
  // Verify webhook signature (for webhook receivers)
  verifySignature: publicProcedure
    .input(z.object({
      payload: z.string(),
      signature: z.string(),
      secret: z.string(),
    }))
    .query(({ input }) => {
      const expectedSignature = crypto
        .createHmac('sha256', input.secret)
        .update(input.payload)
        .digest('hex');
      
      const isValid = crypto.timingSafeEqual(
        Buffer.from(input.signature),
        Buffer.from(expectedSignature)
      );
      
      return { isValid };
    }),
});

/**
 * Send webhook event
 */
async function sendWebhookEvent(
  webhook: WebhookConfig,
  event: WebhookEvent
): Promise<void> {
  if (!webhook.active) {
    return;
  }
  
  // Generate signature
  const payload = JSON.stringify(event);
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(payload)
    .digest('hex');
  
  event.signature = signature;
  
  // Send webhook
  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event.type,
      'X-Webhook-ID': event.id,
    },
    body: payload,
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });
  
  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`);
  }
}

/**
 * Queue webhook event for async processing
 * This should be called from other routers when events occur
 */
export async function queueWebhookEvent(
  userId: string,
  eventType: typeof WEBHOOK_EVENTS[number],
  data: any
): Promise<void> {
  // TODO: Get user's webhooks from database
  // TODO: Filter webhooks by event type
  // TODO: Queue events for async processing (e.g., using a job queue)
  
  console.log('Webhook event queued:', {
    userId,
    eventType,
    data,
  });
}