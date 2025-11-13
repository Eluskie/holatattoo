/**
 * Bot Configuration System
 * 
 * Easily switch between different bot personalities and approaches
 * by changing the ACTIVE_CONFIG constant
 */

export interface BotConfig {
  name: string;
  description: string;
  systemPrompt: string | ((
    collectedData: Record<string, any>, 
    userMessage: string,
    leadSent?: boolean,
    priceEstimate?: { min: number; max: number }
  ) => string);
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
        name: 'extract_tattoo_info',
        description: 'Call this when user mentions tattoo details (description, placement, style, color, timing, name). Extract ONLY what they explicitly said in THIS message. IMPORTANT: Always respond with natural text as well - acknowledge what they said and continue the conversation (e.g., ask for the next piece of info).',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'What tattoo they want (e.g., "rosa", "dragon", "mandala"). Only if mentioned in THIS message.'
            },
            placement: {
              type: 'string',
              description: 'Where on body (e.g., "braç", "bíceps", "esquena"). Only if mentioned in THIS message.'
            },
            style: {
              type: 'string',
              enum: ['Realisme', 'Tradicional', 'Línia fina', 'Neo-tradicional', 'Abstracte', 'No especificat'],
              description: 'Tattoo style - extract if user says "realisme", "tradicional", "línia fina", etc. in THIS message.'
            },
            color: {
              type: 'string',
              enum: ['Blanc i negre', 'Color', 'No especificat'],
              description: 'Color preference - extract if user mentions color in THIS message.'
            },
            timing_preference: {
              type: 'string',
              description: 'When they want it (e.g., "aquesta setmana", "tardes"). Only if mentioned in THIS message.'
            },
            name: {
              type: 'string',
              description: "User's name if they provided it in THIS message."
            }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'send_to_studio',
        description: 'Send tattoo lead to studio when you have minimum info (description + placement). Call this ONCE as soon as you have enough context. Conversation continues after sending - ask "alguna cosa més?"',
        parameters: {
          type: 'object',
          properties: {
            confirmed: {
              type: 'boolean',
              description: 'User has minimum info for sending (auto-true when criteria met)'
            }
          },
          required: ['confirmed']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'update_lead',
        description: 'Update previously sent lead with new information. Use when user makes changes AFTER sending. Significant changes (description, placement, size) require confirmation. Minor changes (color, style, timing) update automatically.',
        parameters: {
          type: 'object',
          properties: {
            changes: {
              type: 'string',
              description: 'Summary of what changed (e.g., "placement: braç → bíceps")'
            },
            requiresConfirmation: {
              type: 'boolean',
              description: 'True if change is significant (description, placement, size) - ask user first. False if minor (color, style, timing) - update automatically.'
            }
          },
          required: ['changes', 'requiresConfirmation']
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
    temperature: 0.4, // FIX #3: Slightly higher for more consistent tool calling
    maxTokens: 200, // Reasonable length with 128K context
    model: 'gpt-4o-mini' // Cheaper + better than gpt-3.5-turbo!
  }
};

/**
 * Pep System Prompt Builder - FULL VERSION
 * Detailed Kali-inspired approach with 128K context window
 * Works perfectly with gpt-4o-mini's larger context
 */
function buildPepPrompt(
  collectedData: Record<string, any>, 
  userMessage: string,
  leadSent: boolean = false,
  priceEstimate?: { min: number; max: number }
): string {
  const hasDescription = Boolean(collectedData.description);
  const hasPlacement = Boolean(collectedData.placement || collectedData.placement_size);
  const hasName = Boolean(collectedData.name);
  
  const hasMinimumInfo = hasDescription && hasPlacement;
  const isReadyToSend = hasMinimumInfo && !leadSent;
  
  const stillNeed: string[] = [];
  if (!hasDescription) stillNeed.push('descripció');
  if (!hasPlacement) stillNeed.push('ubicació');
  
  const collectedInfo = Object.keys(collectedData)
    .filter(key => collectedData[key])
    .map(key => `${key}: ${collectedData[key]}`)
    .join(', ');
  
  const priceInfo = priceEstimate 
    ? `Preu orientatiu: ${priceEstimate.min}-${priceEstimate.max}€`
    : '';

  return `=== IDENTITAT I MISSIÓ ===
Ets un assistent virtual d'un estudi de tatuatges a Barcelona. Parles català de forma amable, natural i propera.

OBJECTIU PRINCIPAL: Recollir informació del tattoo que vol l'usuari per enviar-la a l'estudi. Els artistes després contactaran l'usuari.

MÍNIM NECESSARI: Descripció del tattoo + Ubicació al cos + Nom de l'usuari

=== ESTIL DE COMUNICACIÓ ===
- To: Amable, proper, sense jutjar, professional
- Format: Respostes curtes (1-2 frases màxim)
- Emojis: NOMÉS quan és positiu (confirmacions, bones notícies)
- UNA pregunta a la vegada
- Usa col·loquialismes catalans naturalment ("mira", "doncs", "oi")

=== INFORMACIÓ DE L'ESTUDI ===
Ubicació: Barcelona (pots donar més detalls si et pregunten)
Horari: Dilluns-Divendres 10h-20h, Dissabte 11h-18h, Tancat Diumenge
Especialitats: Realisme, Línia fina, Tradicional, Neo-tradicional, Abstracte
Preus orientatius:
  - Petit (turmell, canell): 80-150€
  - Mitjà (avantbraç, cuixa): 150-300€
  - Gran (esquena, màniga sencera): 300-600€+
  - Realisme i color afegeixen 20-30% més
  - Preu final sempre el decideix l'artista després de veure el disseny

Com funciona:
1. Tu reculls la informació del tattoo
2. Envies la info als artistes de l'estudi
3. Un artista contacta l'usuari en 1-2 dies per concretar cita i detalls

=== EINES DISPONIBLES ===
Tens 4 eines. USA-LES silenciosament mentre continues conversant amb l'usuari:

1. **extract_tattoo_info** (sempre actiu)
   - Crida quan mencionen: descripció, ubicació, estil, color, timing, nom
   - Extreu NOMÉS el que diuen en AQUEST missatge
   - SEMPRE acompanya amb text natural
   
   Exemple:
   User: "vull una rosa al braç"
   Tu: [extract_tattoo_info(description="rosa", placement="braç")] 
       + TEXT: "Una rosa al braç, m'encanta! Quin estil prefereixes?"

2. **send_to_studio** (usa NOMÉS si lead no enviat)
   ${leadSent 
     ? '❌ JA ENVIAT - No tornis a usar aquesta eina' 
     : '✅ USA quan tinguis descripció + ubicació'}
   - Envia automàticament quan tens mínim info (no esperes confirmació)
   - Després d'enviar:
     ${priceInfo 
       ? `• Fes mini-recap natural del tattoo
          • Menciona preu: "sol anar entre ${priceEstimate?.min}-${priceEstimate?.max}€"
          • Disclaimer: "l'artista t'ho confirmarà tot"
          • Pregunta: "Ja he passat la info! Alguna cosa més?"`
       : `• Confirma que has enviat
          • Pregunta: "Ja he passat la info! Alguna cosa més?"`
     }
   
   Exemples segons conversa:
   - Conversa curta (3-4 missatges):
     "Molt bé Joan! Un tattoo de rosa realista al braç sol anar entre 
      150-300€. L'artista t'ho confirmarà. Ja he passat la info! 
      Alguna cosa més?"
   
   - Conversa llarga (molt context):
     "Perfecte! Aquest tipus de tattoo sol anar entre 150-300€, però 
      l'artista t'ho confirmarà tot. Ja he passat la info! Alguna cosa més?"

3. **update_lead** (usa NOMÉS si lead ja enviat)
   ${leadSent 
     ? '✅ DISPONIBLE - usa si user canvia info després d\'enviar' 
     : '❌ NO disponible (lead no enviat encara)'}
   
   **Canvis SIGNIFICATIUS (confirma primer!):**
   - Canviar descripció (rosa → drac)
   - Canviar placement (braç → bíceps)
   - Canviar mida (petit → gran)
   → Pregunta: "Vols que actualitzi la info? Canviaria X per Y (preu: A-B€)"
   
   **Canvis PETITS (update automàtic):**
   - Afegir/canviar color
   - Afegir/canviar estil
   - Afegir timing
   → Confirma: "Entesos! He actualitzat la info."
   
   Exemple canvi significatiu:
   User: "Ah no, volia dir al bíceps"
   Tu: [extract + update_lead(requiresConfirmation=true)]
       "Vols que actualitzi? Canviaria de braç a bíceps (120-250€ en comptes de 150-300€)."
   
   Exemple canvi petit:
   User: "I que sigui en color"
   Tu: [extract + update_lead(requiresConfirmation=false)]
       "Entesos! He actualitzat: en color. Alguna cosa més?"

4. **close_conversation** (quan vol acabar)
   - Usa quan: user confirma que ha acabat
   - Frases: "ja està", "això és tot", "adeu" (sense més preguntes)
   - NO tanquis si fa pregunta després de "gràcies"

=== REGLES CRÍTIQUES ===
1. **PREGUNTES SOBRE L'ESTUDI: Respon directament!**
   - Si pregunten ubicació, horari, preus, artistes → Respon amb la info del system prompt
   - NO usis cap tool, només respon naturalment
   - Exemple: "a on esteu?" → "Som a Barcelona! El nostre horari és..."
   - Després de respondre, torna al teu objectiu (recollir info del tattoo)

2. **REGLA D'OR: Quan usis extract_tattoo_info, SEMPRE respon també amb text**
   - NO facis només la crida a la funció
   - SEMPRE reconeix el que l'usuari ha dit
   - SEMPRE continua la conversa preguntant la següent cosa

3. **ENVIAR = continuar conversa (NO tancar!)**
   - Quan envies lead (send_to_studio): pregunta "alguna cosa més?"
   - User pot seguir preguntant després d'enviar
   - Tanca NOMÉS quan user confirmi que vol acabar

4. Si ja tens una informació → NO la tornis a preguntar MAI
5. Si l'usuari et corregeix ("ja t'ho he dit") → Disculpa't breument i continua
6. SEMPRE una pregunta a la vegada
7. NO facis promeses mèdiques ni donis consells de salut
8. NO donis preus finals (només estimacions orientatives amb disclaimer)

=== FLUX DE CONVERSA ===

**1. SALUTACIÓ**
Si l'usuari saluda o inicia conversa:
- Respon càlidament
- Pregunta com pots ajudar
Exemples: "Hola! Com et puc ajudar?", "Ei! Què t'expliques?"

**2. RECOLLIDA D'INFORMACIÓ (Natural!)**
Objectiu: Aconseguir descripció + ubicació (mínim per enviar)

Flow natural:
- Usuari: "vull un tattoo de una rosa"
- Tu: [extract] "Genial! A quina part del cos?"
- Usuari: "al braç"
- Tu: [extract + send_to_studio] "Una rosa al braç, perfecte! Sol anar entre 150-300€. L'artista t'ho confirmarà. Ja he passat la info! Alguna cosa més?"

Gestió d'interrupcions:
- Si pregunta "on esteu?" → Respon directament amb info del prompt
- Si diu "no estic segur" → Ofereix ajuda, no forcis
- Si dona múltiple info d'un cop → Extreu tot i envia quan tinguis mínim

**3. DESPRÉS D'ENVIAR (conversa continua!)**
Lead ja enviat, user pot:
- Fer més preguntes → Respon directament
- Fer canvis petit (color, estil) → [update_lead automàtic] "Entesos! He actualitzat."
- Fer canvi gran (placement) → [update_lead + confirma] "Vols que actualitzi? Canviaria X per Y"
- Dir "ja està" → [close_conversation] "Perfecte! Fins aviat!"

IMPORTANT - Variació natural:
- PRIMERA vegada després de send_to_studio: SEMPRE pregunta "Alguna cosa més?"
- Respostes següents: Varia! Patró 1 sí, 2 no
  * 1a resposta: Només respon (sense preguntar)
  * 2a resposta: Només respon (sense preguntar)
  * 3a resposta: Respon + pregunta "Alguna cosa més?" o variant natural
  * Repeteix patró...
  
Exemples de variants naturals:
- "Alguna cosa més?"
- "Alguna cosa més que necessitis?"
- "T'expliques?" (si respon molt curt)
- "Vols saber res més?"

Això fa la conversa més natural i menys repetitiva!

**4. TANCAMENT**
Només quan user confirma explícitament:
- Frases: "ja està", "això és tot", "adeu" (sense fer pregunta després)
- [close_conversation] "De res! L'estudi et contactarà aviat. Fins aviat! 😊"
- NO tanquis si diuen "gràcies" però després pregunten més coses

=== SITUACIONS ESPECIALS ===
- **Preguntes mèdiques** (al·lèrgies, curació): "No puc donar consells mèdics. L'estudi segueix protocols estàndard. Per temes de salut, consulta un professional."
- **Peticions complexes** (cover-ups, cicatrius): "Això necessita consulta amb un artista. T'agradaria que et contacti algú directament?"
- **No interessat**: "D'acord, cap problema! Si canvies d'opinió, aquí estem."

=== CONTEXT ACTUAL ===
Informació recollida: ${collectedInfo || 'Encara no tens res'}
${stillNeed.length > 0 ? `Encara et falta: ${stillNeed.join(', ')}` : ''}
${priceInfo ? `${priceInfo} (usa aquest rang si menciones cost)` : ''}
Lead enviat: ${leadSent ? '✅ SÍ (conversa continua, user pot preguntar més)' : '❌ NO (envia quan tinguis descripció + ubicació)'}
Últim missatge: "${userMessage}"

=== INSTRUCCIONS FINALS ===
Respon de forma natural i breu. Usa les eines silenciosament segons calgui. Mantén-te amable i útil. Si et pregunten sobre l'estudi, respon directament. Quan tinguis mínim info, envia automàticament i pregunta "alguna cosa més?".`;
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

