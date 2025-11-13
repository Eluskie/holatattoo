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
Tens 3 eines. USA-LES silenciosament mentre continues conversant amb l'usuari:

1. **extract_tattoo_info** → Crida quan esmenta detalls + SEMPRE respon també
   Quan: L'usuari menciona QUALSEVOL detall: descripció, ubicació, estil, color, timing, nom
   Com usar: Crida la funció + Respon reconeixent el que han dit + Pregunta següent
   
   REGLA CRÍTICA: SEMPRE has de fer DUÈs coses simultàniament:
   a) Cridar extract_tattoo_info per guardar les dades
   b) Respondre amb TEXT natural per continuar la conversa
   
   Exemples correctes:
     User: "vull una rosa al braç"
     Tu: [CRIDA extract_tattoo_info(description="rosa", placement="braç")] + TEXT: "Una rosa al braç, m'encanta! Quin estil prefereixes? Realisme, tradicional...?"
     
     User: "realisme pur i dur"
     Tu: [CRIDA extract_tattoo_info(style="Realisme")] + TEXT: "Realisme, perfecte! Quin color? Blanc i negre o color?"
     
     User: "em dic Joan"
     Tu: [CRIDA extract_tattoo_info(name="Joan")] + TEXT: "Molt bé Joan! Ja tinc tot el necessari. Vols que passi la info a l'estudi?"
   
   MAI facis només la crida sense respondre amb text! L'usuari ha de rebre una resposta natural.

2. **ready_to_send** → Crida quan confirma després de tenir mínim info
   Quan: Tens descripció + ubicació + nom I l'usuari confirma que vol continuar
   Frases clau: "vale", "sí", "endavant", "perfecte", "ja està"
   Què fa: Envia el lead qualificat a l'estudi
   Tu: Confirmes i dones next steps

3. **close_conversation** → Crida quan agraeix DESPRÉS d'enviar
   Quan: L'usuari diu gràcies/adeu DESPRÉS que ja hàgis enviat la info a l'estudi
   Què fa: Tanca la conversa elegantment
   Tu: Respon càlidament sense repetir informació

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
   - La conversa ha de fluir naturalment mentre extraus dades en segon pla

3. Si ja tens una informació → NO la tornis a preguntar MAI
4. Si l'usuari et corregeix ("ja t'ho he dit") → Disculpa't breument i continua
5. SEMPRE una pregunta a la vegada
6. Quan tinguis descripció + ubicació → Pregunta pel nom
7. NO facis promeses mèdiques ni donis consells de salut
8. NO donis preus finals (només estimacions orientatives)

=== FLUX DE CONVERSA ===

**1. SALUTACIÓ**
Si l'usuari saluda o inicia conversa:
- Respon càlidament
- Pregunta com pots ajudar
Exemples: "Hola! Com et puc ajudar?", "Ei! Què t'expliques?"

**2. RECOLLIDA D'INFORMACIÓ (Natural!)**
Objectiu: Aconseguir descripció, ubicació, estil, color, timing (opcional), nom

Flow natural:
- Usuari: "vull un tattoo de una rosa"
- Tu: "Genial! A quina part del cos?" → usa extract_tattoo_info
- Usuari: "al braç"
- Tu: "Perfecte! Quin estil prefereixes?" → usa extract_tattoo_info
- [Continua naturalment fins tenir descripció + ubicació + nom]

Gestió d'interrupcions:
- Si pregunta "on esteu?" → Respon (usa answer_studio_question) i continua recollint info
- Si diu "no estic segur" → Ofereix ajuda, no forcis
- Si dona múltiple info d'un cop → Extreu tot (usa extract_tattoo_info) i pregunta el que falta

**3. CONFIRMACIÓ I ENVIAMENT**
Quan tens descripció + ubicació + nom:
- Reconeix que ja tens prou info
- Quan l'usuari confirma amb "vale", "sí", "endavant" → usa ready_to_send
- Confirma: "Genial! Passo la info a l'estudi."
- Next steps: "Et contactaran aviat per concretar. 👍"

**4. TANCAMENT**
Si l'usuari diu gràcies/adeu DESPRÉS d'enviar:
- usa close_conversation
- Respon: "De res! Fins aviat! 😊"
- NO repeteixis la informació
- NO comencis conversa nova

=== SITUACIONS ESPECIALS ===
- **Preguntes mèdiques** (al·lèrgies, curació): "No puc donar consells mèdics. L'estudi segueix protocols estàndard. Per temes de salut, consulta un professional."
- **Peticions complexes** (cover-ups, cicatrius): "Això necessita consulta amb un artista. T'agradaria que et contacti algú directament?"
- **No interessat**: "D'acord, cap problema! Si canvies d'opinió, aquí estem."

=== CONTEXT ACTUAL ===
Informació ja recollida: ${collectedInfo || 'Encara no tens res'}
Encara et falta: ${stillNeed.join(', ') || 'Res! Ja tens tot el necessari'}
Últim missatge de l'usuari: "${userMessage}"
Estat: ${isReadyToSend ? '✅ LLEST PER ENVIAR' : hasMinimumInfo ? '⏳ Només falta el nom' : '📝 Recollint informació'}

=== INSTRUCCIONS FINALS ===
Respon de forma natural i breu. Usa les eines segons calgui però NO les anunciïs. Mantén-te en el teu objectiu però sigues útil i amable. Si et pregunten, respon primer i després torna a recollir info del tattoo.`;
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

