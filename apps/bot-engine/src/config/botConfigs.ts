/**
 * Bot Configuration System
 * 
 * Easily switch between different bot personalities and approaches
 * by changing the ACTIVE_CONFIG constant
 */

export interface BotConfig {
  name: string;
  description: string;
  systemPrompt: string | ((collectedData: Record<string, any>, userMessage: string) => string);
  tools: any[];
  settings: {
    temperature: number;
    maxTokens: number;
    model: string;
  };
}

/**
 * CURRENT CONFIG - Original conversational approach
 * Uses passive extraction and conversational flow
 */
export const CURRENT_CONFIG: BotConfig = {
  name: 'Current',
  description: 'Original conversational AI with passive extraction',
  systemPrompt: require('../prompts/systemPrompt').buildPrompt,
  tools: [
    {
      type: 'function',
      function: {
        name: 'extract_tattoo_info',
        description: 'Extract tattoo information from user message. Only include fields that the user explicitly mentioned.',
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
              description: 'Detailed description of the tattoo idea'
            },
            placement_concept: {
              type: 'string',
              description: 'High-level placement concept for complex/multi-area tattoos'
            },
            placement_size: {
              type: 'string',
              description: 'Simple placement and size (e.g., "avantbraç M")'
            },
            color: {
              type: 'string',
              description: 'Color preference: "Color", "Blanc i negre", or "No estic segur"'
            },
            timing_preference: {
              type: 'string',
              description: 'When they want it (e.g., "aquesta setmana", "tardes")'
            },
            name: {
              type: 'string',
              description: 'User name - only if explicitly provided'
            }
          },
          required: []
        }
      }
    }
  ],
  settings: {
    temperature: 0.2,
    maxTokens: 200,
    model: 'gpt-3.5-turbo'
  }
};

/**
 * PEP CONFIG - Structured conversational approach
 * Inspired by production-grade systems, uses clear script with multiple tools
 */
export const PEP_CONFIG: BotConfig = {
  name: 'Pep',
  description: 'Structured approach with clear goals, multiple tools, and script-based flow',
  systemPrompt: buildPepPrompt,
  tools: [
    {
      type: 'function',
      function: {
        name: 'answer_studio_question',
        description: 'User is asking about studio information (location, hours, prices, artists, etc.). Use this to log the question category.',
        parameters: {
          type: 'object',
          properties: {
            question_category: {
              type: 'string',
              enum: ['location', 'hours', 'pricing', 'artists', 'services', 'booking_process', 'general'],
              description: 'Category of the question being asked'
            },
            question_text: {
              type: 'string',
              description: 'The actual question the user asked'
            }
          },
          required: ['question_category']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'extract_tattoo_info',
        description: 'Extract and save tattoo information when user describes their tattoo idea. Extract only what they explicitly mention.',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'What tattoo they want (e.g., "rosa", "dragon", "mandala")'
            },
            placement: {
              type: 'string',
              description: 'Where on body (e.g., "braç", "bíceps", "esquena")'
            },
            style: {
              type: 'string',
              enum: ['Realisme', 'Tradicional', 'Línia fina', 'Neo-tradicional', 'Abstracte', 'No especificat'],
              description: 'Tattoo style preference'
            },
            color: {
              type: 'string',
              enum: ['Blanc i negre', 'Color', 'No especificat'],
              description: 'Color preference'
            },
            timing_preference: {
              type: 'string',
              description: 'When they want it (e.g., "aquesta setmana", "tardes", "cap de setmana")'
            },
            name: {
              type: 'string',
              description: "User's name if they provided it"
            }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'ready_to_send',
        description: 'User is ready to send their tattoo information to the studio. Use when you have minimum required info (description + placement) AND user confirms they want to proceed.',
        parameters: {
          type: 'object',
          properties: {
            confirmed: {
              type: 'boolean',
              description: 'User explicitly confirmed they want to send info to studio'
            }
          },
          required: ['confirmed']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'close_conversation',
        description: 'User is saying goodbye/thanks AFTER we already sent their info to studio. Use this to gracefully end without repeating information.',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              enum: ['gratitude_after_send', 'goodbye_after_send', 'not_interested', 'will_think_about_it'],
              description: 'Why the conversation is ending'
            }
          },
          required: ['reason']
        }
      }
    }
  ],
  settings: {
    temperature: 0.3, // Lower for more consistent, focused responses
    maxTokens: 150, // Reduced to force concise responses
    model: 'gpt-3.5-turbo'
  }
};

/**
 * Pep System Prompt Builder - CONCISE VERSION
 * Shortened significantly to avoid token limits
 */
function buildPepPrompt(collectedData: Record<string, any>, userMessage: string): string {
  const hasDescription = Boolean(collectedData.description);
  const hasPlacement = Boolean(collectedData.placement || collectedData.placement_size);
  const hasName = Boolean(collectedData.name);
  
  const hasMinimumInfo = hasDescription && hasPlacement;
  const isReadyToSend = hasMinimumInfo && hasName;
  
  const stillNeed: string[] = [];
  if (!hasDescription) stillNeed.push('descripció');
  if (!hasPlacement) stillNeed.push('ubicació');
  if (hasMinimumInfo && !hasName) stillNeed.push('nom');
  
  const collectedInfo = Object.keys(collectedData)
    .filter(key => collectedData[key])
    .map(key => `${key}: ${collectedData[key]}`)
    .join(', ');

  return `Assistent d'estudi de tatuatges Barcelona. Català, amable, breu (1-2 frases).

OBJECTIU: Recull descripció + ubicació (mínim) + nom per enviar a estudi.

INFO ESTUDI:
- Barcelona, Dll-Div 10-20h, Diss 11-18h
- Especialitats: Realisme, Línia fina, Tradicional, Neo-tradicional
- Preus aprox: Petit 80-150€, Mitjà 150-300€, Gran 300€+ (artista decideix preu final)

EINES (usa silenciosament):
1. answer_studio_question - preguntes ubicació/horari/preus
2. extract_tattoo_info - detalls tattoo (què/on/estil/color/nom)
3. ready_to_send - quan tens descripció+ubicació I usuari confirma
4. close_conversation - gràcies/adeu DESPRÉS d'enviar

REGLES:
- Si et pregunten → respon i torna a objectiu
- Si ja tens info → NO repeteixis pregunta
- Si et corregeixen → disculpa't i segueix
- UNA pregunta a la vegada
- Quan tens descripció+ubicació → demana nom
- Quan confirmen ("vale","sí","endavant") → usa ready_to_send

JA TENS: ${collectedInfo || 'res'}
FALTA: ${stillNeed.join(', ') || 'res!'}
ÚLTIM MISSATGE: ${userMessage}

Respon breu i natural. Usa eines segons calgui.`;
}

/**
 * ACTIVE CONFIGURATION
 * 
 * Change this to switch between bot personalities
 * Options: PEP_CONFIG (recommended) or CURRENT_CONFIG (backup)
 */
export const ACTIVE_CONFIG = PEP_CONFIG; // <-- Change here to switch!

/**
 * Helper to get config by name (for future A/B testing)
 */
export function getConfigByName(name: 'pep' | 'current'): BotConfig {
  return name === 'pep' ? PEP_CONFIG : CURRENT_CONFIG;
}

