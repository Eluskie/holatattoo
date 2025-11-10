import OpenAI from 'openai';
import { buildPrompt } from '../prompts/systemPrompt';

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

export interface ConversationContext {
  collectedData: Record<string, any>;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AIResponse {
  messages: string[]; // Changed from single message to array
  extractedData: Record<string, any>;
  isComplete: boolean;
}

/**
 * Main conversational AI handler
 * Uses GPT to drive the entire conversation naturally
 */
export async function getConversationalResponse(
  userMessage: string,
  context: ConversationContext
): Promise<AIResponse> {
  try {
    // Build the system prompt with current state
    const systemPrompt = buildPrompt(context.collectedData, userMessage);

    // Add user message to history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Get response from GPT
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 200,
      temperature: 0.7 // Higher temp for more natural conversation
    });

    const assistantResponse = completion.choices[0]?.message?.content?.trim() ||
      '["Perdona, no t\'he entès bé.", "Pots repetir?"]';

    // Try to parse as JSON array
    let messagesArray: string[];
    try {
      messagesArray = JSON.parse(assistantResponse);
      if (!Array.isArray(messagesArray)) {
        // If not array, wrap single message
        messagesArray = [assistantResponse];
      }
    } catch {
      // If JSON parse fails, split by newlines or use as single message
      messagesArray = assistantResponse.includes('\n')
        ? assistantResponse.split('\n').filter(m => m.trim())
        : [assistantResponse];
    }

    // Extract any new data from the user's message using a separate call
    const extractedData = await extractDataFromMessage(
      userMessage,
      context.collectedData
    );

    // Merge extracted data
    const updatedData = {
      ...context.collectedData,
      ...extractedData
    };

    // Check if we have all required fields (consent removed for MVP)
    const requiredFields = ['style', 'placement_size', 'color', 'budget', 'timing'];
    const isComplete = requiredFields.every(field => updatedData[field]);

    return {
      messages: messagesArray,
      extractedData: updatedData,
      isComplete
    };
  } catch (error) {
    console.error('Error in conversational AI:', error);
    return {
      messages: ["Perdona, hi ha hagut un error.", "Pots tornar-ho a intentar?"],
      extractedData: context.collectedData,
      isComplete: false
    };
  }
}

/**
 * Extract structured data from user's natural language message
 */
async function extractDataFromMessage(
  userMessage: string,
  currentData: Record<string, any>
): Promise<Record<string, any>> {
  const extractionPrompt = `Extract tattoo information from this message. Return ONLY valid JSON.

User message: "${userMessage}"

Already collected: ${JSON.stringify(currentData)}

Extract these fields if present (don't extract if already collected):
- style: one of [Tradicional, Realisme, Línia fina, Neo-tradicional, Abstracte, No estic segur]
- placement_size: location + size (e.g., "avantbraç M", "esquena L")
- color: "Color", "Blanc i negre", or "No estic segur"
- budget: "Menys de 150€", "150-300€", or "Més de 300€"
- timing: "2-4 setmanes", "Més endavant", or "Urgent"
- name: their name (only if they explicitly give it)

Return ONLY JSON like: {"style": "Realisme", "placement_size": "braç M"}
If nothing to extract, return: {}`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: extractionPrompt }],
      max_tokens: 150,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content?.trim() || '{}';

    // Try to parse JSON
    try {
      const extracted = JSON.parse(response);
      // Only return fields that aren't already collected
      const newData: Record<string, any> = {};
      for (const [key, value] of Object.entries(extracted)) {
        if (!currentData[key] && value) {
          newData[key] = value;
        }
      }
      return newData;
    } catch {
      return {};
    }
  } catch (error) {
    console.error('Error extracting data:', error);
    return {};
  }
}
