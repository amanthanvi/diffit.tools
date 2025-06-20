// Re-export Prisma client and types
export { prisma, db } from './client';
export type * from '@prisma/client';

// Re-export connection utilities
export {
  connectDatabase,
  disconnectDatabase,
  getDatabaseClient,
  checkDatabaseHealth,
  getDatabaseStats,
  withTransaction,
} from './connection';

// Re-export migration utilities
export { migrations, MigrationManager } from './migrations';

// Export common database utilities
export * from './utils';

// Initialize database connection in non-test environments
if (process.env.NODE_ENV !== 'test') {
  import('./connection').then(({ connectDatabase }) => {
    connectDatabase().catch(error => {
      console.error('Failed to connect to database on startup:', error);
    });
  });
}