// Quick database connection test
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:sBY5EoYR5VlIhjU5@db.bxgnfpxmyshqzcziflym.supabase.co:5432/postgres"
    }
  }
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📊 Using URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'default URL');

    // Test raw query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query successful!');

    // Test reading studios table
    const studios = await prisma.studio.findMany();
    console.log(`✅ Found ${studios.length} studio(s) in database`);

    // Test reading bot_configs
    const configs = await prisma.botConfig.findMany();
    console.log(`✅ Found ${configs.length} bot config(s) in database`);

    console.log('\n🎉 Database connection successful!');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
