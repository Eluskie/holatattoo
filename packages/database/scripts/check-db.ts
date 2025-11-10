import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database contents...\n');

  // Get bot config
  const botConfigs = await prisma.botConfig.findMany({
    include: { studio: true }
  });

  console.log('📝 Bot Configs:');
  botConfigs.forEach(config => {
    console.log(`\nStudio: ${config.studio.name}`);
    console.log(`Welcome Message: ${config.welcomeMessage}`);
    console.log(`Questions (${config.questions.length}):`);
    (config.questions as any[]).forEach((q: any, i: number) => {
      console.log(`  ${i + 1}. [${q.field}] ${q.text}`);
      if (q.choices) console.log(`     Choices: ${q.choices.join(', ')}`);
    });
  });

  // Get conversations
  const conversations = await prisma.conversation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('\n\n💬 Recent Conversations:');
  conversations.forEach((conv, i) => {
    console.log(`\n${i + 1}. Phone: ${conv.userPhone}`);
    console.log(`   Status: ${conv.status}`);
    console.log(`   Step: ${conv.currentStep}`);
    console.log(`   Data: ${JSON.stringify(conv.collectedData)}`);
    console.log(`   Created: ${conv.createdAt}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
