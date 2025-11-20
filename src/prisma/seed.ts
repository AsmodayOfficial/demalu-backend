import { PrismaClient } from '@prisma/client';
import { citySeed }  from './seed/city.seed';
import { userSeed } from './seed/user.seed';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🚀 Starting seeding...");
    await userSeed();
    
    // Run them sequentially
    await citySeed();
    console.log("🎉 Seeding completed!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();