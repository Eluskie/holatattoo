import { NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'
import { DASHBOARD_VERSION, getVersionString } from '../../../version'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check if tables exist
    const userCount = await prisma.user.count()
    
    return NextResponse.json({ 
      status: 'healthy',
      version: {
        number: DASHBOARD_VERSION.version,
        name: DASHBOARD_VERSION.name,
        releaseDate: DASHBOARD_VERSION.releaseDate,
        full: getVersionString()
      },
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

