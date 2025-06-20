import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './types';
import { ZodError } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

/**
 * Export reusable router and middleware helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Create a new caller for server-side calls
 */
export const createCallerFactory = t.createCallerFactory;