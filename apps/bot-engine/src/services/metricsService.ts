/**
 * Metrics Service
 * Logs conversation metrics for monitoring bot performance
 */

export interface ConversationMetrics {
  conversationId: string;
  botConfig: string;
  outcome: 'qualified' | 'dropped' | 'in_progress';
  messageCount: number;
  questionsAsked: number;
  loopsDetected: number;
  frustrationDetected: boolean;
  toolsUsed: string[];
  timestamp: Date;
}

/**
 * Log conversation outcome for analytics
 */
export function logConversationMetrics(metrics: ConversationMetrics): void {
  console.log('📊 [METRICS]', {
    config: metrics.botConfig,
    outcome: metrics.outcome,
    messages: metrics.messageCount,
    loops: metrics.loopsDetected,
    frustrated: metrics.frustrationDetected,
    tools: metrics.toolsUsed,
    conversationId: metrics.conversationId
  });

  // TODO: Could also save to database for dashboards
  // await prisma.conversationMetrics.create({ data: metrics });
}

/**
 * Detect if user is frustrated based on messages
 */
export function detectFrustration(messages: any[]): boolean {
  const frustrationPhrases = [
    'loop', 'bucle', 'repet', 'ja t\'ho he dit', 'ja te ho he dit',
    'joder', 'cansino', 'pesado', 'otra vez'
  ];

  const recentMessages = messages.slice(-5); // Check last 5 messages
  
  return recentMessages.some((msg: any) => {
    if (msg.role !== 'user') return false;
    const content = msg.content.toLowerCase();
    return frustrationPhrases.some(phrase => content.includes(phrase));
  });
}

/**
 * Detect if bot repeated the same question
 */
export function detectLoops(messages: any[]): number {
  let loopCount = 0;
  const botQuestions: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'bot' && msg.content.includes('?')) {
      // Normalize question (remove punctuation, lowercase)
      const normalized = msg.content
        .toLowerCase()
        .replace(/[?.!¿¡]/g, '')
        .trim();
      
      // Check if we've asked this before
      if (botQuestions.includes(normalized)) {
        loopCount++;
      }
      botQuestions.push(normalized);
    }
  }

  return loopCount;
}

/**
 * Count how many questions user asked
 */
export function countUserQuestions(messages: any[]): number {
  return messages.filter((msg: any) => 
    msg.role === 'user' && msg.content.includes('?')
  ).length;
}

