# Bot Engine

Express.js backend that handles WhatsApp messages via Twilio and uses Claude AI for natural language understanding.

## Features

- Receives WhatsApp messages via Twilio webhook
- Manages conversation state in PostgreSQL
- Uses Claude AI to extract information from user responses
- Sends qualified leads to studio webhooks
- Multi-tenant support (multiple studios)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. Make sure PostgreSQL is running and database is set up:
   ```bash
   cd ../../packages/database
   npm run migrate
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001`

## Twilio Webhook Setup

1. Go to your Twilio Console
2. Navigate to your WhatsApp Sandbox or WhatsApp Business Profile
3. Set the webhook URL to: `https://your-domain.com/webhook/twilio/whatsapp`
4. For local development, use ngrok:
   ```bash
   ngrok http 3001
   ```
   Then use the ngrok URL: `https://your-ngrok-url.ngrok.io/webhook/twilio/whatsapp`

## Testing

You can test the webhook endpoint using curl:

```bash
curl -X POST http://localhost:3001/webhook/twilio/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM123456" \
  -d "From=whatsapp:+1234567890" \
  -d "To=whatsapp:+14155238886" \
  -d "Body=John"
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /webhook/twilio/whatsapp` - Twilio WhatsApp webhook

## Environment Variables

See `.env.example` for required variables.
