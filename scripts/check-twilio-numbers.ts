import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC42c9ce3c36af584a5925c9f12fccff8b';
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!authToken) {
  console.error('❌ Please set TWILIO_AUTH_TOKEN in your .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function checkNumbers() {
  console.log('🔍 Checking your Twilio numbers...\n');

  try {
    // Get all phone numbers
    const numbers = await client.incomingPhoneNumbers.list();

    console.log(`Found ${numbers.length} phone number(s):\n`);

    numbers.forEach((number, index) => {
      console.log(`${index + 1}. ${number.phoneNumber}`);
      console.log(`   Friendly Name: ${number.friendlyName}`);
      console.log(`   SMS URL: ${number.smsUrl || '(not set)'}`);
      console.log(`   Voice URL: ${number.voiceUrl || '(not set)'}`);
      console.log(`   Capabilities: ${JSON.stringify(number.capabilities)}`);
      console.log('');
    });

    // Check for WhatsApp-enabled numbers
    console.log('\n📱 Checking WhatsApp Sandbox...');
    // Note: WhatsApp sandbox info requires different API calls
    console.log('To see WhatsApp numbers, visit: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkNumbers();
