import axios from 'axios';
import { QualifiedLead } from '@hola-tattoo/shared-types';

export async function sendLeadToWebhook(
  webhookUrl: string,
  lead: QualifiedLead
): Promise<boolean> {
  try {
    console.log(`📤 Sending lead to webhook: ${webhookUrl}`);

    const response = await axios.post(webhookUrl, lead, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HolaTattoo-Bot/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ Lead sent successfully to ${webhookUrl}`);
      return true;
    } else {
      console.error(`❌ Webhook returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Error sending to webhook: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
      }
    } else {
      console.error('❌ Unknown error sending to webhook:', error);
    }
    return false;
  }
}
