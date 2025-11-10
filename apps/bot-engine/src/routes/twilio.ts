import express from 'express';
import { TwilioIncomingMessage } from '@hola-tattoo/shared-types';
import { handleIncomingMessage } from '../services/conversationService';
import { sendWhatsAppMessage } from '../services/twilioService';

export const twilioRouter = express.Router();

twilioRouter.post('/whatsapp', async (req, res) => {
  try {
    const message: TwilioIncomingMessage = {
      MessageSid: req.body.MessageSid,
      From: req.body.From,
      To: req.body.To,
      Body: req.body.Body,
      NumMedia: req.body.NumMedia
    };

    console.log('📨 Incoming WhatsApp message:', {
      from: message.From,
      body: message.Body,
      sid: message.MessageSid
    });

    // Process the message and get response
    const response = await handleIncomingMessage(message);

    // Send response back via Twilio (multiple messages with typing indicator)
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

    // Twilio expects a 200 response
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    res.status(500).send('Error processing message');
  }
});
