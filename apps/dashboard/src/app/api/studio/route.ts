import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'

export async function GET() {
  try {
    // Get the first studio (no auth for now)
    const studio = await prisma.studio.findFirst()

    if (!studio) {
      return NextResponse.json({ success: false, error: 'Studio not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: studio })
  } catch (error) {
    console.error('Error fetching studio:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, whatsappNumber, webhookUrl } = body

    // Get the first studio (no auth for now)
    let studio = await prisma.studio.findFirst()

    if (!studio) {
      // Create studio if it doesn't exist
      studio = await prisma.studio.create({
        data: {
          email: 'demo@holatattoo.com',
          name,
          whatsappNumber,
          webhookUrl
        }
      })
    } else {
      // Update existing studio
      studio = await prisma.studio.update({
        where: { id: studio.id },
        data: {
          name,
          whatsappNumber,
          webhookUrl
        }
      })
    }

    return NextResponse.json({ success: true, data: studio })
  } catch (error) {
    console.error('Error updating studio:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
