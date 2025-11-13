import { prisma, Prisma } from '@hola-tattoo/database';
import { TwilioIncomingMessage, QualifiedLead } from '@hola-tattoo/shared-types';
import { detectExitIntent, detectMedicalQuestion, detectComplexRequest, detectGratitudeIntent } from './aiService';
import { sendLeadToWebhook } from './webhookService';
import { calculatePriceRange, formatPriceRange, hasEnoughDataForEstimate, estimatePrice } from './priceEstimationService';
import { getConversationalResponse, ConversationContext } from './conversationalAiService';
import { ACTIVE_CONFIG } from '../config/botConfigs';
import { logConversationMetrics, detectFrustration, detectLoops, countUserQuestions } from './metricsService';
import { detectSignificantChange, detectConfirmationIntent, detectRejectionIntent, hasMinimumLeadInfo } from './leadHelpers';

export interface BotResponse {
  messages: string[]; // Array of messages to send sequentially
  buttons?: string[];
  delay?: number; // milliseconds to wait between messages
}

interface ConversationMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

/**
 * Add a message to the conversation history
 */
async function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'bot',
  content: string
): Promise<void> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    console.log(`⚠️  [MESSAGES] Conversation ${conversationId} not found`);
    return;
  }

  const messages = (Array.isArray(conversation.messages) ? conversation.messages : []) as unknown as ConversationMessage[];
  messages.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });

  console.log(`💬 [MESSAGES] Adding message to ${conversationId}: ${role} - "${content.substring(0, 50)}..."`);
  console.log(`💬 [MESSAGES] Total messages now: ${messages.length}`);

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { messages: messages as any }
  });

  console.log(`✅ [MESSAGES] Saved ${messages.length} messages to database`);
}

/**
 * Main handler for incoming WhatsApp messages
 */
export async function handleIncomingMessage(message: TwilioIncomingMessage): Promise<BotResponse | null> {
  // Validate required fields
  if (!message.From || !message.To) {
    console.error('❌ Missing From or To field in message:', message);
    return null;
  }

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

  // Find existing conversation first (for message logging in early returns)
  let conversation = await prisma.conversation.findFirst({
    where: {
      userPhone: userPhone,
      studioId: studio.id,
      status: { in: ['active', 'pending_confirmation'] }
    }
  });

  // Check for exit intent
  const wantsToExit = await detectExitIntent(message.Body);
  if (wantsToExit) {
    if (conversation) {
      await addMessageToConversation(conversation.id, 'user', message.Body);
      const exitMsgs = ["D'acord!", "Si canvies d'opinió, escriu-me quan vulguis."];
      for (const msg of exitMsgs) {
        await addMessageToConversation(conversation.id, 'bot', msg);
      }
    }
    await markConversationAsDropped(userPhone, studio.id);
    return { messages: ["D'acord!", "Si canvies d'opinió, escriu-me quan vulguis."], delay: 800 };
  }

  // Check for medical questions
  const isMedicalQuestion = await detectMedicalQuestion(message.Body);
  if (isMedicalQuestion) {
    const medicalMsgs = [
      "No puc donar consells mèdics.",
      "L'estudi segueix protocols estàndard de cura posterior.",
      "Per temes mèdics, consulta un professional."
    ];
    if (conversation) {
      await addMessageToConversation(conversation.id, 'user', message.Body);
      for (const msg of medicalMsgs) {
        await addMessageToConversation(conversation.id, 'bot', msg);
      }
    }
    return { messages: medicalMsgs, delay: 800 };
  }

  // Check for complex requests
  const isComplexRequest = await detectComplexRequest(message.Body);
  if (isComplexRequest) {
    const complexMsgs = [
      "Això necessita una consulta personalitzada amb un artista.",
      "T'agradaria que et contacti algú de l'estudi directament?"
    ];
    if (conversation) {
      await addMessageToConversation(conversation.id, 'user', message.Body);
      for (const msg of complexMsgs) {
        await addMessageToConversation(conversation.id, 'bot', msg);
      }
    }
    return { messages: complexMsgs, delay: 800 };
  }

  // Check for finish intent (user wants to submit now)
  const wantsToFinish = detectFinishIntent(message.Body);
  if (wantsToFinish && conversation && conversation.status === 'active') {
    // Save user message
    await addMessageToConversation(conversation.id, 'user', message.Body);

    // Check if we have enough data to proceed
    const data = (conversation.collectedData as Record<string, any>) || {};
    const hasMinimalData = data.style || data.placement_size || data.color;

    if (hasMinimalData) {
      // Mark as pending confirmation and send recap
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'pending_confirmation' }
      });
      const recapMessages = await buildConfirmationRecap(data);
      // Save recap messages
      for (const msg of recapMessages) {
        await addMessageToConversation(conversation.id, 'bot', msg);
      }
      return { messages: recapMessages, delay: 1000 };
    }
  }

  // If no active conversation, check if this is gratitude after a recent qualified conversation
  if (!conversation) {
    // Check for recently qualified conversation (within last 10 minutes)
    const recentQualified = await prisma.conversation.findFirst({
      where: {
        userPhone: userPhone,
        studioId: studio.id,
        status: 'qualified',
        updatedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // If user is just saying thanks after qualification, respond gracefully without restarting
    if (recentQualified && detectGratitudeIntent(message.Body)) {
      console.log('✅ [GRATITUDE] Detected gratitude after qualified conversation - responding without restart');
      const gratitudeResponse = ["De res! 😊"];
      
      // Log this to the qualified conversation for continuity
      await addMessageToConversation(recentQualified.id, 'user', message.Body);
      await addMessageToConversation(recentQualified.id, 'bot', gratitudeResponse[0]);
      
      return { messages: gratitudeResponse, delay: 800 };
    }

    // Otherwise, start a new conversation
    conversation = await prisma.conversation.create({
      data: {
        userPhone: userPhone,
        studioId: studio.id,
        status: 'active',
        currentStep: 0,
        collectedData: {},
        messages: []
      }
    });

    // Save user's first message
    await addMessageToConversation(conversation.id, 'user', message.Body);

    // Send welcome message
    const welcomeMsg = studio.botConfig.welcomeMessage;
    await addMessageToConversation(conversation.id, 'bot', welcomeMsg);
    return { messages: [welcomeMsg], delay: 800 };
  }

  // Save user message
  await addMessageToConversation(conversation.id, 'user', message.Body);

  // Process the user's response with conversational AI
  const response = await processConversationalMessage(conversation.id, message.Body, studio.id);

  // Save bot response messages
  if (response) {
    for (const msg of response.messages) {
      await addMessageToConversation(conversation.id, 'bot', msg);
    }
  }

  return response;
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

  // Check if conversation is pending confirmation (Current config)
  if (conversation.status === 'pending_confirmation') {
    return await handleConfirmation(conversation, userMessage, studioId);
  }

  // Check if conversation is pending update confirmation (Pep config)
  if (conversation.status === 'pending_update_confirmation') {
    return await handleUpdateConfirmation(conversation, userMessage, studioId);
  }

  // Build conversation context with recent message history
  const messages = (Array.isArray(conversation.messages) ? conversation.messages : []) as unknown as ConversationMessage[];
  
  // Get last 10 messages for context (avoid token limits)
  const recentMessages = messages.slice(-10);
  
  // Convert to OpenAI format
  let conversationHistory = recentMessages.map((msg: ConversationMessage) => ({
    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content
  }));

  // CRITICAL FIX #1: For new conversations (first user message), start with empty history
  // This prevents hallucination from previous conversation messages
  const isFirstUserMessage = (conversation.currentStep || 0) === 0;
  if (isFirstUserMessage) {
    console.log('🆕 [HISTORY] New conversation - starting with empty history to prevent hallucination');
    conversationHistory = [];
  } else {
    console.log(`📜 [HISTORY] Using ${conversationHistory.length} recent messages for context`);
  }

  // Check if lead already sent
  const leadAlreadySent = Boolean(conversation.leadSentAt);
  
  // Calculate price estimate for system prompt
  const collectedData = (conversation.collectedData as Record<string, any>) || {};
  const priceEstimate = hasEnoughDataForEstimate(collectedData)
    ? estimatePrice(collectedData)
    : undefined;

  const context: ConversationContext = {
    collectedData,
    conversationHistory,
    leadSent: leadAlreadySent,
    priceEstimate
  };

  console.log(`📊 [CONTEXT] leadSent=${leadAlreadySent}, priceEstimate=${priceEstimate ? `${priceEstimate.min}-${priceEstimate.max}€` : 'N/A'}`);

  // Get AI response using active config
  const aiResponse = await getConversationalResponse(userMessage, context, ACTIVE_CONFIG);

  console.log(`🤖 [${ACTIVE_CONFIG.name}] Response:`, {
    isComplete: aiResponse.isComplete,
    readyToSend: aiResponse.readyToSend,
    shouldClose: aiResponse.shouldClose,
    toolsUsed: aiResponse.toolsUsed
  });

  // Update conversation with new data
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      collectedData: aiResponse.extractedData,
      currentStep: (conversation.currentStep || 0) + 1
    }
  });

  // Handle Pep-specific flows
  if (ACTIVE_CONFIG.name === 'Pep') {
    const updatedData = aiResponse.extractedData;

    // 1. CLOSE CONVERSATION
    if (aiResponse.shouldClose) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'closed',
          closedAt: new Date(),
          closeReason: aiResponse.closeReason || 'user_ended'
        }
      });

      logConversationMetrics({
        conversationId,
        botConfig: ACTIVE_CONFIG.name,
        outcome: conversation.leadSentAt ? 'qualified' : 'dropped',
        messageCount: (conversation.currentStep || 0) + 1,
        questionsAsked: 0,
        loopsDetected: 0,
        frustrationDetected: false,
        toolsUsed: aiResponse.toolsUsed || [],
        timestamp: new Date()
      });

      return { messages: aiResponse.messages, delay: 800 };
    }

    // 2. SEND TO STUDIO (first time)
    if (aiResponse.readyToSend && !leadAlreadySent) {
      const hasMinimum = hasMinimumLeadInfo(updatedData);

      if (hasMinimum) {
        // Calculate price estimate
        const priceEstimate = hasEnoughDataForEstimate(updatedData)
          ? estimatePrice(updatedData)
          : { min: 80, max: 300 }; // Generic range

        // Send lead to webhook
        await sendQualifiedLead(conversationId, studioId, updatedData, conversation.userPhone);

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            leadStatus: 'sent',
            leadSentAt: new Date(),
            status: 'active', // Keep active for further questions!
            collectedData: updatedData
          }
        });

        // Generate response with price if GPT didn't include it
        let responseMessages = aiResponse.messages;
        const hasPrice = responseMessages.some(msg => msg.includes('€') || msg.includes('euro'));
        const hasFollowUp = responseMessages.some(msg => msg.toLowerCase().includes('alguna cosa més'));

        if (!hasPrice && priceEstimate) {
          const priceText = `Aquest tipus de tattoo sol anar entre ${priceEstimate.min}-${priceEstimate.max}€. L'artista t'ho confirmarà tot.`;
          responseMessages = [responseMessages[0], priceText, ...responseMessages.slice(1)];
        }

        if (!hasFollowUp) {
          responseMessages.push("Alguna cosa més?");
        }

        console.log(`📤 [SEND] Lead sent for conversation ${conversationId}. Status: active (conversa continua)`);

        return { messages: responseMessages, delay: 800 };
      }
    }

    // 3. UPDATE LEAD (after already sent)
    if (aiResponse.shouldUpdate && leadAlreadySent) {
      const oldData = (conversation.collectedData as Record<string, any>) || {};
      const changeAnalysis = detectSignificantChange(oldData, updatedData);

      if (aiResponse.requiresConfirmation || changeAnalysis.significant) {
        // Significant change → Ask for confirmation
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            status: 'pending_update_confirmation',
            pendingUpdate: updatedData
          }
        });

        console.log(`⏳ [UPDATE] Waiting for confirmation. Changes: ${aiResponse.updateChanges || changeAnalysis.changes.join(', ')}`);

        // GPT should have generated confirmation message
        return { messages: aiResponse.messages, delay: 800 };

      } else {
        // Minor change → Auto-update
        await sendQualifiedLead(conversationId, studioId, updatedData, conversation.userPhone);

        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            collectedData: updatedData,
            lastUpdatedAt: new Date(),
            leadStatus: 'updated'
          }
        });

        console.log(`🔄 [UPDATE] Lead auto-updated. Changes: ${aiResponse.updateChanges}`);

        return { messages: aiResponse.messages, delay: 800 };
      }
    }

    // 4. CONTINUE CONVERSATION
    return { messages: aiResponse.messages, delay: 800 };
  }

  // Current config: Original flow with confirmation
  // Safety net: suppress redundant placement/size questions if placement already covered
  const placementCovered =
    Boolean(context.collectedData?.placement_size) ||
    Boolean(context.collectedData?.placement_concept) ||
    Boolean(context.collectedData?.description);
  const placementPromptRegex = /(mida|ubicació|on\s+.*cos|placement_size)/i;
  const filteredMessages = placementCovered
    ? aiResponse.messages.filter(m => !placementPromptRegex.test(m))
    : aiResponse.messages;

  // If conversation is complete, send recap and ask for confirmation
  if (aiResponse.isComplete && !aiResponse.extractedData.name) {
    // AI will ask for name, don't send recap yet
    return { messages: aiResponse.messages, delay: 800 };
  } else if (aiResponse.isComplete && aiResponse.extractedData.name) {
    // All data collected! Mark as pending confirmation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'pending_confirmation' }
    });

    // Build recap and ask for confirmation
    const recapMessages = await buildConfirmationRecap(aiResponse.extractedData);
    return { messages: recapMessages, delay: 1000 };
  }

  // Return AI's conversational response (filtered if needed)
  return { messages: filteredMessages, delay: 800 };
}

/**
 * Detect if user is confirming (yes, sí, correcte, posteja, etc.)
 */
function detectConfirmation(message: string): boolean {
  const confirmPhrases = [
    'sí', 'si', 'yes', 'yeah', 'correcte', 'correcta', 'perfec', 'ok',
    'posteja', 'envia', 'endavant', 'ja està', 'tot bé', 'tot perfecte',
    'dale', 'va', 'vale', 'venga'
  ];
  const lowerMessage = message.toLowerCase().trim();
  return confirmPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Detect if user wants to finish explicitly
 */
function detectFinishIntent(message: string): boolean {
  const finishPhrases = [
    'ja està', 'tot perfecte', 'posteja', 'envia', 'envia-ho',
    'endavant', 'correcte així', 'prou', 'ja pots enviar'
  ];
  const lowerMessage = message.toLowerCase().trim();
  return finishPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Handle confirmation state - user is confirming or adjusting the recap
 */
async function handleConfirmation(
  conversation: any,
  userMessage: string,
  studioId: string
): Promise<BotResponse> {
  const data = (conversation.collectedData as Record<string, any>) || {};

  // Check if user is confirming
  const isConfirming = detectConfirmation(userMessage) || detectFinishIntent(userMessage);

  if (isConfirming) {
    // User confirmed! Submit lead and mark as qualified
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'qualified' }
    });

    // Build final recap with price estimate and send webhook
    const finalMessages = await buildFinalRecap(
      data,
      conversation.id,
      studioId,
      conversation.userPhone
    );

    return { messages: finalMessages, delay: 1000 };
  } else {
    // User wants to adjust something - process their correction message
    console.log('🔄 [DEBUG] User wants to correct something:', userMessage);

    // Set back to active
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'active' }
    });

    // Process their correction message through AI to extract corrections
    const context: ConversationContext = {
      collectedData: data,
      conversationHistory: []
    };

    const aiResponse = await getConversationalResponse(userMessage, context);

    console.log('🔄 [DEBUG] Corrections extracted:', aiResponse.extractedData);

    // Update conversation with corrected data
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        collectedData: aiResponse.extractedData,
        currentStep: (conversation.currentStep || 0) + 1
      }
    });

    // If they provided all corrections and we're complete, send new recap
    if (aiResponse.isComplete && aiResponse.extractedData.name) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'pending_confirmation' }
      });

      const recapMessages = await buildConfirmationRecap(aiResponse.extractedData);
      return { messages: recapMessages, delay: 1000 };
    }

    // Otherwise acknowledge and ask what else needs changing
    return {
      messages: [
        ...aiResponse.messages,
        "Alguna cosa més a canviar?"
      ],
      delay: 800
    };
  }
}

/**
 * Handle update confirmation state
 * User is confirming or rejecting an update to the lead
 */
async function handleUpdateConfirmation(
  conversation: any,
  userMessage: string,
  studioId: string
): Promise<BotResponse> {
  const pendingData = (conversation.pendingUpdate as Record<string, any>) || {};
  const oldData = (conversation.collectedData as Record<string, any>) || {};

  // Check if user is confirming
  const isConfirming = detectConfirmationIntent(userMessage);
  const isRejecting = detectRejectionIntent(userMessage);

  if (isConfirming) {
    // User confirmed → Update lead
    await sendQualifiedLead(conversation.id, studioId, pendingData, conversation.userPhone);

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'active',
          collectedData: pendingData,
          pendingUpdate: Prisma.DbNull,
          lastUpdatedAt: new Date(),
          leadStatus: 'updated'
        }
      });

    console.log(`✅ [UPDATE-CONFIRMED] Lead updated for conversation ${conversation.id}`);

    return {
      messages: ["Fet! He actualitzat la info. Alguna cosa més?"],
      delay: 800
    };

  } else if (isRejecting) {
    // User rejected → Cancel update
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'active',
        pendingUpdate: Prisma.DbNull
      }
    });

    console.log(`❌ [UPDATE-REJECTED] Update cancelled for conversation ${conversation.id}`);

    return {
      messages: ["Cap problema! Deixem la info com estava. Alguna cosa més?"],
      delay: 800
    };

  } else {
    // Unclear response → Ask again
    return {
      messages: ["Perdona, no t'he entès. Vols que actualitzi la info? Respon 'sí' o 'no'."],
      delay: 800
    };
  }
}

/**
 * Build confirmation recap (without price, just asks for confirmation)
 */
async function buildConfirmationRecap(data: Record<string, any>): Promise<string[]> {
  const messages: string[] = [];

  // Start with confirmation
  messages.push("Perfecte! Deixa'm fer un resum:");

  // Build summary parts
  const summaryParts: string[] = [];
  if (data.style) summaryParts.push(`Estil: ${data.style}`);
  if (data.placement_size) summaryParts.push(`Ubicació: ${data.placement_size}`);
  if (data.placement_concept) summaryParts.push(`Ubicació (concepte): ${data.placement_concept}`);
  if (data.color) summaryParts.push(`Color: ${data.color}`);
  if (data.description) summaryParts.push(`Descripció: ${data.description}`);
  if (data.timing_preference) summaryParts.push(`Timing (tentatiu): ${data.timing_preference}`);
  if (data.name) summaryParts.push(`Nom: ${data.name}`);

  // Add summary as separate message
  if (summaryParts.length > 0) {
    messages.push(summaryParts.join('\n'));
  }

  // Add confirmation question
  messages.push("Tot correcte? Contesta 'Sí' per confirmar o digue'm què vols canviar.");

  return messages;
}

/**
 * Build final recap messages with price estimate (split into multiple messages)
 * NOTE: We don't repeat the summary here - user just confirmed it!
 * Just acknowledge, provide price, and close gracefully.
 */
async function buildFinalRecap(
  data: Record<string, any>,
  conversationId: string,
  studioId: string,
  userPhone: string
): Promise<string[]> {
  const messages: string[] = [];

  // Simple acknowledgment (no need to repeat the summary!)
  messages.push("Perfecte! ✓");

  // Add price estimate
  if (hasEnoughDataForEstimate(data)) {
    const priceRange = calculatePriceRange(data);
    messages.push(formatPriceRange(priceRange));
  }

  // Final message - pass info to studio
  messages.push("Passo la informació a l'estudi.");
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
