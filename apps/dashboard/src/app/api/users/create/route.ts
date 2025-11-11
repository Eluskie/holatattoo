import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'

export async function POST(request: NextRequest) {
  try {
    const { id, email, name } = await request.json()

    if (!id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id,
        email,
        name: name || null,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    // Handle unique constraint violation (user already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

