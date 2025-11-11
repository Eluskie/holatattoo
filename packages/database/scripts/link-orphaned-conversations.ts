#!/usr/bin/env tsx
/**
 * Script to link orphaned conversations to studios
 * Run with: npx tsx packages/database/scripts/link-orphaned-conversations.ts
 */

import { prisma } from '../src/index'

async function linkOrphanedConversations() {
  console.log('🔍 Looking for orphaned conversations...\n')

  // Get all studios
  const studios = await prisma.studio.findMany()

  if (studios.length === 0) {
    console.log('❌ No studios found. Please create a studio first.')
    return
  }

  console.log(`Found ${studios.length} studio(s):\n`)
  
  for (const studio of studios) {
    console.log(`📍 Studio: ${studio.name}`)
    console.log(`   WhatsApp: ${studio.whatsappNumber}`)
    console.log(`   Owner: ${studio.userId}\n`)

    if (!studio.whatsappNumber) {
      console.log('   ⚠️  No WhatsApp number configured. Skipping...\n')
      continue
    }

    // Check conversations that ARE linked to this studio
    const linkedConversations = await prisma.conversation.findMany({
      where: {
        studioId: studio.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`   ✅ ${linkedConversations.length} conversation(s) already linked to this studio`)
    
    if (linkedConversations.length > 0) {
      console.log('   Recent conversations:')
      linkedConversations.slice(0, 3).forEach(conv => {
        console.log(`      - ${conv.userPhone} (${conv.status}) - ${conv.createdAt.toISOString()}`)
      })
    }
    console.log('')
  }

  // Show ALL conversations in database to debug
  console.log('\n📊 All Conversations in Database:')
  console.log('─'.repeat(60))
  const allConversations = await prisma.conversation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      studio: {
        select: {
          name: true,
          whatsappNumber: true,
          userId: true
        }
      }
    }
  })

  if (allConversations.length === 0) {
    console.log('No conversations found in database.')
  } else {
    allConversations.forEach((conv, index) => {
      console.log(`\n${index + 1}. Conversation ID: ${conv.id}`)
      console.log(`   Phone: ${conv.userPhone}`)
      console.log(`   Status: ${conv.status}`)
      console.log(`   Created: ${conv.createdAt.toISOString()}`)
      console.log(`   Studio: ${conv.studio.name}`)
      console.log(`   Studio WhatsApp: ${conv.studio.whatsappNumber}`)
      console.log(`   Studio Owner: ${conv.studio.userId}`)
      const messageCount = Array.isArray(conv.messages) ? conv.messages.length : 0
      console.log(`   Messages: ${messageCount}`)
    })
  }

  console.log('\n✅ Done!')
  console.log('\nIf you still don\'t see conversations in your dashboard:')
  console.log('1. Check that YOUR user ID matches the studio owner ID above')
  console.log('2. Check that your studio.whatsappNumber matches the Twilio number format')
  console.log('3. Make sure your studio has a botConfig (check /dashboard/bot-config)')
  console.log('4. Try creating a new test conversation')
}

linkOrphanedConversations()
  .then(() => {
    console.log('\n🎉 Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

