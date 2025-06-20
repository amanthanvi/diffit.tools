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
  // User helpers
  user: {
    findByClerkId: (clerkId: string) =>
      prisma.user.findUnique({
        where: { clerkId },
        include: {
          apiKeys: {
            where: { status: 'ACTIVE' },
          },
        },
      }),
    
    findByEmail: (email: string) =>
      prisma.user.findUnique({
        where: { email },
      }),
    
    updateLastActive: (userId: string) =>
      prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      }),
    
    getUsageStats: (userId: string, startDate?: Date) =>
      prisma.usage.groupBy({
        by: ['type'],
        where: {
          userId,
          createdAt: startDate ? { gte: startDate } : undefined,
        },
        _count: true,
      }),
  },
  
  // Diff helpers
  diff: {
    findBySlug: (slug: string) =>
      prisma.diff.findUnique({
        where: { slug },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          files: true,
          analytics: true,
          _count: {
            select: { comments: true },
          },
        },
      }),
    
    incrementViewCount: async (diffId: string) => {
      const [diff, analytics] = await prisma.$transaction([
        prisma.diff.update({
          where: { id: diffId },
          data: { viewCount: { increment: 1 } },
        }),
        prisma.diffAnalytics.upsert({
          where: { diffId },
          create: {
            diffId,
            totalViews: 1,
            uniqueViews: 1,
            lastViewedAt: new Date(),
          },
          update: {
            totalViews: { increment: 1 },
            lastViewedAt: new Date(),
          },
        }),
      ]);
      
      return { diff, analytics };
    },
    
    findPublicDiffs: (options?: {
      limit?: number;
      offset?: number;
      type?: string;
      search?: string;
    }) => {
      const { limit = 20, offset = 0, type, search } = options || {};
      
      return prisma.diff.findMany({
        where: {
          visibility: 'PUBLIC',
          status: 'ACTIVE',
          type: type as any,
          OR: search
            ? [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },
    
    cleanupExpired: () =>
      prisma.diff.updateMany({
        where: {
          expiresAt: { lte: new Date() },
          status: 'ACTIVE',
        },
        data: { status: 'EXPIRED' },
      }),
  },
  
  // Collection helpers
  collection: {
    findBySlug: (slug: string) =>
      prisma.collection.findUnique({
        where: { slug },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          diffs: {
            where: { status: 'ACTIVE' },
            include: {
              _count: {
                select: { comments: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { diffs: true },
          },
        },
      }),
    
    findUserCollections: (userId: string) =>
      prisma.collection.findMany({
        where: { userId },
        include: {
          _count: {
            select: { diffs: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
  },
  
  // API Key helpers
  apiKey: {
    validate: async (key: string) => {
      const apiKey = await prisma.apiKey.findUnique({
        where: { key, status: 'ACTIVE' },
        include: { user: true },
      });
      
      if (!apiKey) return null;
      
      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { status: 'EXPIRED' },
        });
        return null;
      }
      
      // Update last used
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
      
      return apiKey;
    },
    
    checkRateLimit: async (apiKeyId: string) => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const usageCount = await prisma.usage.count({
        where: {
          apiKeyId,
          type: 'API_CALL',
          createdAt: { gte: hourAgo },
        },
      });
      
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
        select: { rateLimitPerHour: true },
      });
      
      return {
        used: usageCount,
        limit: apiKey?.rateLimitPerHour || 100,
        remaining: Math.max(0, (apiKey?.rateLimitPerHour || 100) - usageCount),
      };
    },
  },
  
  // Usage tracking helpers
  usage: {
    track: (data: {
      userId?: string;
      apiKeyId?: string;
      type: string;
      metadata?: any;
      ipAddress?: string;
      userAgent?: string;
    }) =>
      prisma.usage.create({
        data: {
          ...data,
          type: data.type as any,
        },
      }),
    
    getMonthlyStats: async (userId: string) => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const stats = await prisma.usage.groupBy({
        by: ['type'],
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
        _count: true,
      });
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { maxDiffsPerMonth: true },
      });
      
      const diffCount = stats.find(s => s.type === 'DIFF_CREATE')?._count || 0;
      
      return {
        diffsCreated: diffCount,
        diffsRemaining: user?.maxDiffsPerMonth === -1 
          ? Infinity 
          : Math.max(0, (user?.maxDiffsPerMonth || 100) - diffCount),
        breakdown: stats,
      };
    },
  },
};

// Export types
export type * from '@prisma/client';