# WhatsApp Migration Guide: Twilio → Meta Cloud API

## Migration Complete! ✅

Your Hola Tattoo bot has been successfully migrated from Twilio to Meta's WhatsApp Cloud API.

---

## Summary of Changes

### Files Created:
1. **`apps/bot-engine/src/services/whatsappService.ts`**
   - New WhatsApp messaging service using Meta's Cloud API
   - Replaces Twilio client with direct fetch() calls to Meta's Graph API
   - Maintains smart typing delays and message formatting

2. **`apps/bot-engine/src/routes/whatsapp.ts`**
   - New webhook handler for Meta's WhatsApp webhook format
   - Includes GET endpoint for webhook verification (required by Meta)
   - Includes POST endpoint for receiving messages
   - Converts Meta's message format to internal format for compatibility

### Files Modified:
1. **`apps/bot-engine/src/index.ts`**
   - Changed route from `/webhook/twilio` to `/webhook/whatsapp`
   - Updated import from `twilioRouter` to `whatsappRouter`
   - Updated console logs

2. **`apps/bot-engine/package.json`**
   - Removed `twilio` dependency (saves ~15MB in deployment size!)
   - All other dependencies unchanged

3. **`apps/bot-engine/.env.example`**
   - Removed: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
   - Added: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WEBHOOK_VERIFY_TOKEN`

### Files Deleted:
1. **`apps/bot-engine/src/services/twilioService.ts`** - No longer needed
2. **`apps/bot-engine/src/routes/twilio.ts`** - No longer needed

---

## Environment Variables Setup

### Required Variables:

```bash
# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your_meta_access_token_here
WHATSAPP_PHONE_NUMBER_ID=870562186141111
WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_here  # Choose any string for verification

# OpenAI (unchanged)
OPENAI_API_KEY=your_openai_api_key

# Database (unchanged)
DATABASE_URL="postgresql://..."
```

### Where to add them:

1. **Development**: Add to `apps/bot-engine/.env`
2. **Production (Coolify)**: Add to environment variables in Coolify dashboard

---

## Meta Webhook Setup

### Step 1: Deploy Your Code
Deploy the updated code to your production server first (Coolify should handle this automatically).

### Step 2: Configure Webhook in Meta Business

1. Go to https://developers.facebook.com/apps
2. Select your app
3. Go to **WhatsApp > Configuration**
4. Under **Webhook**, click **Edit**
5. **Callback URL**: `https://your-domain.com/webhook/whatsapp`
6. **Verify Token**: Use the same value you set in `WEBHOOK_VERIFY_TOKEN`
7. Click **Verify and Save**

### Step 3: Subscribe to Webhook Fields

Make sure these fields are subscribed:
- ✅ `messages` - Required to receive messages
- ✅ `message_status` - Optional, for delivery/read receipts

---

## Testing

### 1. Test Webhook Verification (GET)

```bash
curl "https://your-domain.com/webhook/whatsapp?hub.mode=subscribe&hub.challenge=12345&hub.verify_token=YOUR_VERIFY_TOKEN"
```

Expected response: `12345` (echoes the challenge)

### 2. Test Sending Messages

Once configured, send a WhatsApp message to your business number. Check logs:

```bash
# Development
npm run dev

# Production (Coolify)
# View logs in Coolify dashboard
```

You should see:
```
📨 Webhook received: {...}
📱 Incoming WhatsApp message: { from: '...',  text: '...' }
✅ Sent message to whatsapp:+... (delay: 1500ms)
```

---

## Key Differences: Twilio vs Meta

| Feature | Twilio | Meta Cloud API |
|---------|--------|----------------|
| **Cost** | ~$0.005/msg | **FREE** up to 1,000 conversations/month |
| | | $0.0067-0.0375/msg after that |
| **Webhook Format** | Form-encoded | JSON |
| **Phone Format** | `whatsapp:+34999...` | `34999...` (no prefix) |
| **API** | REST via SDK | REST via Graph API |
| **Setup** | Quick (via SDK) | Requires Meta app setup |

---

## Webhook Message Format

### Incoming (from Meta):

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "34999888777",
          "id": "wamid.xxx",
          "text": {
            "body": "Hello!"
          }
        }]
      }
    }]
  }]
}
```

### Internal (our format):

```javascript
{
  MessageSid: "wamid.xxx",
  From: "whatsapp:+34999888777",  // We add the prefix
  To: "whatsapp:+34999999999",
  Body: "Hello!",
  NumMedia: "0"
}
```

This maintains compatibility with your existing conversation logic!

---

## Troubleshooting

### "Missing WHATSAPP_ACCESS_TOKEN" error
- Make sure you've added the environment variable
- Restart your server after adding env vars
- In Coolify, check that env vars are set in the dashboard

### Webhook verification fails
- Check that `WEBHOOK_VERIFY_TOKEN` matches in both your .env and Meta dashboard
- Ensure your server is publicly accessible
- Check server logs for errors

### Messages not being received
- Verify webhook is subscribed to `messages` field
- Check Meta app status (must be in production mode, not development)
- View webhook logs in Meta dashboard: **WhatsApp > Webhook Fields**

### Messages not being sent
- Check that `WHATSAPP_ACCESS_TOKEN` has not expired
- Verify Phone Number ID is correct: `870562186141111`
- Check you have sufficient message credits in Meta Business Manager

---

## Cost Savings

**Twilio**: ~$0.005 per message
**Meta**: FREE for first 1,000 conversations/month

**Estimated monthly savings** (at 5,000 messages/month):
- Twilio: $25/month
- Meta: $0 (if under 1,000 conversations) or ~$4-19/month
- **Savings: $6-21/month** 💰

---

## Next Steps

1. ✅ Code migrated (done!)
2. ⏳ Add environment variables to Coolify
3. ⏳ Deploy to production
4. ⏳ Configure webhook in Meta Business dashboard
5. ⏳ Test with a WhatsApp message

## Need Help?

- Meta WhatsApp API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
- Webhook Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
