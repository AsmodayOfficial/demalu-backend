import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    let connectionString = process.env.DATABASE_URL;

    // 1. Validation
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in .env file');
    }

    // 2. Clean up string (Remove quotes or accidental spaces)
    connectionString = connectionString.trim();

    // Debug: Log the URL structure (hiding password) to ensure it loaded
    // Example log: postgresql://postgres:*****@localhost:5432/mydb
    const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':*****@');
    // console.log(`Connecting to: ${maskedUrl}`); // Uncomment if needed for debugging

    if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
    }

    // 3. Create Pool
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established (via pg-adapter)');
    } catch (error) {
      this.logger.error('Failed to connect to database', error.stack);
      // Do not swallow the error, let the app fail fast
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}