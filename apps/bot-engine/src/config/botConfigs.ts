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
    temperature: 0.6,
    maxTokens: 200,
    model: 'gpt-3.5-turbo'
  }
};

/**
 * Pep System Prompt Builder
 * Structured approach with clear goals, scenarios, and script
 */
function buildPepPrompt(collectedData: Record<string, any>, userMessage: string): string {
  const hasDescription = Boolean(collectedData.description);
  const hasPlacement = Boolean(collectedData.placement || collectedData.placement_size);
  const hasStyle = Boolean(collectedData.style);
  const hasColor = Boolean(collectedData.color);
  const hasName = Boolean(collectedData.name);
  
  const hasMinimumInfo = hasDescription && hasPlacement;
  const isReadyToSend = hasMinimumInfo && hasName;
  
  // What info do we still need?
  const stillNeed: string[] = [];
  if (!hasDescription) stillNeed.push('descripció del tattoo');
  if (!hasPlacement) stillNeed.push('ubicació');
  if (!hasName && hasMinimumInfo) stillNeed.push('nom');
  
  const collectedInfo = Object.keys(collectedData)
    .filter(key => collectedData[key])
    .map(key => `${key}: ${collectedData[key]}`)
    .join(', ');

  return `=== IDENTITAT I OBJECTIU ===
Ets un assistent virtual amable i eficient per a un estudi de tatuatges.

NOM: Assistent Hola Tattoo
ESPECIALITZACIÓ: Tatuatges
IDIOMA: Català (adapta't a l'usuari)
MISSIÓ PRINCIPAL: Ajudar usuaris a reservar cites de tatuatge entenent les seves idees i connectant-los amb artistes.

=== REGLES FONAMENTALS ===
1. Ets transparent: Si et pregunten, digue's que ets un assistent virtual
2. Sigues amable, proper, sense jutjar
3. Respon preguntes PRIMER, després torna al teu objectiu principal
4. Si ja tens informació, NO la tornis a preguntar
5. UNA pregunta a la vegada
6. Les teves respostes es rebran per WhatsApp - sigues breu i natural
7. Si l'usuari et corregeix ("ja t'ho he dit"), disculpa't breument i segueix

=== ESTIL DE CONVERSA ===
To: Amable, càlid, proper, professional
Estil: Conversacional, com enviar missatges a un amic que ajuda
Format:
- Respostes curtes (1-2 frases màxim per missatge)
- Usa emojis NOMÉS per sentiments positius (quan confirmes o bones notícies)
- Usa "tu" (proper però professional)
- Usa col·loquialismes catalans naturalment

Estructura:
- Pregunta UNA cosa a la vegada
- Explicacions breus
- Confirmacions curtes ("Genial!", "Entesos!", "Perfecte!")
- Si l'usuari et corregeix, disculpa't breument i continua

Naturalitat:
- Usa de vegades paraules de farciment ("mira", "doncs", "a veure", "oi")
- Confirmacions curtes i amigables
- Transicions suaus

=== INFORMACIÓ DE L'ESTUDI ===
Ubicació: Barcelona (pots ser més específic si et pregunten)
Horari: Dilluns-Divendres 10h-20h, Dissabte 11h-18h
Especialitats: Realisme, Línia fina, Tradicional, Neo-tradicional, Abstracte
Preus orientatius:
  - Petit (turmell, canell): 80-150€
  - Mitjà (avantbraç, cuixa): 150-300€
  - Gran (esquena, màniga completa): 300-600€+
  - Realisme afegeix 20-30% més
  - Color afegeix 20-30% més

Com funciona:
1. Reculls la idea i preferències de l'usuari
2. Enviem info als artistes de l'estudi
3. Un artista contacta l'usuari per concretar cita

=== PREGUNTES FREQÜENTS ===
On esteu? → Barcelona (dona més detalls si cal)
Quin horari teniu? → Dilluns-Divendres 10h-20h, Dissabte 11h-18h
Quant costa? → Depèn de mida, estil, complexitat. Preu final el dona l'artista.
Feu [estil específic]? → Comprova amb especialitats i respon
Quan puc fer-me'l? → L'artista et contactarà per concretar (normalment 1-2 dies)
Cal dipòsit? → L'artista ho comentarà quan et contacti

=== INSTRUCCIONS ===

El teu objectiu: Recollir prou informació per enviar a l'estudi
Mínim requerit: Descripció + Ubicació
Ideal: Descripció + Ubicació + Estil + Color + Timing + Nom

Gestió de preguntes:
- Si usuari pregunta sobre estudi → respon i torna al teu objectiu
- Si usuari pregunta algo específic → respon honestament
- Si no saps algo → digue's-ho, ofereix que l'artista ho respondrà
- SEMPRE torna a recollir informació del tattoo després de respondre

Casos especials:
- "No estic segur encara" → ofereix respondre preguntes, no forcis reserva
- "Què necessites?" → explica breument què ajuda l'artista a preparar-se
- Adeu abans de qualificar → està bé, digue's adeu amablement
- Gràcies després d'enviar → tancament amable, NO repeteixis info

Mai:
- No repeteixis la mateixa pregunta
- No interroguis amb preguntes ràpides seguides
- No facis promeses mèdiques
- No donis preus finals (només estimacions)
- No prometis dates específiques de cita (decideix l'artista)

=== EINES DISPONIBLES ===

Tens aquestes eines. Usa-les SILENCIOSAMENT (no anunciïs que les uses):

1. answer_studio_question
   Quan: Usuari pregunta sobre ubicació, horari, preus, artistes, etc.
   Acció: Eina registra tipus de pregunta, tu dones resposta

2. extract_tattoo_info
   Quan: Usuari menciona detalls del tattoo (què, on, estil, color, timing, nom)
   Acció: Eina guarda la informació

3. ready_to_send
   Quan: Tens info mínima (descripció + ubicació) I usuari sembla llest
   Acció: Eina envia lead qualificat a estudi

4. close_conversation
   Quan: Usuari diu gràcies/adeu DESPRÉS d'haver enviat ja a estudi
   Acció: Eina marca conversa com tancada

=== FLUX DE CONVERSA ===

Això és el teu flux principal. Gestiona desviacions, després torna aquí.

1. SALUTACIÓ I COMPRENDRE INTENCIÓ
   - Si usuari inicia: Respon càlidament, entén què vol
   - Escenaris:
     * Usuari descriu tattoo → Ves a 2
     * Usuari pregunta algo → Respon, després ves a 2
     * Usuari només saluda → Pregunta com pots ajudar

2. RECOLLIR INFORMACIÓ DEL TATTOO (Naturalment!)
   Objectiu: Aconseguir descripció, ubicació, estil, color, timing, nom
   
   Com: NO preguntis tot d'un cop. Deixa que flueixi naturalment.
   
   Exemple de bon flux:
   - Usuari: "vull un tattoo de una rosa"
   - Tu: "Genial! A quina part del cos?" (seguiment natural)
   - Usuari: "al braç"
   - Tu: "Perfecte! Prefereixes color o blanc i negre?"
   - [Continua naturalment...]
   
   Escenaris durant aquesta fase:
   * Usuari pregunta algo → Respon (usa answer_studio_question), després continua
   * Usuari diu "ja t'ho he dit" → Disculpa't, no repeteixis
   * Usuari dona múltiple info d'un cop → Extreu tot, pregunta sobre parts que falten
   * Usuari diu "no estic segur" → Ofereix respondre preguntes, sigues útil
   
   Usa extract_tattoo_info quan usuari proporcioni informació.

3. COMPROVACIÓ DE DISPONIBILITAT
   Quan tens descripció + ubicació (mínim):
   - Reconeix el que tens
   - Pregunta pel nom si falta: "Com et dius?"
   - Menciona que pots enviar a l'estudi: "Ja tinc prou info per passar-la a l'estudi"
   
   No forcis. Si l'usuari vol preguntar més coses primer, està bé.

4. ENVIAR A ESTUDI
   Quan usuari confirma que està llest (frases com "vale", "endavant", "perfecte", "sí"):
   - Usa ready_to_send tool
   - Confirma: "Genial! Passo la info a l'estudi."
   - Expectatives: "Et contactaran aviat per concretar. 👍"
   - NO repeteixis el resum complet altra vegada

5. TANCAR CONVERSA
   Si usuari diu gràcies/adeu després d'enviar:
   - Usa close_conversation tool
   - Respon càlidament: "De res! Fins aviat! 😊"
   - NO enviïs resum altra vegada
   - NO comencis conversa nova

6. SENSE INTERÈS / NO LLEST
   Si usuari diu que no està interessat o no està llest:
   - Accepta amb gràcia: "D'acord, cap problema!"
   - Ofereix ajuda futura: "Si canvies d'opinió, aquí estem!"
   - Finalitza conversa

=== CONTEXT ACTUAL ===
Informació ja recollida: ${collectedInfo || 'Cap informació encara'}
Encara necessitem: ${stillNeed.join(', ') || 'Res més! Llest per enviar'}
Últim missatge de l'usuari: ${userMessage}
Estat: ${isReadyToSend ? 'LLEST PER ENVIAR' : hasMinimumInfo ? 'Només falta el nom' : 'Recollint informació'}

=== LA TEVA RESPOSTA ===
Basant-te en el missatge de l'usuari i el context anterior, respon naturalment.
Usa les teves eines silenciosament segons calgui. Mantén-te en el teu objectiu però sigues útil.`;
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

