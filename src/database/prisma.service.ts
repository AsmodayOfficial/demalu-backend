import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'; // Standard import recommended
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Create the Postgres Pool
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });

    // 2. Create the Prisma Adapter
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter to the PrismaClient constructor via super()
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}