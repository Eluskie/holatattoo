# Domain Setup Guide - agent.withflare.so

## 🎯 Goal

Set up `agent.withflare.so` as your bot engine domain.

---

## Step 1: Configure DNS

Go to your domain provider (where you registered `withflare.so`).

### Option A: A Record (Direct IP)

```
Type: A
Name: agent
Value: [Your Hetzner Server IP]
TTL: 3600
```

To find your Hetzner server IP:
1. Log into Hetzner Cloud
2. Go to your server
3. Copy the IPv4 address

### Option B: CNAME (Recommended)

If you already have Coolify running on a domain:

```
Type: CNAME
Name: agent
Value: coolify.withflare.so (or your Coolify domain)
TTL: 3600
```

---

## Step 2: Update Coolify Configuration

### 2.1 Log into Coolify

Visit: `https://coolify.withflare.so` (or your Coolify URL)

### 2.2 Find Your Bot Engine App

1. Go to **Projects** → **Hola Tattoo Bot** (or whatever you named it)
2. Click on the bot-engine application

### 2.3 Update Domain

1. Click on **Domains** tab
2. **Current domain:** `bot.withflare.so` 
3. **Change to:** `agent.withflare.so`
4. Click **Save**

### 2.4 Wait for SSL Certificate

Coolify will automatically:
- Generate Let's Encrypt SSL certificate
- Configure HTTPS
- Redirect HTTP to HTTPS

This takes 1-2 minutes.

---

## Step 3: Update Twilio Webhook

### 3.1 Go to Twilio Console

https://console.twilio.com

### 3.2 Update WhatsApp Webhook

1. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
   
   OR
   
   **Phone Numbers** → **Manage** → **Active numbers** → Click your number

2. Scroll to **Webhooks**

3. **When a message comes in:**
   ```
   https://agent.withflare.so/webhook/twilio/whatsapp
   ```

4. **Method:** `POST`

5. Click **Save**

---

## Step 4: Test the Setup

### 4.1 Test Health Endpoint

```bash
curl https://agent.withflare.so/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T...",
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### 4.2 Test WhatsApp

Send a message to your Twilio WhatsApp number.

Check Coolify logs:
1. Go to your app in Coolify
2. Click **Logs** tab
3. You should see incoming webhook requests

---

## Step 5: Update Environment Variables (Optional)

If you have any hardcoded URLs in your environment:

### Bot Engine `.env`

Check if you have:
```bash
# No changes needed - bot engine doesn't need to know its own domain
```

### Dashboard `.env.local`

If you reference the bot URL anywhere:
```bash
NEXT_PUBLIC_BOT_URL=https://agent.withflare.so
```

---

## 🎯 Verification Checklist

- [ ] DNS A or CNAME record created for `agent.withflare.so`
- [ ] Domain updated in Coolify
- [ ] SSL certificate provisioned (shows 🔒 in browser)
- [ ] Health endpoint returns 200 OK
- [ ] Twilio webhook URL updated
- [ ] WhatsApp messages received and processed

---

## 🆘 Troubleshooting

### DNS Not Resolving

```bash
# Check DNS propagation
dig agent.withflare.so

# Or use online tool
# https://dnschecker.org
```

**Solution:** DNS can take 5-60 minutes to propagate. Be patient!

### SSL Certificate Error

**Error:** `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`

**Solution:** 
1. Wait 2-3 minutes for Let's Encrypt
2. Check Coolify logs for SSL errors
3. Try force regenerate in Coolify

### 502 Bad Gateway

**Solution:**
1. Check if bot-engine container is running in Coolify
2. Check logs for errors
3. Verify port 3001 is configured correctly

### Twilio Webhook Not Working

**Check:**
1. URL is exactly: `https://agent.withflare.so/webhook/twilio/whatsapp`
2. Method is `POST`
3. Twilio account has WhatsApp enabled
4. Check Coolify logs for incoming requests

---

## 🌐 Multiple Domains (Optional)

Want both `bot.withflare.so` AND `agent.withflare.so`?

In Coolify domain field, add both separated by comma:
```
agent.withflare.so,bot.withflare.so
```

Both will work and point to the same bot!

---

## 📝 Summary

Your bot is now accessible at:

```
🤖 Bot Engine: https://agent.withflare.so
📊 Health:     https://agent.withflare.so/health
📞 Webhook:    https://agent.withflare.so/webhook/twilio/whatsapp
```

---

**Done!** Your bot is now at `agent.withflare.so` 🎉

