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

/**
 * OpenAI Function Schema for extracting tattoo information
 */
const EXTRACT_TATTOO_INFO_FUNCTION = {
  name: 'extract_tattoo_info',
  description: 'Extract tattoo information from user message. Only include fields that the user explicitly mentioned. Do not add defaults or guess missing information.',
  parameters: {
    type: 'object',
    properties: {
      style: {
        type: 'string',
        enum: ['Tradicional', 'Realisme', 'Línia fina', 'Neo-tradicional', 'Abstracte', 'No estic segur'],
        description: 'Tattoo style - only if user explicitly mentions it'
      },
      placement_size: {
        type: 'string',
        description: 'Location and size (e.g., "avantbraç M", "esquena L"). Format: location + size (S/M/L/XL). Only if user explicitly mentions it.'
      },
      color: {
        type: 'string',
        enum: ['Color', 'Blanc i negre', 'No estic segur'],
        description: 'Color preference - only if user explicitly mentions it'
      },
      budget: {
        type: 'string',
        enum: ['Menys de 150€', '150-300€', 'Més de 300€'],
        description: 'Budget range - only if user explicitly mentions it'
      },
      timing: {
        type: 'string',
        enum: ['2-4 setmanes', 'Més endavant', 'Urgent'],
        description: 'Timing preference - only if user explicitly mentions it'
      },
      name: {
        type: 'string',
        description: 'User name - only if user explicitly provides their name'
      }
    },
    required: []
  }
} as const;

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

    console.log('🤖 [DEBUG] GPT Response:', assistantResponse);

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

    // DEBUG: Log what was extracted
    console.log('🔍 [DEBUG] User message:', userMessage);
    console.log('🔍 [DEBUG] Previously collected:', JSON.stringify(context.collectedData, null, 2));
    console.log('🔍 [DEBUG] Newly extracted:', JSON.stringify(extractedData, null, 2));

    // Merge extracted data
    const updatedData = {
      ...context.collectedData,
      ...extractedData
    };

    console.log('🔍 [DEBUG] Updated data:', JSON.stringify(updatedData, null, 2));

    // Check if we have all required fields including name
    const requiredFields = ['style', 'placement_size', 'color', 'budget', 'timing', 'name'];
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
 * Extract structured data from user's natural language message using OpenAI Function Calling
 */
async function extractDataFromMessage(
  userMessage: string,
  currentData: Record<string, any>
): Promise<Record<string, any>> {
  const extractionPrompt = `Extract tattoo information from this user message.

User message: "${userMessage}"

Already collected: ${JSON.stringify(currentData)}

CRITICAL RULES:
1. Only extract information that the user EXPLICITLY mentioned in this message
2. Do NOT add defaults or guess missing information
3. Do NOT include fields the user didn't mention
4. If the user is correcting previous information, extract the corrected value
5. For name: only extract if the user clearly provides their name

Examples:
- "vull un tatuatge realista" → extract: {style: "Realisme"}
- "a l'esquena de 20 centímetres" → extract: {placement_size: "esquena L"}
- "de color negre" → extract: {color: "Blanc i negre"}
- "l'estil és realista" → extract: {style: "Realisme"} (correction)
- "pressupost menys de 100" → extract: {budget: "Menys de 150€"}
- "em dic Joan" → extract: {name: "Joan"}

If nothing to extract, do not call the function.`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: extractionPrompt }],
      functions: [EXTRACT_TATTOO_INFO_FUNCTION],
      function_call: 'auto',
      temperature: 0.1
    });

    const message = completion.choices[0]?.message;

    console.log('📊 [DEBUG] Function call response:', JSON.stringify(message, null, 2));

    // Check if function was called
    if (message?.function_call) {
      try {
        const extractedData = JSON.parse(message.function_call.arguments);
        console.log('📊 [DEBUG] Extracted via function:', extractedData);

        // Return all extracted fields with values
        // This allows corrections to overwrite existing data
        const newData: Record<string, any> = {};
        for (const [key, value] of Object.entries(extractedData)) {
          if (value && value !== '') {
            newData[key] = value;
          }
        }

        // Merge with current data, allowing new data to overwrite
        return { ...currentData, ...newData };
      } catch (error) {
        console.error('Error parsing function call arguments:', error);
        return {};
      }
    }

    // No function called means nothing to extract
    console.log('📊 [DEBUG] No function called - nothing to extract');
    return {};
  } catch (error) {
    console.error('Error extracting data:', error);
    return {};
  }
}
