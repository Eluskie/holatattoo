import OpenAI from 'openai';
import { BotQuestion } from '@hola-tattoo/shared-types';

let openai: OpenAI;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

/**
 * Uses ChatGPT to extract structured information from user's natural language response
 */
export async function extractFieldValue(
  userMessage: string,
  question: BotQuestion,
  conversationHistory: string[]
): Promise<string> {
  const prompt = `You are helping extract information from a WhatsApp conversation for a tattoo studio lead qualification bot.

Current question being asked: "${question.text}"
Expected field: ${question.field}
Field type: ${question.type}

User's response: "${userMessage}"

Previous conversation context:
${conversationHistory.join('\n')}

Extract the relevant information for the field "${question.field}".
- If the user provided a clear answer, return just the extracted value (e.g., if they said "My name is John", return "John")
- If the user's response is unclear or doesn't answer the question, return "UNCLEAR"
- Keep the response concise and in the same language as the user's message
- For names, return properly capitalized
- For sizes, return normalized values (small/medium/large or dimensions)
- For dates, return in a consistent format

Return ONLY the extracted value or "UNCLEAR", nothing else.`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 100,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content?.trim() || 'UNCLEAR';
    return response;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fallback to returning the user's message as-is
    return userMessage;
  }
}

/**
 * Uses ChatGPT to determine if the user wants to quit/cancel the conversation
 */
export async function detectExitIntent(userMessage: string): Promise<boolean> {
  const prompt = `Analyze this WhatsApp message and determine if the user wants to quit, cancel, or stop the conversation.

User message: "${userMessage}"

Return ONLY "true" if they want to quit/cancel/stop, or "false" if they want to continue.
Examples of exit intent: "cancel", "stop", "no thanks", "not interested", "quit", "adiós", "no gracias"`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 10,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'false';
    return response === 'true';
  } catch (error) {
    console.error('Error detecting exit intent:', error);
    return false;
  }
}

/**
 * Detect if user is asking for medical advice
 */
export async function detectMedicalQuestion(userMessage: string): Promise<boolean> {
  const medicalKeywords = [
    'al·lèrgia', 'allergic', 'infecció', 'infection', 'cura', 'healing',
    'pell sensible', 'sensitive skin', 'diabetis', 'diabetes', 'embaràs', 'pregnant',
    'medicació', 'medication', 'dolor', 'pain', 'cicatriu', 'scar', 'queloides', 'keloid'
  ];

  const lowerMessage = userMessage.toLowerCase();
  return medicalKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Detect if request is complex and needs human handoff
 */
export async function detectComplexRequest(userMessage: string, collectedData?: any): Promise<boolean> {
  const complexKeywords = [
    'cover', 'cobrir', 'tapa', 'disseny personalitzat', 'custom design',
    'màniga sencera', 'full sleeve', 'esquena completa', 'full back',
    'cicatriu', 'scar', 'removal', 'eliminació', 'làser'
  ];

  const lowerMessage = userMessage.toLowerCase();

  // Check keywords
  const hasComplexKeyword = complexKeywords.some(keyword => lowerMessage.includes(keyword));

  // Check if size is XL
  const isXLSize = collectedData?.placement_size?.toLowerCase().includes('xl') ||
                   collectedData?.placement_size?.toLowerCase().includes('màniga');

  return hasComplexKeyword || isXLSize;
}
