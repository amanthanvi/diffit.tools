import { createCallerFactory } from '../../trpc';
import { appRouter } from '../../router';
import type { Context } from '../../types';

describe('Diff Flow Integration', () => {
  let mockContext: Context;
  let mockDb: any;
  
  beforeEach(() => {
    // Mock database
    mockDb = {
      diff: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      diffAnalytics: {
        create: jest.fn(),
        update: jest.fn(),
      },
      comment: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      usage: {
        create: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };
    
    mockContext = {
      user: {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        plan: 'PRO',
        maxDiffsPerMonth: 500,
        maxFileSizeMB: 50,
        maxCollections: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      apiKey: null,
      db: mockDb,
      req: new Request('http://localhost'),
      res: new Response(),
      redis: {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(undefined),
        ttl: jest.fn().mockResolvedValue(-1),
      },
    };
  });
  
  const createCaller = createCallerFactory(appRouter);
  
  it('should complete full diff workflow', async () => {
    const caller = createCaller(mockContext);
    
    // 1. Create a diff
    const newDiff = {
      id: 'diff-123',
      slug: 'abc123',
      userId: 'user-123',
      title: 'Test Diff',
      description: 'Test description',
      leftContent: 'Hello World',
      rightContent: 'Hello Universe',
      leftTitle: 'old.txt',
      rightTitle: 'new.txt',
      type: 'TEXT' as const,
      visibility: 'PUBLIC' as const,
      ignoreWhitespace: false,
      ignoreCase: false,
      contextLines: 3,
      status: 'ACTIVE' as const,
      viewCount: 0,
      expiresAt: null,
      collectionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockDb.diff.count.mockResolvedValue(0); // No diffs this month
    mockDb.diff.create.mockResolvedValue({
      ...newDiff,
      user: mockContext.user,
    });
    mockDb.diffAnalytics.create.mockResolvedValue({
      id: 'analytics-123',
      diffId: 'diff-123',
    });
    
    const createResult = await caller.diff.create({
      title: 'Test Diff',
      description: 'Test description',
      leftContent: 'Hello World',
      rightContent: 'Hello Universe',
      leftTitle: 'old.txt',
      rightTitle: 'new.txt',
      type: 'TEXT',
      visibility: 'PUBLIC',
    });
    
    expect(createResult.slug).toBe('abc123');
    expect(createResult.title).toBe('Test Diff');
    expect(mockDb.diff.create).toHaveBeenCalled();
    expect(mockDb.diffAnalytics.create).toHaveBeenCalled();
    
    // 2. Get the diff
    mockDb.diff.findUnique.mockResolvedValue({
      ...newDiff,
      user: mockContext.user,
      files: [],
      analytics: { id: 'analytics-123' },
      _count: { comments: 0 },
    });
    
    const getResult = await caller.diff.get({ slug: 'abc123' });
    
    expect(getResult.slug).toBe('abc123');
    expect(mockDb.diff.update).toHaveBeenCalledWith({
      where: { id: 'diff-123' },
      data: { viewCount: { increment: 1 } },
    });
    
    // 3. Add a comment
    mockDb.diff.findUnique.mockResolvedValue({
      ...newDiff,
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    });
    mockDb.comment.create.mockResolvedValue({
      id: 'comment-123',
      diffId: 'diff-123',
      userId: 'user-123',
      content: 'Great changes!',
      parentId: null,
      lineNumber: null,
      side: null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockContext.user,
    });
    
    const commentResult = await caller.comment.create({
      diffId: 'diff-123',
      content: 'Great changes!',
    });
    
    expect(commentResult.content).toBe('Great changes!');
    expect(mockDb.comment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        diffId: 'diff-123',
        userId: 'user-123',
        content: 'Great changes!',
      }),
      include: { user: expect.any(Object) },
    });
    
    // 4. List diffs
    mockDb.diff.findMany.mockResolvedValue([
      {
        ...newDiff,
        user: mockContext.user,
        _count: { comments: 1 },
      },
    ]);
    mockDb.diff.count.mockResolvedValue(1);
    
    const listResult = await caller.diff.list({
      pagination: { page: 1, limit: 20 },
      filter: { type: 'TEXT' },
    });
    
    expect(listResult.items).toHaveLength(1);
    expect(listResult.total).toBe(1);
    expect(listResult.hasMore).toBe(false);
    
    // 5. Export the diff
    mockDb.diff.findUnique.mockResolvedValue({
      ...newDiff,
      user: mockContext.user,
      files: [],
      analytics: { id: 'analytics-123' },
      _count: { comments: 1 },
    });
    
    const exportResult = await caller.diff.export({
      slug: 'abc123',
      format: 'json',
    });
    
    expect(exportResult.format).toBe('json');
    expect(exportResult.mimeType).toBe('application/json');
    expect(exportResult.filename).toContain('diff-abc123.json');
  });
  
  it('should enforce plan limits', async () => {
    const caller = createCaller(mockContext);
    
    // Set user to FREE plan
    mockContext.user.plan = 'FREE';
    mockContext.user.maxDiffsPerMonth = 50;
    
    // Mock that user has reached limit
    mockDb.diff.count.mockResolvedValue(50);
    
    await expect(
      caller.diff.create({
        leftContent: 'Hello',
        rightContent: 'World',
      })
    ).rejects.toThrow("You've reached your monthly diff limit (50)");
  });
  
  it('should enforce visibility permissions', async () => {
    const caller = createCaller(mockContext);
    
    // Try to access private diff from different user
    const privateDiff = {
      id: 'diff-456',
      slug: 'xyz789',
      userId: 'other-user',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
    };
    
    mockDb.diff.findUnique.mockResolvedValue(privateDiff);
    
    await expect(
      caller.diff.get({ slug: 'xyz789' })
    ).rejects.toThrow('This diff is private');
  });
});