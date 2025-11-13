# 🚀 Sistema Flexible de Gestió de Leads - Implementació Completa

## 📋 Resum Executiu

S'ha implementat un sistema complet que permet:
- **Conversa fluida**: El bot pot respondre preguntes després d'enviar el lead
- **No-pushy**: No força l'usuari a qualificar si no vol
- **Updates intel·ligents**: Canvis menors automàtics, majors amb confirmació
- **Preu automàtic**: Mostra estimació de preu quan envia el lead

---

## 🎯 Nou Flow de Conversa

### Abans ❌
```
User: "Vull una rosa al braç"
Bot: [recull info]
Bot: "Tot correcte? Sí/No"
User: "Sí"
Bot: [envia + tanca conversa]
User: "Gràcies"
Bot: [NOVA CONVERSA! ❌]
```

### Ara ✅
```
User: "Vull una rosa al braç"
Bot: [extreu info silenciosament]
Bot: "A quina part?"
User: "Al braç"
Bot: [ENVIA AUTOMÀTICAMENT]
     "Una rosa al braç, perfecte! Sol anar entre 150-300€. 
      L'artista t'ho confirmarà. 
      Ja he passat la info! Alguna cosa més?"
User: "Teniu disponibilitat aquesta setmana?"
Bot: "Normalment responen en 1-2 dies..."
User: "Ah i que sigui en color"
Bot: [UPDATE AUTOMÀTIC] "Entesos! He actualitzat: en color."
User: "Millor al bíceps"
Bot: "Vols que actualitzi? Canviaria de braç a bíceps (120-250€)"
User: "Sí"
Bot: [UPDATE] "Fet! Alguna cosa més?"
User: "No, ja està"
Bot: [CLOSE] "Perfecte! Fins aviat! 😊"
```

---

## 🔧 Canvis Implementats

### 1️⃣ **Base de Dades (schema.prisma)**

**Nous camps a `Conversation`:**
```prisma
leadStatus     String?   // 'pending', 'sent', 'updated'
leadSentAt     DateTime? // Quan s'ha enviat el lead
lastUpdatedAt  DateTime? // Última actualització del lead
closedAt       DateTime? // Quan s'ha tancat la conversa
closeReason    String?   // Per què s'ha tancat
pendingUpdate  Json?     // Canvis pendents de confirmació
```

**Migració creada:**
- `packages/database/prisma/migrations/20251113113248_add_lead_tracking_fields/migration.sql`

---

### 2️⃣ **Tools del Bot (botConfigs.ts)**

| Tool | Quan usar | Què fa |
|------|-----------|--------|
| `extract_tattoo_info` | Sempre que user menciona detalls | Extreu silenciosament |
| `send_to_studio` | Quan tens descripció + ubicació | Envia lead (1 cop només) |
| `update_lead` | Després d'enviar, si user canvia info | Update amb/sense confirmació |
| `close_conversation` | User confirma "ja està" | Tanca conversa |

**Eliminat:**
- ❌ `answer_studio_question` (bot respon directament ara)

---

### 3️⃣ **System Prompt (buildPepPrompt)**

**Actualitzacions:**
- Passa `leadSent` (boolean) i `priceEstimate` (min/max)
- Instruccions clares per cada tool
- Exemples concrets de cada cas d'ús
- Regla crítica: **send ≠ close** (conversa continua!)

---

### 4️⃣ **Conversational AI Service**

**Nou processament:**
```typescript
if (toolCall === 'send_to_studio') {
  // Calcula preu
  // Afegeix preu si GPT no ho va fer
  // Afegeix "Alguna cosa més?"
}

if (toolCall === 'update_lead') {
  if (requiresConfirmation) {
    // Canvi significatiu → Espera confirmació
  } else {
    // Canvi menor → Update automàtic
  }
}
```

---

### 5️⃣ **Conversation Service**

**Nova lògica per Pep config:**

1. **SEND** (`aiResponse.readyToSend`)
   - Calcula preu
   - Envia lead via webhook
   - Marca: `leadStatus: 'sent'`, `leadSentAt: now()`
   - **Manté conversa activa!** (`status: 'active'`)
   - Afegeix preu i "Alguna cosa més?"

2. **UPDATE** (`aiResponse.shouldUpdate`)
   - **Canvi significatiu?** → Pregunta confirmació
   - **Canvi menor?** → Auto-update i notifica

3. **CONFIRMATION** (`pending_update_confirmation`)
   - User confirma → Update lead
   - User rebutja → Cancel·la update

4. **CLOSE** (`aiResponse.shouldClose`)
   - Marca: `status: 'closed'`, `closedAt: now()`

---

### 6️⃣ **Helper Functions (leadHelpers.ts)**

Nou fitxer amb utilitats:

```typescript
detectSignificantChange(oldData, newData)
// → { significant: boolean, changes: string[] }

detectConfirmationIntent(userMessage)
// → true si "sí", "vale", "ok", etc.

detectRejectionIntent(userMessage)
// → true si "no", "cancel·la", etc.

hasMinimumLeadInfo(data)
// → true si description + placement
```

---

## 🚀 Deployment

### 1. **Aplicar Migració DB**

```bash
cd packages/database
npx prisma migrate deploy
```

### 2. **Rebuild & Deploy**

```bash
# Bot Engine
cd apps/bot-engine
npm run build

# Dashboard (si has canviat)
cd apps/dashboard
npm run build

# Deploy (Coolify/Docker)
git push origin main
# Coolify auto-deploy
```

### 3. **Verificar Env Vars**

Assegura't que tens:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- Altres env vars necessàries

---

## ✅ Testing Plan

### Test 1: Send + Continue
```
1. User: "Vull una rosa al braç"
2. ✅ Bot extreu i envia automàticament
3. ✅ Mostra preu orientatiu
4. ✅ Pregunta "Alguna cosa més?"
5. User: "On esteu?"
6. ✅ Bot respon (conversa continua!)
```

### Test 2: Minor Update
```
1. [Després del Test 1]
2. User: "I que sigui en color"
3. ✅ Bot: "Entesos! He actualitzat: en color."
4. ✅ Lead actualitzat sense confirmació
```

### Test 3: Major Update
```
1. [Després del Test 1]
2. User: "Millor al bíceps"
3. ✅ Bot: "Vols que actualitzi? Canviaria braç → bíceps"
4. User: "Sí"
5. ✅ Bot: "Fet! He actualitzat."
```

### Test 4: Close
```
1. [Després de qualsevol test anterior]
2. User: "Ja està, gràcies"
3. ✅ Bot: "De res! Fins aviat! 😊"
4. ✅ Conversa tancada (status: closed)
```

---

## 📊 Mètriques Millorades

Ara pots analitzar:
- **Leads enviats**: Count(`leadStatus = 'sent'`)
- **Leads actualitzats**: Count(`leadStatus = 'updated'`)
- **Converses tancades**: Count(`status = 'closed'`)
- **Temps entre send i close**: `closedAt - leadSentAt`
- **Missatges post-send**: `messages.length` després de `leadSentAt`

---

## 🎯 Beneficis

1. **Més natural**: No interrogatori, conversa fluida
2. **Més flexible**: User pot preguntar després d'enviar
3. **Més intel·ligent**: Updates automàtics per canvis menors
4. **Més segur**: Confirmació per canvis majors
5. **Més transparent**: Preu orientatiu sempre visible
6. **Menys pushy**: Bot no força qualification

---

## 📝 Notes Importants

### ⚠️ Migració DB
La migració afegeix camps opcionals (`NULL`), així que és **safe** aplicar-la en producció sense downtime.

### 🔄 Retrocompatibilitat
- **Current config**: Sense canvis, funciona com abans
- **Pep config**: Nou flow activat automàticament
- Pots canviar entre configs a `botConfigs.ts` (`ACTIVE_CONFIG`)

### 🧪 Testing
- Usa el Bot Test Chat (`/dashboard/bot-test`) per testejar sense cost
- Templates disponibles per simular flows complets
- Evaluations per comparar configs

---

## 🐛 Troubleshooting

### Error: "Property 'leadSentAt' does not exist"
```bash
cd packages/database
npx prisma generate
```

### Error: "Migration not applied"
```bash
cd packages/database
npx prisma migrate deploy
```

### Bot no mostra preu
- Verifica que `hasEnoughDataForEstimate()` retorna `true`
- Comprova que `style` i `placement_size` estan recollits
- Mira logs: `priceEstimate: { min, max }`

---

## 🎉 Fet!

Tots els canvis estan implementats i testejats. Ara només cal:

1. ✅ **Aplicar migració** (`prisma migrate deploy`)
2. ✅ **Redesployer** a Coolify
3. ✅ **Testejar** amb usuaris reals

**Commit hash:** `97d5b61`
**Branch:** `main`
**Status:** ✅ Ready to deploy

---

## 📚 Files Modificats

1. `packages/database/prisma/schema.prisma` - Nou schema
2. `packages/database/prisma/migrations/.../migration.sql` - Migració
3. `apps/bot-engine/src/config/botConfigs.ts` - Tools + prompt
4. `apps/bot-engine/src/services/conversationalAiService.ts` - Tool processing
5. `apps/bot-engine/src/services/conversationService.ts` - Flow logic
6. `apps/bot-engine/src/services/leadHelpers.ts` - **NOU** Helper functions
7. `apps/bot-engine/src/services/priceEstimationService.ts` - Add `estimatePrice()`

---

**Questions? Issues? Let me know!** 🚀

