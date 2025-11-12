import { prisma } from '../src';

async function checkStudios() {
  console.log('🏢 Checking all studios...\n');

  const studios = await prisma.studio.findMany({
    include: {
      user: {
        select: {
          email: true
        }
      },
      _count: {
        select: {
          conversations: true
        }
      }
    }
  });

  studios.forEach((studio, index) => {
    console.log(`${index + 1}. Studio: ${studio.name}`);
    console.log(`   ID: ${studio.id}`);
    console.log(`   WhatsApp Number: ${studio.whatsappNumber}`);
    console.log(`   Owner Email: ${studio.user.email}`);
    console.log(`   Conversations: ${studio._count.conversations}`);
    console.log(`   Created: ${studio.createdAt.toISOString()}\n`);
  });

  await prisma.$disconnect();
}

checkStudios().catch(console.error);
