/**
 * Dashboard Version
 * Update this when making significant changes
 */

export const DASHBOARD_VERSION = {
  version: '2.0.0',
  name: 'Dashboard with Bot Test & Templates',
  releaseDate: '2024-11-13',
  features: [
    'Bot Test Chat (cost-free testing)',
    'Template system for conversation testing',
    'Conversation history & debug info',
    'Event tracking (send/update/close)',
    'Multi-tenant support',
    'Studio configuration'
  ]
};

export function getVersionString(): string {
  return `Dashboard v${DASHBOARD_VERSION.version} (${DASHBOARD_VERSION.name})`;
}

