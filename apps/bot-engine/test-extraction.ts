/**
 * Test script for function-based data extraction
 * Run with: npx tsx test-extraction.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

import { getConversationalResponse, ConversationContext } from './src/services/conversationalAiService';

async function testExtraction() {
  console.log('🧪 Testing OpenAI Function Calling for Data Extraction\n');

  // Test 1: Initial message with style and location
  console.log('📝 Test 1: "Hola, m\'agradaria fer-me un tatuatge a l\'esquena de 20 centímetres. De color negre i d\'estil realista."');
  const context1: ConversationContext = {
    collectedData: {},
    conversationHistory: []
  };
  const result1 = await getConversationalResponse(
    "Hola, m'agradaria fer-me un tatuatge a l'esquena de 20 centímetres. De color negre i d'estil realista.",
    context1
  );
  console.log('✅ Extracted:', JSON.stringify(result1.extractedData, null, 2));
  console.log('💬 Response:', result1.messages);
  console.log('');

  // Test 2: Correction message
  console.log('📝 Test 2: "No, l\'estil és l\'estil realista, o sigui... Estil realista, sí. I el pressupost, menys de 100, crac."');
  const context2: ConversationContext = {
    collectedData: {
      "style": "No estic segur",
      "placement_size": "esquena L",
      "color": "Blanc i negre",
      "budget": "Més de 300€",
      "timing": "Urgent"
    },
    conversationHistory: []
  };
  const result2 = await getConversationalResponse(
    "No, l'estil és l'estil realista, o sigui... Estil realista, sí. I el pressupost, menys de 100, crac.",
    context2
  );
  console.log('✅ Extracted:', JSON.stringify(result2.extractedData, null, 2));
  console.log('💬 Response:', result2.messages);
  console.log('');

  // Test 3: Name extraction
  console.log('📝 Test 3: "Em dic Gerard Martínez"');
  const context3: ConversationContext = {
    collectedData: {
      "style": "Realisme",
      "placement_size": "esquena L",
      "color": "Blanc i negre",
      "budget": "Menys de 150€",
      "timing": "2-4 setmanes"
    },
    conversationHistory: []
  };
  const result3 = await getConversationalResponse(
    "Em dic Gerard Martínez",
    context3
  );
  console.log('✅ Extracted:', JSON.stringify(result3.extractedData, null, 2));
  console.log('💬 Response:', result3.messages);
  console.log('🎉 Is Complete:', result3.isComplete);
  console.log('');

  console.log('✅ All tests completed!');
  process.exit(0);
}

testExtraction().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
