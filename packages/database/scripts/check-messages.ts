#!/usr/bin/env tsx
/**
 * Check if conversations have messages stored
 * Run with: npx tsx packages/database/scripts/check-messages.ts
 */

import { prisma } from '../src/index'

async function checkMessages() {
  console.log('🔍 Checking conversation messages...\n')

  const conversations = await prisma.conversation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      studio: {
        select: { name: true }
      }
    }
  })

  if (conversations.length === 0) {
    console.log('No conversations found.')
    return
  }

  conversations.forEach((conv, index) => {
    console.log(`${index + 1}. Conversation ${conv.id}`)
    console.log(`   Phone: ${conv.userPhone}`)
    console.log(`   Studio: ${conv.studio.name}`)
    console.log(`   Status: ${conv.status}`)
    console.log(`   Created: ${conv.createdAt.toISOString()}`)
    console.log(`   Messages type: ${typeof conv.messages}`)
    console.log(`   Messages value:`, conv.messages)
    
    if (Array.isArray(conv.messages)) {
      console.log(`   ✅ Messages count: ${conv.messages.length}`)
      if (conv.messages.length > 0) {
        console.log(`   First message:`, conv.messages[0])
      }
    } else {
      console.log(`   ❌ Messages is not an array!`)
    }
    console.log('')
  })
}

checkMessages()
  .then(() => {
    console.log('✅ Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

