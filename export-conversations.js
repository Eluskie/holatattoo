// Export conversations to CSV for Excel
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.bxgnfpxmyshqzcziflym:sBY5EoYR5VlIhjU5@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
    }
  }
});

async function exportToCSV() {
  try {
    console.log('📊 Fetching conversations from database...');

    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        studio: {
          select: { name: true, whatsappNumber: true }
        }
      }
    });

    if (conversations.length === 0) {
      console.log('⚠️  No conversations found in database');
      return;
    }

    // CSV Headers
    const headers = [
      'ID',
      'Created Date',
      'Updated Date',
      'Studio Name',
      'User Phone',
      'User Name',
      'Status',
      'Tattoo Style',
      'Placement',
      'Size',
      'Color Preference',
      'Budget',
      'Timing',
      'Reference Image',
      'Price Estimate',
      'Current Question',
      'Drop Reason'
    ];

    // Convert to CSV rows
    const rows = conversations.map(conv => [
      conv.id,
      conv.createdAt.toISOString(),
      conv.updatedAt.toISOString(),
      conv.studio?.name || 'N/A',
      conv.userPhone,
      conv.userName || '',
      conv.status,
      conv.tattooStyle || '',
      conv.placement || '',
      conv.size || '',
      conv.colorPreference || '',
      conv.budget || '',
      conv.timing || '',
      conv.referenceImage || '',
      conv.priceEstimate || '',
      conv.currentQuestionId || '',
      conv.dropReason || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Save to file
    const filename = `conversations_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent, 'utf-8');

    console.log(`✅ Exported ${conversations.length} conversation(s) to: ${filename}`);
    console.log(`📂 Open with Excel or Google Sheets`);

  } catch (error) {
    console.error('❌ Export failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

exportToCSV();
