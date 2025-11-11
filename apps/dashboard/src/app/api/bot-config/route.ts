import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'

export async function GET() {
  try {
    // Get the first studio (no auth for now)
    const studio = await prisma.studio.findFirst({
      include: { botConfig: true }
    })

    if (!studio) {
      return NextResponse.json({ success: false, error: 'Studio not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: studio.botConfig })
  } catch (error) {
    console.error('Error fetching bot config:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the first studio (no auth for now)
    const studio = await prisma.studio.findFirst()

    if (!studio) {
      return NextResponse.json({ success: false, error: 'Studio not found' }, { status: 404 })
    }

    const body = await request.json()
    const { welcomeMessage, brandingColor, questions } = body

    const botConfig = await prisma.botConfig.create({
      data: {
        studioId: studio.id,
        welcomeMessage,
        brandingColor,
        questions
      }
    })

    return NextResponse.json({ success: true, data: botConfig })
  } catch (error) {
    console.error('Error creating bot config:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the first studio (no auth for now)
    const studio = await prisma.studio.findFirst({
      include: { botConfig: true }
    })

    if (!studio || !studio.botConfig) {
      return NextResponse.json({ success: false, error: 'Bot config not found' }, { status: 404 })
    }

    const body = await request.json()
    const { welcomeMessage, brandingColor, questions } = body

    const botConfig = await prisma.botConfig.update({
      where: { id: studio.botConfig.id },
      data: {
        welcomeMessage,
        brandingColor,
        questions
      }
    })

    return NextResponse.json({ success: true, data: botConfig })
  } catch (error) {
    console.error('Error updating bot config:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
