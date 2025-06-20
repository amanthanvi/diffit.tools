import { createCallerFactory } from '../../trpc';
import { appRouter } from '../../router';
import { createContext } from '../../context';
import type { Context } from '../../types';

// Mock context
const mockContext: Context = {
  user: {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    plan: 'FREE',
    maxDiffsPerMonth: 50,
    maxFileSizeMB: 5,
    maxCollections: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  apiKey: null,
  db: {} as any, // Mock database
  req: new Request('http://localhost'),
  res: new Response(),
  redis: undefined,
};

const createCaller = createCallerFactory(appRouter);

describe('Auth Router', () => {
  it('should get current user', async () => {
    const caller = createCaller(mockContext);
    const result = await caller.auth.me();
    
    expect(result.user).toEqual(mockContext.user);
    expect(typeof result.usage).toBe('number');
  });
  
  it('should update user profile', async () => {
    const caller = createCaller(mockContext);
    const mockUpdate = jest.fn().mockResolvedValue({
      ...mockContext.user,
      displayName: 'Updated Name',
    });
    
    mockContext.db.user = {
      update: mockUpdate,
    };
    
    const result = await caller.auth.updateProfile({
      displayName: 'Updated Name',
      darkMode: true,
    });
    
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: expect.objectContaining({
        displayName: 'Updated Name',
        darkMode: true,
      }),
    });
    expect(result.user.displayName).toBe('Updated Name');
  });
  
  it('should require authentication for protected endpoints', async () => {
    const unauthContext: Context = {
      ...mockContext,
      user: null,
    };
    
    const caller = createCaller(unauthContext);
    
    await expect(caller.auth.me()).rejects.toThrow('You must be logged in');
  });
});