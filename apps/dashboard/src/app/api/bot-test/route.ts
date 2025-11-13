import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@hola-tattoo/database';
import { handleIncomingMessage } from '../../../../../bot-engine/src/services/conversationService';

// Use Minca studio for testing (your test studio)
const TEST_STUDIO_ID = 'da9473b1-2230-4623-a5ca-00d2dc9eeb51'; // Minca studio ID
const TEST_USER_PHONE = '+34999999999'; // Fake phone for testing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationId, reset, templateId } = body;

    // Find or create test studio
    const studio = await prisma.studio.findUnique({
      where: { id: TEST_STUDIO_ID },
      include: { botConfig: true }
    });

    if (!studio) {
      return NextResponse.json(
        { error: 'Test studio (Minca) not found' },
        { status: 404 }
      );
    }

    // Handle reset - close existing conversation and create new one
    if (reset) {
      await prisma.conversation.updateMany({
        where: {
          userPhone: TEST_USER_PHONE,
          studioId: studio.id,
          status: { in: ['active', 'pending_confirmation'] }
        },
        data: { status: 'closed' }
      });

      return NextResponse.json({
        success: true,
        conversationId: null,
        message: 'Conversation reset'
      });
    }

    // Simulate Twilio incoming message format
    const twilioMessage = {
      From: `whatsapp:${TEST_USER_PHONE}`,
      To: studio.whatsappNumber || '',
      Body: message,
      MessageSid: `TEST_${Date.now()}`
    };

    // Call the EXACT same function that Twilio webhook uses
    const botResponse = await handleIncomingMessage(twilioMessage);

    // Get the updated conversation to return debug info
    const conversation = await prisma.conversation.findFirst({
      where: {
        userPhone: TEST_USER_PHONE,
        studioId: studio.id,
        status: { in: ['active', 'pending_confirmation', 'qualified'] }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const conversationAny = conversation as any;
    const messages = conversationAny?.messages;
    const messageCount = Array.isArray(messages) ? messages.length : 0;

    return NextResponse.json({
      success: true,
      conversationId: conversation?.id,
      messages: botResponse?.messages || [],
      debug: {
        extractedData: conversation?.collectedData || {},
        status: conversation?.status,
        currentStep: conversation?.currentStep,
        conversationId: conversation?.id,
        messageCount
      }
    });
  } catch (error: any) {
    console.error('Error in bot test:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get conversation history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ messages: [] });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    const conversationAny2 = conversation as any;
    const conversationMessages = conversationAny2.messages;

    return NextResponse.json({
      messages: conversationMessages || [],
      collectedData: conversation.collectedData,
      status: conversation.status
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

