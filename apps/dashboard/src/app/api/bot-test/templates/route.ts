import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@hola-tattoo/database';

// GET - List all templates (most recent first)
export async function GET() {
  try {
    const templates = await prisma.testTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Save new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      messages,
      finalData,
      finalStatus,
      messageCount,
      leadSent,
      events
    } = body;

    // Validation
    if (!name || !messages) {
      return NextResponse.json(
        { error: 'Name and messages are required' },
        { status: 400 }
      );
    }

    const template = await prisma.testTemplate.create({
      data: {
        name,
        description: description || null,
        messages: messages || [],
        finalData: finalData || {},
        finalStatus: finalStatus || 'active',
        messageCount: messageCount || 0,
        leadSent: leadSent || false,
        events: events || []
      }
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete template by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await prisma.testTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
