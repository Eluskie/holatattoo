# Testing the Meta WhatsApp Integration

## 🧪 Local Testing Setup

### Step 1: Install ngrok

```bash
# Mac (with Homebrew)
brew install ngrok

# Or download from https://ngrok.com/download
```

### Step 2: Start your local bot-engine

```bash
cd apps/bot-engine
npm run dev
```

You should see:
```
🚀 Bot Engine running on port 3001
📱 WhatsApp webhook: http://localhost:3001/webhook/whatsapp
```

### Step 3: Start ngrok tunnel

In a **new terminal**:

```bash
ngrok http 3001
```

You'll see something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

**Copy that `https://abc123.ngrok.io` URL** - this is your public webhook URL!

### Step 4: Configure Meta Webhook

1. Go to https://developers.facebook.com/apps
2. Select your app
3. Go to **WhatsApp > Configuration**
4. Click **Edit** under Webhook
5. Enter:
   - **Callback URL**: `https://abc123.ngrok.io/webhook/whatsapp` (use YOUR ngrok URL)
   - **Verify Token**: `hola-tattoo-webhook-2025`
6. Click **Verify and Save**

If successful, you'll see ✅ verified!

### Step 5: Subscribe to Messages

Make sure you're subscribed to the `messages` webhook field.

### Step 6: Test with a Real WhatsApp Message!

1. Send a WhatsApp message to your business number
2. Watch the logs in your terminal

You should see:
```
📨 Webhook received: {...}
📱 Incoming WhatsApp message: { from: '34999...', text: '...' }
🤖 Processing message...
✅ Sent message to whatsapp:+34... (delay: 1500ms)
📱 Message ID: wamid.xxx
```

---

## 🔍 Testing Checklist

### Test 1: Webhook Verification (GET)

Test that Meta can verify your webhook:

```bash
curl "http://localhost:3001/webhook/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=hola-tattoo-webhook-2025"
```

**Expected**: `test123` (echoes the challenge)

If you get `test123` back, webhook verification works! ✅

### Test 2: Send a Test Webhook (POST)

You can simulate Meta sending a webhook:

```bash
curl -X POST http://localhost:3001/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "34999888777",
            "id": "wamid.test123",
            "timestamp": "1234567890",
            "text": {
              "body": "Hola!"
            }
          }]
        }
      }]
    }]
  }'
```

**Expected**:
- Returns `200 OK`
- Bot processes the message
- Bot tries to send a response via Meta API

**Check the logs** - you should see:
```
📨 Webhook received: {...}
📱 Incoming WhatsApp message: { from: '34999888777', text: 'Hola!' }
```

### Test 3: Real WhatsApp Message

This is the **real test**:

1. Make sure ngrok is running and webhook is configured in Meta
2. Send a WhatsApp message to your business number from your phone
3. Watch the terminal logs
4. You should receive a response!

---

## 🐛 Troubleshooting

### "Missing WHATSAPP_ACCESS_TOKEN" error
- Check your `.env` file has the token
- Restart your server: `npm run dev`

### Webhook verification fails (403)
- Check that `WEBHOOK_VERIFY_TOKEN` in `.env` matches what you entered in Meta dashboard
- Should be: `hola-tattoo-webhook-2025`

### Messages received but not responded to
- Check logs for errors
- Verify `WHATSAPP_ACCESS_TOKEN` is correct
- Check `WHATSAPP_PHONE_NUMBER_ID=870562186141111` is correct

### "WhatsApp API error" when sending
- Your access token may have expired - get a new one from Meta
- Check that you have message credits in Meta Business Manager

### Bot responds but messages don't arrive on WhatsApp
- Check Meta Business Manager > WhatsApp > Message Templates
- Verify your app is in Production mode (not Development)
- Check you're messaging from a phone number that's verified with Meta

---

## 📊 What to Watch in the Logs

### Good Flow:
```
📨 Webhook received: {...}
📱 Incoming WhatsApp message: { from: '34999888777', text: 'Hola!' }
🤖 [PEP] Response: { isComplete: false, readyToSend: false }
✅ Sent message to whatsapp:+34999888777 (delay: 1500ms)
📱 Message ID: wamid.HBgLMzQ2NTY1NTc...
```

### Error Flow:
```
📨 Webhook received: {...}
📱 Incoming WhatsApp message: { from: '34999888777', text: 'Hola!' }
❌ Error sending WhatsApp message: WhatsApp API error: {...}
```

---

## 🚀 Production Testing

Once deployed to Coolify:

1. **No ngrok needed!** Meta will hit your production URL directly
2. Configure webhook with your production domain:
   - `https://your-domain.com/webhook/whatsapp`
3. Test by sending a WhatsApp message
4. Check Coolify logs to see what's happening

---

## 📝 Key Differences vs Twilio

| Aspect | Twilio | Meta Cloud API |
|--------|--------|----------------|
| **Webhook URL** | `/webhook/twilio/whatsapp` | `/webhook/whatsapp` |
| **Webhook Format** | Form-encoded | JSON |
| **Verification** | Not required | GET endpoint required |
| **Phone Format** | `whatsapp:+34999...` | Just `34999...` (auto-formatted) |
| **Testing** | Same as before | Same process with ngrok |
| **Logs** | "Twilio webhook" | "Meta webhook" |

**Everything else stays the same!** Your conversation logic, database, AI responses - all unchanged.

---

## 🎯 Quick Test Command

Once everything is set up, this is the fastest way to test:

```bash
# Send a real WhatsApp message to your business number
# Then watch the terminal for logs
```

That's it! If you see the message arrive in the logs and a response sent, you're golden! ✅
