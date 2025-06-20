import { PrismaClient } from '@prisma/client';

interface ConnectionPoolOptions {
  connectionLimit?: number;
  maxIdleTime?: number;
  queueLimit?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prismaClient: PrismaClient;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  private constructor(options?: ConnectionPoolOptions) {
    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: this.getDatabaseUrl(),
        },
      },
      log: this.getLogLevel(),
      errorFormat: 'pretty',
    });

    // Set up connection pool parameters via connection string
    if (options) {
      this.applyConnectionPoolOptions(options);
    }

    // Handle graceful shutdown
    this.setupShutdownHandlers();
  }

  public static getInstance(options?: ConnectionPoolOptions): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(options);
    }
    return DatabaseConnection.instance;
  }

  private getDatabaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Add connection pool parameters to the URL
    const poolSize = process.env.DATABASE_POOL_SIZE || '20';
    const connectionTimeout = process.env.DATABASE_CONNECTION_TIMEOUT || '5';
    
    // Parse and modify the URL to add pool parameters
    const urlObj = new URL(url);
    urlObj.searchParams.set('connection_limit', poolSize);
    urlObj.searchParams.set('connect_timeout', connectionTimeout);
    urlObj.searchParams.set('pool_timeout', '10');
    urlObj.searchParams.set('socket_timeout', '10');
    
    // Add pgbouncer mode if specified
    if (process.env.DATABASE_PGBOUNCER === 'true') {
      urlObj.searchParams.set('pgbouncer', 'true');
      urlObj.searchParams.set('statement_cache_size', '0');
    }

    return urlObj.toString();
  }

  private getLogLevel(): Array<'query' | 'info' | 'warn' | 'error'> {
    const env = process.env.NODE_ENV;
    const logLevel = process.env.DATABASE_LOG_LEVEL;

    if (logLevel) {
      return logLevel.split(',') as any;
    }

    switch (env) {
      case 'development':
        return ['query', 'info', 'warn', 'error'];
      case 'test':
        return ['error'];
      case 'production':
        return ['error', 'warn'];
      default:
        return ['error'];
    }
  }

  private applyConnectionPoolOptions(options: ConnectionPoolOptions): void {
    // These would typically be applied via connection string parameters
    // as Prisma doesn't expose direct pool configuration
    const { connectionLimit = 20, maxIdleTime = 30, queueLimit = 0 } = options;
    
    // Log the intended configuration
    console.log('Database connection pool configuration:', {
      connectionLimit,
      maxIdleTime,
      queueLimit,
    });
  }

  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, closing database connections...`);
      await this.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.prismaClient.$connect();
      this.isConnected = true;
      this.connectionAttempts = 0;
      console.log('✅ Database connected successfully');
    } catch (error) {
      this.connectionAttempts++;
      console.error(`❌ Database connection attempt ${this.connectionAttempts} failed:`, error);

      if (this.connectionAttempts < this.maxRetries) {
        console.log(`Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        this.retryDelay *= 2; // Exponential backoff
        return this.connect();
      }

      throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.prismaClient.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }

  public getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    return this.prismaClient;
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      // Simple query to check connection
      await this.prismaClient.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getConnectionStats(): Promise<{
    isConnected: boolean;
    connectionAttempts: number;
    poolSize: number;
    activeConnections?: number;
  }> {
    const poolSize = parseInt(process.env.DATABASE_POOL_SIZE || '20');
    
    // In a real scenario, you might query pg_stat_activity or similar
    // to get actual connection counts
    let activeConnections: number | undefined;
    
    if (this.isConnected && process.env.NODE_ENV !== 'test') {
      try {
        const result = await this.prismaClient.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
            AND state = 'active'
        `;
        activeConnections = Number(result[0]?.count || 0);
      } catch {
        // Ignore errors for non-PostgreSQL databases
      }
    }

    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      poolSize,
      activeConnections,
    };
  }

  // Transaction helper with retry logic
  public async transaction<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    }
  ): Promise<T> {
    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prismaClient.$transaction(fn, options);
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const message = error.message.toLowerCase();
    
    // Common retryable database errors
    return (
      message.includes('deadlock') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('too many clients') ||
      message.includes('serialization failure')
    );
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();

// Export convenience functions
export async function connectDatabase(options?: ConnectionPoolOptions): Promise<void> {
  const connection = DatabaseConnection.getInstance(options);
  await connection.connect();
}

export async function disconnectDatabase(): Promise<void> {
  const connection = DatabaseConnection.getInstance();
  await connection.disconnect();
}

export function getDatabaseClient(): PrismaClient {
  const connection = DatabaseConnection.getInstance();
  return connection.getClient();
}

export async function checkDatabaseHealth() {
  const connection = DatabaseConnection.getInstance();
  return connection.healthCheck();
}

export async function getDatabaseStats() {
  const connection = DatabaseConnection.getInstance();
  return connection.getConnectionStats();
}

// Export transaction helper
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>,
  options?: Parameters<DatabaseConnection['transaction']>[1]
): Promise<T> {
  const connection = DatabaseConnection.getInstance();
  return connection.transaction(fn, options);
}