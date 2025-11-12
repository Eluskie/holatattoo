import { prisma } from '../src';

async function deleteSeedStudio() {
  console.log('🗑️  Deleting seed studio...\n');

  const seedStudioId = '0a688ba6-909c-4396-aca3-2a37ef3c3ca1';

  // Check if there are any conversations still linked to it
  const remainingConversations = await prisma.conversation.count({
    where: { studioId: seedStudioId }
  });

  if (remainingConversations > 0) {
    console.log(`⚠️  Warning: ${remainingConversations} conversation(s) still linked to seed studio.`);
    console.log('    Transferring them to Minka first...\n');
    
    const minkaStudioId = 'da9473b1-2230-4623-a5ca-00d2dc9eeb51';
    await prisma.conversation.updateMany({
      where: { studioId: seedStudioId },
      data: { studioId: minkaStudioId }
    });
    
    console.log(`✅ Transferred ${remainingConversations} conversation(s) to Minka.\n`);
  }

  // Delete BotConfig first (due to foreign key constraint)
  const deletedBotConfig = await prisma.botConfig.deleteMany({
    where: { studioId: seedStudioId }
  });
  console.log(`✅ Deleted ${deletedBotConfig.count} BotConfig record(s)`);

  // Delete the Studio
  const deletedStudio = await prisma.studio.delete({
    where: { id: seedStudioId }
  });
  console.log(`✅ Deleted studio: ${deletedStudio.name}`);

  console.log('\n🎉 Seed studio successfully deleted!');
  console.log('   Now all new conversations will go to Minka exclusively.');

  await prisma.$disconnect();
}

deleteSeedStudio().catch(console.error);
