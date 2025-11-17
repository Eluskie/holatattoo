import express from 'express';
import { TwilioIncomingMessage } from '@hola-tattoo/shared-types';
import { handleIncomingMessage } from '../services/conversationService';
import { sendWhatsAppMessage } from '../services/whatsappService';

export const whatsappRouter = express.Router();

/**
 * Webhook verification (GET) - Meta requires this for webhook setup
 */
whatsappRouter.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Webhook verification request:', { mode, token: token ? '***' : undefined });

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * Webhook messages (POST) - Meta's webhook format
 */
whatsappRouter.post('/', async (req, res) => {
  try {
    const body = req.body;

    console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

    // Quick response to Meta (they require fast 200 response)
    res.sendStatus(200);

    // Process webhook asynchronously
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.value?.messages) {
            const incomingMessage = change.value.messages[0];
            const from = incomingMessage.from;
            const messageId = incomingMessage.id;
            const text = incomingMessage.text?.body;

            console.log('📱 Incoming WhatsApp message:', {
              from,
              text,
              id: messageId
            });

            // Convert Meta format to our internal format (keeping compatibility with existing code)
            const message: TwilioIncomingMessage = {
              MessageSid: messageId,
              From: `whatsapp:+${from}`, // Meta sends just the number, we add whatsapp: prefix
              To: 'whatsapp:+34999999999', // This will be looked up from studio config
              Body: text || '',
              NumMedia: '0'
            };

            // Process message asynchronously (don't await to keep response fast)
            processMessage(message).catch(error => {
              console.error('Error processing message:', error);
            });
          }
        });
      });
    }
  } catch (error) {
    console.error('Error handling Meta webhook:', error);
    // Still send 200 to Meta even if we had an error processing
    // This prevents Meta from retrying unnecessarily
  }
});

/**
 * Process incoming message and send responses
 */
async function processMessage(message: TwilioIncomingMessage): Promise<void> {
  try {
    // Process the message and get response
    const response = await handleIncomingMessage(message);

    // Send response back via WhatsApp (multiple messages with typing indicator)
    if (response && response.messages) {
      for (let i = 0; i < response.messages.length; i++) {
        const msg = response.messages[i];
        const isLast = i === response.messages.length - 1;

        // Send message with simulated typing and smart delay
        await sendWhatsAppMessage(
          message.From,
          msg,
          isLast ? response.buttons : undefined, // Only add buttons to last message
          undefined // Let smart delay calculate automatically
        );
      }
    }
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    throw error;
  }
}
