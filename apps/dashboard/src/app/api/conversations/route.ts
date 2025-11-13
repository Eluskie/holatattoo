import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pagination params from URL
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get user's studio
    const studio = await prisma.studio.findFirst({
      where: { userId: user.id },
    })

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    // Get total count for pagination
    const totalCount = await prisma.conversation.count({
      where: { studioId: studio.id },
    })

    // Get paginated conversations
    const conversations = await prisma.conversation.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

