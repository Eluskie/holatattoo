import { NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check if tables exist
    const userCount = await prisma.user.count()
    
    return NextResponse.json({ 
      status: 'healthy',
      database: 'connected',
      tables: 'exist',
      userCount,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

