import OpenAI from 'openai';
import { buildPrompt } from '../prompts/systemPrompt';
import { ACTIVE_CONFIG, type BotConfig } from '../config/botConfigs';

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
      description: {
        type: 'string',
        description: 'Detailed description of the tattoo idea, placement, complexity, or any specific details the user provides. Capture the full context and details, especially for complex or multi-area tattoos. IMPORTANT: Only extract this if the user is describing the TATTOO itself, NOT answering other questions (like color choices or timing).'
      },
      placement_concept: {
        type: 'string',
        description: 'High-level placement concept derived from user phrasing (e.g., "envolta el braç", "cama completa", "des del peu fins la nuca", "cos parcial"). Use this when placement is complex/wraps/multi-area and an S/M/L/XL is not clearly stated.'
      },
      placement_size: {
        type: 'string',
        description: 'Simple placement and approximate size for price estimation (e.g., "avantbraç M", "esquena L"). Format: location + size (S/M/L/XL). Only needed for basic price estimation.'
      },
      color: {
        type: 'string',
        description: 'Color preference. Use "Color" for any colored tattoo (including specific colors like "negre groc i purpura"), "Blanc i negre" for black and white only, "No estic segur" if unsure. If user mentions specific colors, capture them in description field too.'
      },
      timing_preference: {
        type: 'string',
        description: 'General timeframe or availability the user mentions (e.g., "aquesta setmana", "dimarts", "aviat"). Keep it casual and tentative - just capture their preference.'
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
  toolsUsed?: string[]; // Track which tools were called
  readyToSend?: boolean; // Pep: user ready to send to studio
  shouldClose?: boolean; // Pep: conversation should close gracefully
}

/**
 * Main conversational AI handler
 * Uses GPT to drive the entire conversation naturally
 * Now supports different bot configurations (Pep, Current, etc.)
 */
export async function getConversationalResponse(
  userMessage: string,
  context: ConversationContext,
  config: BotConfig = ACTIVE_CONFIG
): Promise<AIResponse> {
  try {
    console.log(`🤖 [CONFIG] Using bot configuration: ${config.name}`);

    // Build the system prompt with current state
    const systemPrompt = typeof config.systemPrompt === 'function'
      ? config.systemPrompt(context.collectedData, userMessage)
      : config.systemPrompt.replace('{{collectedData}}', JSON.stringify(context.collectedData))
                          .replace('{{userMessage}}', userMessage);

    // Add user message to history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Get response from GPT with config settings
    const completion = await getOpenAI().chat.completions.create({
      model: config.settings.model,
      messages: messages,
      max_tokens: config.settings.maxTokens,
      temperature: config.settings.temperature,
      tools: config.tools.length > 0 ? config.tools : undefined,
      tool_choice: config.tools.length > 0 ? 'auto' : undefined
    });

    const message = completion.choices[0]?.message;
    const assistantResponse = message?.content?.trim() ||
      'Perdona, no t\'he entès bé. Pots repetir?';

    console.log(`🤖 [${config.name}] GPT Response:`, assistantResponse);
    
    // Check if tools were used
    const toolCalls = message?.tool_calls || [];
    if (toolCalls.length > 0) {
      console.log(`🛠️  [${config.name}] Tools called:`, toolCalls.map(t => t.function.name));
    }

    // Parse response into messages array
    let messagesArray: string[] = [assistantResponse];
    if (config.name === 'Current') {
      // Current config expects JSON array format
      try {
        messagesArray = JSON.parse(assistantResponse);
        if (!Array.isArray(messagesArray)) {
          messagesArray = [assistantResponse];
        }
      } catch {
        messagesArray = assistantResponse.includes('\n')
          ? assistantResponse.split('\n').filter(m => m.trim())
          : [assistantResponse];
      }

      // ENFORCE: Remove emojis from questions (any message ending with ?)
      const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
      messagesArray = messagesArray.map(msg => {
        if (msg.includes('?')) {
          return msg.replace(emojiRegex, '').trim();
        }
        return msg;
      });
    }

    // Process tool calls and extract data
    let extractedData: Record<string, any> = {};
    let readyToSend = false;
    let shouldClose = false;
    const toolsUsed: string[] = [];

    if (toolCalls.length > 0) {
      // Handle tool calls from Pep config
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        toolsUsed.push(toolName);

        console.log(`🛠️  [${config.name}] ${toolName}:`, args);

        switch (toolName) {
          case 'extract_tattoo_info':
            // Merge extracted tattoo info
            extractedData = { ...extractedData, ...args };
            break;
          
          case 'answer_studio_question':
            // Just log - answer is in the response text
            console.log(`📍 [${config.name}] Answered ${args.question_category} question`);
            break;
          
          case 'ready_to_send':
            // User is ready to send to studio
            readyToSend = args.confirmed === true;
            break;
          
          case 'close_conversation':
            // Conversation should close gracefully
            shouldClose = true;
            break;
        }
      }
    } else if (config.name === 'Current') {
      // Current config uses separate extraction call
      extractedData = await extractDataFromMessage(
        userMessage,
        context.collectedData
      );
    }

    // DEBUG: Log what was extracted
    console.log('🔍 [DEBUG] User message:', userMessage);
    console.log('🔍 [DEBUG] Previously collected:', JSON.stringify(context.collectedData, null, 2));
    console.log('🔍 [DEBUG] Newly extracted:', JSON.stringify(extractedData, null, 2));

    // Merge extracted data with existing
    const updatedData = {
      ...context.collectedData,
      ...extractedData
    };

    console.log('🔍 [DEBUG] Updated data:', JSON.stringify(updatedData, null, 2));

    // Determine if conversation is complete
    // For Current: description AND (style OR color)
    // For Pep: readyToSend flag from tool
    const hasStyleOrColor = Boolean(updatedData.style) || Boolean(updatedData.color);
    const hasMinimumInfo = Boolean(updatedData.description || updatedData.placement);
    const isComplete = config.name === 'Pep' 
      ? (readyToSend && hasMinimumInfo)
      : (Boolean(updatedData.description) && hasStyleOrColor);

    return {
      messages: messagesArray,
      extractedData: updatedData,
      isComplete,
      toolsUsed,
      readyToSend,
      shouldClose
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
6. If the user provides a complex or wrap-around placement (multi-area, "envolta", "volta", "puja fins", etc.), capture that as "placement_concept" (a short phrase in Catalan). Do NOT force a size (S/M/L/XL) unless clearly stated.
7. If both a simple placement+size AND a complex description are present, include both: "placement_size" for estimation and "placement_concept"/"description" for hand-off.
8. **NEVER extract "description" when user is just answering a color/timing/other question**. Description is ONLY for tattoo design details.
9. For color: if user mentions specific colors like "negre groc i purpura", use color="Color" and add the specific colors to description.

Examples:
- "vull un tatuatge realista" → extract: {style: "Realisme"}
- "a l'esquena de 20 centímetres" → extract: {placement_size: "esquena L"}
- "de color negre" → extract: {color: "Blanc i negre"}
- "negre groc i purpura" → extract: {color: "Color", description: "colors: negre groc i purpura"}
- "els 3" (when asked about colors) → extract: {color: "Color"} (NOT description!)
- "l'estil és realista" → extract: {style: "Realisme"} (correction)
- "aquesta setmana em va bé" → extract: {timing_preference: "aquesta setmana"}
- "em dic Joan" → extract: {name: "Joan"}
- "des del peu voltant el genoll fins la nuca" → extract: {description: "des del peu voltant el genoll fins la nuca", placement_concept: "de peu a nuca, envolta genoll"}
- "que envolti el braç i segueixi pel cos" → extract: {placement_concept: "envolta el braç i segueix pel cos"}

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
