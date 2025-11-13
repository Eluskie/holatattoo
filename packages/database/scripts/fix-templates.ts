/**
 * Fix old templates that have both user and bot messages
 * Filter to keep only user messages
 */

import { prisma } from '../src';

async function fixTemplates() {
  console.log('🔧 Fixing templates...');
  
  const templates = await prisma.testTemplate.findMany();
  
  console.log(`📋 Found ${templates.length} templates`);
  
  for (const template of templates) {
    const messages = template.messages as any[];
    
    // Filter only user messages
    const userMessages = messages.filter((m: any) => {
      // Support both string format and object format
      if (typeof m === 'string') {
        return true; // Keep strings as they are already user messages
      }
      return m.role === 'user';
    });
    
    const beforeCount = messages.length;
    const afterCount = userMessages.length;
    
    if (beforeCount !== afterCount) {
      console.log(`  📝 ${template.name}: ${beforeCount} → ${afterCount} messages`);
      
      await prisma.testTemplate.update({
        where: { id: template.id },
        data: {
          messages: userMessages,
          messageCount: userMessages.length
        }
      });
    } else {
      console.log(`  ✅ ${template.name}: Already correct (${afterCount} messages)`);
    }
  }
  
  console.log('✅ Done!');
}

fixTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

