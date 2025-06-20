import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MigrationOptions {
  name?: string;
  skipGenerate?: boolean;
  skipDeploy?: boolean;
}

interface MigrationStatus {
  applied: string[];
  pending: string[];
  current: string;
}

export class MigrationManager {
  private prismaPath: string;

  constructor() {
    this.prismaPath = join(__dirname, '..', 'prisma');
  }

  /**
   * Create a new migration
   */
  async createMigration(options: MigrationOptions = {}): Promise<void> {
    const { name, skipGenerate = false } = options;
    
    console.log('📝 Creating new migration...');
    
    try {
      // Generate Prisma Client if needed
      if (!skipGenerate) {
        await this.generate();
      }

      // Create migration
      const migrationName = name || `migration_${Date.now()}`;
      const command = `prisma migrate dev --name ${migrationName} --create-only`;
      
      execSync(command, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });

      console.log(`✅ Migration "${migrationName}" created successfully`);
    } catch (error) {
      console.error('❌ Failed to create migration:', error);
      throw error;
    }
  }

  /**
   * Apply pending migrations
   */
  async applyMigrations(options: { force?: boolean } = {}): Promise<void> {
    const { force = false } = options;
    
    console.log('🚀 Applying migrations...');
    
    try {
      const command = force
        ? 'prisma migrate deploy --skip-seed'
        : 'prisma migrate dev';
      
      execSync(command, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });

      console.log('✅ Migrations applied successfully');
    } catch (error) {
      console.error('❌ Failed to apply migrations:', error);
      throw error;
    }
  }

  /**
   * Reset database and apply all migrations
   */
  async reset(options: { skipSeed?: boolean } = {}): Promise<void> {
    const { skipSeed = false } = options;
    
    console.log('🔄 Resetting database...');
    
    const confirmReset = process.env.NODE_ENV === 'production' 
      ? false 
      : true; // In production, require explicit confirmation

    if (!confirmReset && process.env.FORCE_RESET !== 'true') {
      throw new Error('Database reset is not allowed in production without FORCE_RESET=true');
    }

    try {
      const command = skipSeed
        ? 'prisma migrate reset --skip-seed --force'
        : 'prisma migrate reset --force';
      
      execSync(command, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });

      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      throw error;
    }
  }

  /**
   * Generate Prisma Client
   */
  async generate(): Promise<void> {
    console.log('🔧 Generating Prisma Client...');
    
    try {
      execSync('prisma generate', {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });

      console.log('✅ Prisma Client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma Client:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    try {
      const output = execSync('prisma migrate status --schema=./prisma/schema.prisma', {
        cwd: join(__dirname, '..'),
        encoding: 'utf8',
      });

      // Parse the output to extract migration information
      const lines = output.split('\n');
      const applied: string[] = [];
      const pending: string[] = [];
      let current = '';

      lines.forEach(line => {
        if (line.includes('✔') || line.includes('applied')) {
          const match = line.match(/(\d{14}_\w+)/);
          if (match) applied.push(match[1]);
        } else if (line.includes('⏳') || line.includes('pending')) {
          const match = line.match(/(\d{14}_\w+)/);
          if (match) pending.push(match[1]);
        }
        if (line.includes('current')) {
          const match = line.match(/(\d{14}_\w+)/);
          if (match) current = match[1];
        }
      });

      return { applied, pending, current };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return { applied: [], pending: [], current: '' };
    }
  }

  /**
   * Create a rollback migration
   */
  async createRollback(migrationName: string): Promise<void> {
    console.log(`🔙 Creating rollback for migration: ${migrationName}`);
    
    // This is a simplified version - in practice, you'd need to:
    // 1. Analyze the migration SQL
    // 2. Generate inverse operations
    // 3. Create a new migration with the rollback SQL
    
    const rollbackName = `rollback_${migrationName}`;
    await this.createMigration({ name: rollbackName });
    
    console.log(`✅ Rollback migration "${rollbackName}" created`);
    console.log('⚠️  Please review and edit the generated migration file');
  }

  /**
   * Validate schema against database
   */
  async validateSchema(): Promise<boolean> {
    console.log('🔍 Validating schema...');
    
    try {
      execSync('prisma validate', {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });

      console.log('✅ Schema is valid');
      return true;
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      return false;
    }
  }

  /**
   * Create a database backup (PostgreSQL specific)
   */
  async createBackup(filename?: string): Promise<string> {
    const backupName = filename || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const backupPath = join(this.prismaPath, 'backups', backupName);
    
    console.log(`💾 Creating database backup: ${backupName}`);
    
    try {
      // Ensure backup directory exists
      execSync(`mkdir -p ${join(this.prismaPath, 'backups')}`, { stdio: 'inherit' });
      
      // Extract database URL components
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL not set');
      
      // Use pg_dump for PostgreSQL
      if (dbUrl.includes('postgresql') || dbUrl.includes('postgres')) {
        execSync(`pg_dump ${dbUrl} > ${backupPath}`, { stdio: 'inherit' });
      } else {
        throw new Error('Backup is currently only supported for PostgreSQL');
      }
      
      console.log(`✅ Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup (PostgreSQL specific)
   */
  async restoreBackup(backupPath: string): Promise<void> {
    console.log(`♻️  Restoring database from: ${backupPath}`);
    
    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL not set');
      
      // Use psql for PostgreSQL
      if (dbUrl.includes('postgresql') || dbUrl.includes('postgres')) {
        execSync(`psql ${dbUrl} < ${backupPath}`, { stdio: 'inherit' });
      } else {
        throw new Error('Restore is currently only supported for PostgreSQL');
      }
      
      console.log('✅ Database restored successfully');
    } catch (error) {
      console.error('❌ Failed to restore backup:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const migrations = new MigrationManager();

// CLI-style interface for running migrations
if (require.main === module) {
  const command = process.argv[2];
  const manager = new MigrationManager();

  async function run() {
    try {
      switch (command) {
        case 'create':
          await manager.createMigration({ name: process.argv[3] });
          break;
        case 'apply':
          await manager.applyMigrations();
          break;
        case 'reset':
          await manager.reset();
          break;
        case 'status':
          const status = await manager.getStatus();
          console.log('Migration Status:', status);
          break;
        case 'validate':
          await manager.validateSchema();
          break;
        case 'backup':
          await manager.createBackup(process.argv[3]);
          break;
        case 'restore':
          if (!process.argv[3]) {
            console.error('Please provide backup file path');
            process.exit(1);
          }
          await manager.restoreBackup(process.argv[3]);
          break;
        default:
          console.log(`
Migration Manager - Available commands:

  create [name]     Create a new migration
  apply             Apply pending migrations
  reset             Reset database and reapply migrations
  status            Show migration status
  validate          Validate schema
  backup [name]     Create database backup
  restore <path>    Restore from backup

Example:
  npm run db:migrate create add_user_table
  npm run db:migrate apply
          `);
      }
    } catch (error) {
      console.error('Command failed:', error);
      process.exit(1);
    }
  }

  run();
}