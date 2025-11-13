/**
 * Helper functions for lead management and conversation flow
 */

/**
 * Detect if changes between old and new data are significant
 * Significant changes require user confirmation before updating
 */
export function detectSignificantChange(
  oldData: Record<string, any>,
  newData: Record<string, any>
): { significant: boolean; changes: string[] } {
  const significantFields = ['description', 'placement', 'placement_size', 'placement_concept'];
  const changes: string[] = [];
  let significant = false;

  for (const field of significantFields) {
    const oldValue = oldData[field];
    const newValue = newData[field];

    // Check if value changed
    if (oldValue && newValue && oldValue !== newValue) {
      changes.push(`${field}: ${oldValue} → ${newValue}`);
      significant = true;
    }
  }

  // Check for size changes in placement
  const sizeWords = ['petit', 'gran', 'mitjà', 'sencer', 'complet', 'completa', 'sencera'];
  const oldSize = sizeWords.find(s => oldData.placement?.toLowerCase().includes(s) || oldData.placement_size?.toLowerCase().includes(s));
  const newSize = sizeWords.find(s => newData.placement?.toLowerCase().includes(s) || newData.placement_size?.toLowerCase().includes(s));

  if (oldSize && newSize && oldSize !== newSize) {
    significant = true;
    if (!changes.some(c => c.includes('placement'))) {
      changes.push(`mida: ${oldSize} → ${newSize}`);
    }
  }

  return { significant, changes };
}

/**
 * Detect if user message is a confirmation
 * Used when waiting for user to confirm an update
 */
export function detectConfirmationIntent(userMessage: string): boolean {
  const confirmationPhrases = [
    'sí', 'si', 'yes', 'vale', 'ok', 'd\'acord', 'de acord', 'dacord',
    'endavant', 'perfecte', 'genial', 'correcte', 'exacte', 'això', 'ja està',
    'confirmo', 'confirma', 'actualitza', 'canvia', 'canviat'
  ];

  const lowerMessage = userMessage.toLowerCase().trim();

  // Check for exact matches (short messages)
  if (confirmationPhrases.some(phrase => lowerMessage === phrase || lowerMessage === `${phrase}!`)) {
    return true;
  }

  // Check for phrases in longer messages
  if (lowerMessage.length < 50) {
    if (confirmationPhrases.some(phrase => lowerMessage.includes(phrase))) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if user message is a rejection/cancellation
 * Used when waiting for user to confirm an update
 */
export function detectRejectionIntent(userMessage: string): boolean {
  const rejectionPhrases = [
    'no', 'nop', 'nope', 'cancel·la', 'cancela', 'deixa\'ho', 'deixa-ho',
    'no cal', 'no fa falta', 'no ho canviïs', 'no ho canvies',
    'no actualitzis', 'no actualitzes', 'manté', 'mantén',
    'així està bé', 'està bé així', 'deixa-ho com està'
  ];

  const lowerMessage = userMessage.toLowerCase().trim();

  // Check for exact matches (short messages)
  if (rejectionPhrases.some(phrase => lowerMessage === phrase || lowerMessage === `${phrase}!`)) {
    return true;
  }

  // Check for phrases in longer messages
  if (lowerMessage.length < 50) {
    if (rejectionPhrases.some(phrase => lowerMessage.includes(phrase))) {
      return true;
    }
  }

  return false;
}

/**
 * Check if collected data has minimum required info to send lead
 * Minimum: description + placement
 */
export function hasMinimumLeadInfo(data: Record<string, any>): boolean {
  const hasDescription = Boolean(data.description);
  const hasPlacement = Boolean(data.placement || data.placement_size || data.placement_concept);
  return hasDescription && hasPlacement;
}

/**
 * Format changes for display to user
 */
export function formatChangesForDisplay(changes: string[]): string {
  if (changes.length === 0) return '';
  if (changes.length === 1) return changes[0];
  return changes.join(', ');
}

