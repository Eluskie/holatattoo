/**
 * WhatsApp Cloud API Service (Meta)
 * Replaces Twilio for direct WhatsApp messaging via Meta's Graph API
 */

interface WhatsAppMessageResponse {
  messages?: Array<{
    id: string;
  }>;
}

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0/870562186141111/messages';
let accessToken: string;
let phoneNumberId: string;

function getWhatsAppConfig() {
  if (!accessToken) {
    accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '870562186141111';

    if (!accessToken) {
      throw new Error('Missing WHATSAPP_ACCESS_TOKEN environment variable');
    }
  }
  return { accessToken, phoneNumberId };
}

/**
 * Calculate smart delay based on message length
 * Simulates natural typing speed
 */
function calculateSmartDelay(message: string): number {
  const length = message.length;

  // <20 chars: instant
  if (length < 20) return 0;

  // 20-50 chars: 1-2 sec
  if (length < 50) return 1000 + Math.random() * 1000;

  // 50-100 chars: 2-4 sec
  if (length < 100) return 2000 + Math.random() * 2000;

  // 100+ chars: 3-5 sec
  return 3000 + Math.random() * 2000;
}

/**
 * Send WhatsApp message with simulated typing delay
 * Uses Meta's WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  buttons?: string[],
  customDelay?: number
): Promise<void> {
  try {
    const { accessToken } = getWhatsAppConfig();

    // Step 1: Calculate delay
    const delay = customDelay !== undefined
      ? customDelay
      : calculateSmartDelay(body);

    // Step 2: Wait (simulates typing)
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Build message with buttons if provided
    let finalBody = body;
    if (buttons && buttons.length > 0) {
      const limitedButtons = buttons.slice(0, 3); // WhatsApp limit: 3 buttons
      finalBody = `${body}\n\n${limitedButtons.map((btn, i) => `${i + 1}. ${btn}`).join('\n')}`;
    }

    // Format phone number: remove all non-digits
    const cleanedPhone = to.replace(/\D/g, '');

    // Send message via Meta's WhatsApp Cloud API
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanedPhone,
        type: 'text',
        text: { body: finalBody }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json() as WhatsAppMessageResponse;
    console.log(`✅ Sent message to ${to} (delay: ${delay}ms)${buttons ? ' with buttons' : ''}`);
    console.log(`📱 Message ID: ${result.messages?.[0]?.id}`);

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
