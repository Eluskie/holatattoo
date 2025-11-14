/**
 * Bot Engine Version
 * Update this when making significant changes
 */

export const BOT_VERSION = {
  version: '2.0.0',
  name: 'Pep - Flexible Conversational Bot',
  releaseDate: '2024-11-13',
  changes: [
    'Flexible conversation flow (not pushy)',
    'Passive tattoo info extraction',
    'Lead management with send/update/close tools',
    'Price estimation with natural recap',
    '"Alguna cosa més?" pattern (1 yes, 2 no)',
    'Smart response generation',
    'Support for general studio questions'
  ],
  config: 'PEP_CONFIG'
};

export function getVersionString(): string {
  return `Bot Engine v${BOT_VERSION.version} (${BOT_VERSION.name})`;
}

export function logVersion(): void {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🤖 ${getVersionString().padEnd(50)} ║
║  📅 Released: ${BOT_VERSION.releaseDate.padEnd(40)} ║
║  ⚙️  Active Config: ${BOT_VERSION.config.padEnd(37)} ║
╚════════════════════════════════════════════════════════╝
  `);
}

