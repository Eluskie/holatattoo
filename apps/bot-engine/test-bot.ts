import axios from 'axios';

const BOT_URL = 'http://localhost:3001/webhook/twilio/whatsapp';

// Simulate a Twilio message
async function sendMessage(body: string, from: string = '+1234567890') {
  const response = await axios.post(BOT_URL, new URLSearchParams({
    MessageSid: `SM${Date.now()}`,
    From: `whatsapp:${from}`,
    To: 'whatsapp:+14155238886',
    Body: body
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  console.log('\n📱 User:', body);
  console.log('🤖 Bot:', response.data);
}

async function testConversation() {
  console.log('🧪 Starting bot test conversation...\n');

  try {
    await sendMessage('Hola!');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage('Realisme');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage('Braç, M');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage('Blanc i negre');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage('150-300€');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage('2-4 setmanes');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage('Marc');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sendMessage('Sí');

    console.log('\n✅ Test conversation completed!');
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testConversation();
