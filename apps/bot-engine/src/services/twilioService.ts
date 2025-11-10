import twilio from 'twilio';

let client: ReturnType<typeof twilio>;
let whatsappNumber: string;

function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error('Missing Twilio environment variables');
    }

    client = twilio(accountSid, authToken);
  }
  return { client, whatsappNumber };
}

/**
 * Calculate smart delay based on message length
 * Step 1: Delay policy
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
 * COMMENTED OUT - Twilio typing indicator API approach
 * This doesn't work well with WhatsApp Programmable Messaging
 * Keeping for reference if we switch to Conversations API
 */
// export async function sendTypingIndicator(to: string, messageSid?: string): Promise<void> {
//   if (!messageSid) {
//     console.log('⚠️  No messageSid — skipping typing indicator');
//     return;
//   }

//   try {
//     const accountSid = process.env.TWILIO_ACCOUNT_SID;
//     const authToken = process.env.TWILIO_AUTH_TOKEN;

//     // Direct REST API call as per official Twilio docs
//     // https://messaging.twilio.com/v2/Indicators/Typing.json
//     const url = 'https://messaging.twilio.com/v2/Indicators/Typing.json';

//     const params = new URLSearchParams();
//     params.append('messageId', messageSid);
//     params.append('channel', 'whatsapp');

//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       body: params.toString()
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       if (response.status !== 404) {
//         console.log('Typing indicator failed:', response.status, errorText);
//       }
//     } else {
//       console.log(`💬 Typing indicator sent to ${to}`);
//     }
//   } catch (error: any) {
//     console.log('Typing indicator failed (non-critical):', error.message || error);
//   }
// }

/**
 * Send WhatsApp message with simulated typing delay
 * Calculate delay based on message length and wait before sending
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  buttons?: string[],
  customDelay?: number
): Promise<void> {
  try {
    const { client, whatsappNumber } = getTwilioClient();

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

    // Send actual message
    await client.messages.create({
      from: whatsappNumber,
      to: to,
      body: finalBody
    });

    console.log(`✅ Sent message to ${to} (delay: ${delay}ms)${buttons ? ' with buttons' : ''}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
