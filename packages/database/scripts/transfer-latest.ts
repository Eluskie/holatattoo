import { prisma } from '../src';

async function transferLatest() {
  console.log('🔄 Transferring latest conversations to Minka...\n');

  const minkaStudioId = 'da9473b1-2230-4623-a5ca-00d2dc9eeb51';
  const seedStudioId = '0a688ba6-909c-4396-aca3-2a37ef3c3ca1';

  // Get the 2 conversations to transfer
  const conversationsToTransfer = [
    'e3440fb4-48fb-4fcf-9bf9-62dd608ed32a', // active, 2 messages
    '56acc25f-7d2a-45aa-a407-eae7b8e29107'  // qualified, 20 messages
  ];

  console.log(`Transferring ${conversationsToTransfer.length} conversations...\n`);

  for (const convId of conversationsToTransfer) {
    const conv = await prisma.conversation.findUnique({
      where: { id: convId },
      select: {
        id: true,
        status: true,
        userPhone: true,
        messages: true
      }
    });

    if (conv) {
      const messageCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
      console.log(`  ✅ ${convId}`);
      console.log(`     Status: ${conv.status}, Messages: ${messageCount}`);
    }
  }

  // Transfer them
  await prisma.conversation.updateMany({
    where: {
      id: { in: conversationsToTransfer }
    },
    data: {
      studioId: minkaStudioId
    }
  });

  console.log(`\n✅ Transferred ${conversationsToTransfer.length} conversations to Minka!`);
  console.log('\n💡 Refresh your dashboard to see them.');

  await prisma.$disconnect();
}

transferLatest().catch(console.error);
