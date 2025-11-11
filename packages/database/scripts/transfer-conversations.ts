#!/usr/bin/env tsx
/**
 * Transfer conversations from seed studio to real user studio
 * Run with: npx tsx packages/database/scripts/transfer-conversations.ts
 */

import { prisma } from '../src/index'

async function transferConversations() {
  console.log('🔄 Transferring conversations to your studio...\n')

  // Find the seed studio (the one with all the conversations)
  const seedStudio = await prisma.studio.findFirst({
    where: {
      name: 'Hola Tattoo Studio',
      userId: '00000000-0000-0000-0000-000000000000'
    }
  })

  // Find YOUR studio (Minka)
  const yourStudio = await prisma.studio.findFirst({
    where: {
      name: 'Minka'
    }
  })

  if (!seedStudio) {
    console.log('❌ Seed studio not found')
    return
  }

  if (!yourStudio) {
    console.log('❌ Your studio (Minka) not found')
    return
  }

  console.log(`📍 From: ${seedStudio.name} (${seedStudio.id})`)
  console.log(`📍 To: ${yourStudio.name} (${yourStudio.id})`)
  console.log(`   Owner: ${yourStudio.userId}\n`)

  // Get all conversations from seed studio
  const conversations = await prisma.conversation.findMany({
    where: {
      studioId: seedStudio.id
    }
  })

  console.log(`Found ${conversations.length} conversation(s) to transfer\n`)

  if (conversations.length === 0) {
    console.log('No conversations to transfer!')
    return
  }

  // Transfer them
  const result = await prisma.conversation.updateMany({
    where: {
      studioId: seedStudio.id
    },
    data: {
      studioId: yourStudio.id
    }
  })

  console.log(`✅ Transferred ${result.count} conversation(s) to your studio!`)
  console.log('\n🎉 Done! Refresh your dashboard to see the conversations.')
  console.log('\n💡 Next steps:')
  console.log('   1. Delete the seed studio if you don\'t need it')
  console.log('   2. Make sure your studio (Minka) has a BotConfig')
}

transferConversations()
  .then(() => {
    console.log('\n✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

