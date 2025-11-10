import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all conversations from Supabase...\n');

  const result = await prisma.conversation.deleteMany({});

  console.log(`✅ Deleted ${result.count} conversations`);
  console.log('Ready for fresh testing!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
