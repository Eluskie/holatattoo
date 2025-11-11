import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const studio = await prisma.studio.findFirst({
      where: { userId: user.id },
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, whatsappNumber, webhookUrl } = body

    // Get user's studio
    let studio = await prisma.studio.findFirst({
      where: { userId: user.id },
    })

    if (!studio) {
      // Create studio for this user
      studio = await prisma.studio.create({
        data: {
          userId: user.id,
          email: user.email!,
          name,
          whatsappNumber,
          webhookUrl,
        },
      })
    } else {
      // Update existing studio
      studio = await prisma.studio.update({
        where: { id: studio.id },
        data: {
          name,
          whatsappNumber,
          webhookUrl,
        },
      })
    }

    return NextResponse.json({ success: true, data: studio })
  } catch (error) {
    console.error('Error updating studio:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
