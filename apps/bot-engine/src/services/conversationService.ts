import { prisma } from '@hola-tattoo/database';
import { TwilioIncomingMessage, QualifiedLead } from '@hola-tattoo/shared-types';
import { detectExitIntent, detectMedicalQuestion, detectComplexRequest } from './aiService';
import { sendLeadToWebhook } from './webhookService';
import { calculatePriceRange, formatPriceRange, hasEnoughDataForEstimate } from './priceEstimationService';
import { getConversationalResponse, ConversationContext } from './conversationalAiService';

export interface BotResponse {
  messages: string[]; // Array of messages to send sequentially
  buttons?: string[];
  delay?: number; // milliseconds to wait between messages
}

/**
 * Main handler for incoming WhatsApp messages
 */
export async function handleIncomingMessage(message: TwilioIncomingMessage): Promise<BotResponse | null> {
  // Extract phone number (remove 'whatsapp:' prefix)
  const userPhone = message.From.replace('whatsapp:', '');
  const studioPhone = message.To.replace('whatsapp:', '');

  // Find the studio by WhatsApp number
  const studio = await prisma.studio.findFirst({
    where: { whatsappNumber: `whatsapp:${studioPhone}` },
    include: { botConfig: true }
  });

  if (!studio || !studio.botConfig) {
    console.error(`❌ No studio found for WhatsApp number: ${studioPhone}`);
    return { messages: ["Perdona, hi ha hagut un error."], delay: 800 };
  }

  // Check for exit intent
  const wantsToExit = await detectExitIntent(message.Body);
  if (wantsToExit) {
    await markConversationAsDropped(userPhone, studio.id);
    return { messages: ["D'acord!", "Si canvies d'opinió, escriu-me quan vulguis."], delay: 800 };
  }

  // Check for medical questions
  const isMedicalQuestion = await detectMedicalQuestion(message.Body);
  if (isMedicalQuestion) {
    return {
      messages: [
        "No puc donar consells mèdics.",
        "L'estudi segueix protocols estàndard de cura posterior.",
        "Per temes mèdics, consulta un professional."
      ],
      delay: 800
    };
  }

  // Check for complex requests
  const isComplexRequest = await detectComplexRequest(message.Body);
  if (isComplexRequest) {
    return {
      messages: [
        "Això necessita una consulta personalitzada amb un artista.",
        "T'agradaria que et contacti algú de l'estudi directament?"
      ],
      delay: 800
    };
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      userPhone: userPhone,
      studioId: studio.id,
      status: 'active'
    }
  });

  // If no active conversation, start a new one
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userPhone: userPhone,
        studioId: studio.id,
        status: 'active',
        currentStep: 0,
        collectedData: {}
      }
    });

    // Send welcome message
    return { messages: [studio.botConfig.welcomeMessage], delay: 800 };
  }

  // Process the user's response with conversational AI
  return await processConversationalMessage(conversation.id, message.Body, studio.id);
}

/**
 * Process message using conversational AI
 */
async function processConversationalMessage(
  conversationId: string,
  userMessage: string,
  studioId: string
): Promise<BotResponse> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    return { messages: ["Perdona, hi ha hagut un error.", "Torna a començar si us plau."], delay: 800 };
  }

  // Build conversation context
  const context: ConversationContext = {
    collectedData: (conversation.collectedData as Record<string, any>) || {},
    conversationHistory: []
  };

  // Get AI response
  const aiResponse = await getConversationalResponse(userMessage, context);

  // Update conversation with new data
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      collectedData: aiResponse.extractedData,
      currentStep: (conversation.currentStep || 0) + 1
    }
  });

  // If conversation is complete, send recap with price estimate
  if (aiResponse.isComplete && !aiResponse.extractedData.name) {
    // AI will ask for name, don't send recap yet
    return { messages: aiResponse.messages, delay: 800 };
  } else if (aiResponse.isComplete && aiResponse.extractedData.name) {
    // All done! Mark as qualified and send to webhook
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'qualified' }
    });

    // Build recap with price estimate
    const finalMessages = await buildFinalRecap(
      aiResponse.extractedData,
      conversationId,
      studioId,
      conversation.userPhone
    );

    return { messages: finalMessages, delay: 1000 };
  }

  // Return AI's conversational response
  return { messages: aiResponse.messages, delay: 800 };
}

/**
 * Build final recap messages with price estimate (split into multiple messages)
 */
async function buildFinalRecap(
  data: Record<string, any>,
  conversationId: string,
  studioId: string,
  userPhone: string
): Promise<string[]> {
  const messages: string[] = [];

  // Start with confirmation
  messages.push("Perfecte! Deixa'm fer un resum:");

  // Build summary parts
  const summaryParts: string[] = [];
  if (data.style) summaryParts.push(`Estil: ${data.style}`);
  if (data.placement_size) summaryParts.push(`Ubicació: ${data.placement_size}`);
  if (data.color) summaryParts.push(`Color: ${data.color}`);
  if (data.budget) summaryParts.push(`Pressupost: ${data.budget}`);
  if (data.timing) summaryParts.push(`Timing: ${data.timing}`);

  // Add summary as separate message
  if (summaryParts.length > 0) {
    messages.push(summaryParts.join('\n'));
  }

  // Add price estimate
  if (hasEnoughDataForEstimate(data)) {
    const priceRange = calculatePriceRange(data);
    messages.push(formatPriceRange(priceRange));
  }

  // Final message with emoji (positive sentiment!)
  messages.push(`He passat la info a l'estudi.`);
  messages.push(`Et contactaran aviat, ${data.name || 'gràcies'}! 😊`);

  // Send lead to webhook
  await sendQualifiedLead(conversationId, studioId, data, userPhone);

  return messages;
}

/**
 * Send qualified lead to studio's webhook
 */
async function sendQualifiedLead(
  conversationId: string,
  studioId: string,
  collectedData: any,
  userPhone: string
): Promise<void> {
  const studio = await prisma.studio.findUnique({
    where: { id: studioId }
  });

  if (!studio || !studio.webhookUrl) {
    console.error(`❌ No webhook URL configured for studio ${studioId}`);
    return;
  }

  const lead: QualifiedLead = {
    lead_id: conversationId,
    studio_id: studioId,
    timestamp: new Date().toISOString(),
    source: 'whatsapp',
    data: {
      phone: userPhone,
      ...collectedData
    }
  };

  await sendLeadToWebhook(studio.webhookUrl, lead);
}

/**
 * Mark conversation as dropped
 */
async function markConversationAsDropped(userPhone: string, studioId: string): Promise<void> {
  await prisma.conversation.updateMany({
    where: {
      userPhone: userPhone,
      studioId: studioId,
      status: 'active'
    },
    data: {
      status: 'dropped'
    }
  });
}
