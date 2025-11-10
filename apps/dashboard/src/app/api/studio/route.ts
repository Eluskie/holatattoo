import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { prisma } from '@hola-tattoo/database'

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const studio = await prisma.studio.findUnique({
      where: { email: user.emailAddresses[0].emailAddress }
    })

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
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, whatsappNumber, webhookUrl } = body

    let studio = await prisma.studio.findUnique({
      where: { email: user.emailAddresses[0].emailAddress }
    })

    if (!studio) {
      // Create studio if it doesn't exist
      studio = await prisma.studio.create({
        data: {
          email: user.emailAddresses[0].emailAddress,
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
