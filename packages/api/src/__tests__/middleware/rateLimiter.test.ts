import { rateLimiter } from '../../middleware/rateLimiter';
import { middleware } from '../../trpc';
import type { Context } from '../../types';

describe('Rate Limiter Middleware', () => {
  let mockRedis: any;
  let mockContext: Context;
  
  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };
    
    mockContext = {
      user: { id: 'user-123' } as any,
      apiKey: null,
      db: {} as any,
      req: new Request('http://localhost'),
      res: new Response(),
      redis: mockRedis,
    };
  });
  
  it('should allow requests within rate limit', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify([Date.now() - 1000]));
    
    const limiter = rateLimiter({ windowMs: 60000, max: 10 });
    const next = jest.fn().mockResolvedValue({ success: true });
    
    const result = await limiter({
      ctx: mockContext,
      next,
      path: 'test.endpoint',
      type: 'query',
    } as any);
    
    expect(next).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
  
  it('should reject requests exceeding rate limit', async () => {
    const timestamps = Array.from({ length: 10 }, (_, i) => Date.now() - i * 100);
    mockRedis.get.mockResolvedValue(JSON.stringify(timestamps));
    
    const limiter = rateLimiter({ windowMs: 60000, max: 10 });
    const next = jest.fn();
    
    await expect(
      limiter({
        ctx: mockContext,
        next,
        path: 'test.endpoint',
        type: 'query',
      } as any)
    ).rejects.toThrow('Rate limit exceeded');
    
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should use different keys for different users', async () => {
    mockRedis.get.mockResolvedValue(null);
    
    const limiter = rateLimiter({ windowMs: 60000, max: 10 });
    const next = jest.fn().mockResolvedValue({ success: true });
    
    // Test with user context
    await limiter({
      ctx: mockContext,
      next,
      path: 'test.endpoint',
      type: 'query',
    } as any);
    
    expect(mockRedis.get).toHaveBeenCalledWith(
      expect.stringContaining('rate:user:user-123')
    );
    
    // Test with API key context
    mockContext.user = null;
    mockContext.apiKey = { id: 'api-key-123' } as any;
    
    await limiter({
      ctx: mockContext,
      next,
      path: 'test.endpoint',
      type: 'query',
    } as any);
    
    expect(mockRedis.get).toHaveBeenCalledWith(
      expect.stringContaining('rate:api:api-key-123')
    );
  });
  
  it('should add rate limit headers to response', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify([Date.now() - 1000]));
    
    const limiter = rateLimiter({ windowMs: 60000, max: 10 });
    const next = jest.fn().mockResolvedValue({ success: true });
    
    await limiter({
      ctx: mockContext,
      next,
      path: 'test.endpoint',
      type: 'query',
    } as any);
    
    expect(mockContext.res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(mockContext.res.headers.get('X-RateLimit-Remaining')).toBe('8');
    expect(mockContext.res.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });
});