import * as bcrypt from 'bcryptjs';
import prisma from './prismaClient';

export async function userSeed() {
  console.log('[user.seed] Starting...');

  // Generate a real hash for "password123" so login works
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      username: 'user1',
      passwordHash: passwordHash,
      displayName: 'User One',
      phone: '+7 777 777 7777',
      bio: 'Test user one',
    },
    {
      username: 'user2',
      passwordHash: passwordHash,
      displayName: 'User Two',
      phone: '+7 777 777 7771',
      bio: 'Test user two',
    },
    {
      username: 'user3',
      passwordHash: passwordHash,
      displayName: 'User Three',
      phone: '+7 777 777 7772',
      bio: 'Test user three',
    },
  ];

  console.log(`[user.seed] Processing ${users.length} users...`);

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash: user.passwordHash, 
        phone: user.phone,
        displayName: user.displayName,
      },
      create: {
        username: user.username,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        phone: user.phone,
        bio: user.bio,
      },
    });
  }

  console.log('[user.seed] done');
}