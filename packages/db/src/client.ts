import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Typed helpers for common queries
export const db = {
  // Diff helpers
  diff: {
    findById: (id: string) =>
      prisma.diff.findUnique({
        where: { id },
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
          },
          collection: true,
          files: true,
        },
      }),
    
    findBySlug: (slug: string) =>
      prisma.diff.findUnique({
        where: { slug },
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    
    findPublic: (limit = 10) =>
      prisma.diff.findMany({
        where: {
          visibility: 'PUBLIC',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    
    incrementViews: (id: string) =>
      prisma.diff.update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
        },
      }),
    
    search: (query: string, limit = 20) =>
      prisma.diff.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          visibility: 'PUBLIC',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
  },
  
  // Collection helpers
  collection: {
    findById: (id: string) =>
      prisma.collection.findUnique({
        where: { id },
        include: {
          diffs: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      }),
    
    findBySlug: (slug: string) =>
      prisma.collection.findUnique({
        where: { slug },
        include: {
          diffs: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      }),
    
    findPublic: (limit = 10) =>
      prisma.collection.findMany({
        where: {
          isPublic: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
  },
  
  // Comment helpers
  comment: {
    findByDiff: (diffId: string) =>
      prisma.comment.findMany({
        where: { diffId },
        orderBy: { createdAt: 'desc' },
      }),
    
    create: (data: {
      diffId: string;
      authorName?: string;
      content: string;
      lineNumber?: number;
      side?: string;
    }) =>
      prisma.comment.create({
        data: {
          ...data,
          status: 'ACTIVE',
        },
      }),
  },
  
  // Usage helpers
  usage: {
    track: (data: {
      type: 'DIFF_CREATE' | 'DIFF_VIEW' | 'API_CALL' | 'FILE_UPLOAD' | 'EXPORT' | 'SHARE';
      metadata?: any;
      ipAddress?: string;
      userAgent?: string;
    }) =>
      prisma.usage.create({
        data,
      }),
    
    getStats: (startDate?: Date) =>
      prisma.usage.groupBy({
        by: ['type'],
        where: startDate ? {
          createdAt: { gte: startDate },
        } : undefined,
        _count: true,
      }),
  },
};

// Export types
export type { Diff, Collection, Comment, Usage } from '@prisma/client';