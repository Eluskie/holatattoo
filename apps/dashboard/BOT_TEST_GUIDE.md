# 🤖 Bot Test Chat - Guia d'Ús

## 📋 Què És?

Un sistema complet per testejar i avaluar el bot de tatuatges **sense gastar diners en Twilio**. Permet:
- Conversar amb el bot en temps real
- Executar templates de conversa predefinits
- Guardar i comparar avaluacions
- Veure mètriques i extracted data

---

## 🚀 Com Accedir

1. Ves al dashboard: `http://localhost:3000/dashboard/bot-test`
2. O navega: Dashboard → Bot Test (afegir link al menu si vols)

---

## 💬 Chat Interface

### Funcionalitats:
- **Chat normal**: Escriu missatges com si fossis un usuari real
- **Debug panel**: Veu extracted data, status, conversation ID en temps real
- **Reset**: Tanca la conversa actual i comença una de nova
- **Auto-scroll**: Els missatges fan scroll automàticament

### Dades que es guarden:
- ✅ **Real conversation** a la BD (taula `Conversation`)
- ✅ **Studio Minca** (el teu studio de test)
- ✅ **User phone**: +34999999999 (fake phone per testing)
- ✅ **EXACT same flow** que Twilio (no és mock!)

---

## 📝 Templates

### Templates Predefinits:

1. **Simple Tattoo Request**
   - User dona tota la info d'un cop
   - Esperat: Qualifica ✅
   ```
   "hola!"
   "vull un drac al braç"
   "realisme"
   "Joan"
   ```

2. **Complex Interaction**
   - User pregunta primer, després dona info
   - Esperat: Qualifica ✅ + respon preguntes
   ```
   "hola"
   "a on esteu?"
   "quin horari teniu?"
   "vull fer-me un tattoo"
   "una rosa al braç esquerre"
   "blanc i negre"
   "Maria"
   ```

3. **Price Question**
   - User pregunta preu durant conversa
   - Esperat: Qualifica ✅ + respon preu
   ```
   "hola"
   "vull un tattoo"
   "quan costaria aprox?"
   "un escut del barça al pit"
   "Pepet"
   ```

4. **Incomplete Info**
   - User dona info parcial i marxa
   - Esperat: NO qualifica ❌
   ```
   "hola"
   "vull un tattoo"
   "una rosa"
   "adeu"
   ```

5. **Change Mind**
   - User canvia de idea
   - Esperat: Qualifica ✅ amb darrera info
   ```
   "vull un drac al braç"
   "no espera, millor una rosa"
   "al pit millor"
   "blanc i negre"
   "Joan"
   ```

### Com executar un template:
1. Fes click a **"▶️ Run"** al template
2. El bot executarà tota la conversa automàticament (500ms entre missatges)
3. Veuràs els missatges aparèixer en temps real
4. Al final, fes click a **"💾 Save Evaluation"**

---

## 📊 Sistema d'Avaluacions

### Guardar Avaluació:
1. Executa un template
2. Apareixerà el botó "💾 Save Evaluation"
3. Click per guardar
4. Avaluació guardada amb timestamp, mètriques, i resultats

### Veure Avaluacions:
1. Ves a: `/dashboard/bot-test/evaluations`
2. Veuràs totes les avaluacions guardades
3. Click a una avaluació per veure detalls

### Comparar Avaluacions:
1. Selecciona 2+ avaluacions (checkbox)
2. Veuràs comparació automàtica:
   - **Avg Duration**: Durada mitjana
   - **Avg User Messages**: Missatges user mitjans
   - **Avg Bot Messages**: Missatges bot mitjans
   - **Qualification Rate**: % que qualifiquen

### Dades de cada avaluació:
- ✅ Template usat
- ✅ Config del bot (Pep, Current, etc.)
- ✅ Timestamp
- ✅ Status final (qualified/active/closed)
- ✅ Extracted data complet
- ✅ Conversa completa (tots els missatges)
- ✅ Mètriques (durada, missatges, etc.)

---

## 🎯 Casos d'Ús

### 1. Testejar Canvi al System Prompt
```
1. Modifica el system prompt a botConfigs.ts
2. Restart bot-engine: npm run dev
3. Run template "Simple Tattoo Request"
4. Guarda avaluació
5. Modifica el prompt de nou
6. Run mateix template
7. Guarda avaluació
8. Compara les dues avaluacions
```

### 2. A/B Testing de Configs
```
1. Canvia ACTIVE_CONFIG a PEP_CONFIG
2. Run tots els templates
3. Guarda avaluacions
4. Canvia a CURRENT_CONFIG
5. Run tots els templates
6. Guarda avaluacions
7. Compara qualification rate, avg messages, etc.
```

### 3. Debug Problema Específic
```
1. Reprodueix el problema manualment al chat
2. Veu extracted data en temps real
3. Identifica què falla (ex: no extreu style)
4. Modifica el prompt/tool description
5. Reset i prova de nou
6. Repeteix fins que funcioni
```

### 4. Crear Template Custom
```
// Futur: Podràs crear templates custom des de la UI
// De moment, pots afegir-los a templates/route.ts
```

---

## 💰 Estalvi de Costos

| Abans (Twilio) | Ara (Bot Test) |
|----------------|----------------|
| $18 / 2-3 dies | **$0** |
| ~10 converses/dia | **Il·limitades** |
| ~50 missatges/dia | **Il·limitades** |
| Esperes resposta WhatsApp | **Instantani** |
| Difícil repetir test | **Un click** |

**Estalvi mensual: ~$180-270** 💸

---

## 🔧 Technical Details

### API Routes:
- `POST /api/bot-test` - Enviar missatge
- `GET /api/bot-test?conversationId=xxx` - History
- `GET /api/bot-test/templates` - Llista templates
- `POST /api/bot-test/evaluations` - Guardar eval
- `GET /api/bot-test/evaluations` - Llista evals

### Flow Intern:
```typescript
User escriu missatge
  ↓
POST /api/bot-test
  ↓
Simula Twilio message format
  ↓
Crida handleIncomingMessage() [MATEIX que Twilio!]
  ↓
Bot processa (conversationalAiService, etc.)
  ↓
Guarda a BD (Conversation table)
  ↓
Retorna response + debug info
  ↓
UI mostra missatges
```

### Storage:
- **Conversations**: Prisma DB (igual que prod)
- **Evaluations**: In-memory (últimes 100)
  - En futur: podries guardar a BD si vols

---

## 🐛 Troubleshooting

### "Test studio (Minca) not found"
- Verifica que el studio amb ID `da9473b1-2230-4623-a5ca-00d2dc9eeb51` existeix
- O canvia `TEST_STUDIO_ID` a route.ts

### El bot no respon
- Verifica que bot-engine està running
- Check console logs del bot-engine
- Verifica DB connection

### Avaluacions desapareixen
- Són in-memory (últimes 100)
- Si vols persist, afegir a BD

### Templates no carreguen
- Check console del browser
- Verifica que /api/bot-test/templates retorna data

---

## 🚀 Próxims Steps (Opcional)

1. **UI per crear templates custom**
2. **Guardar evaluations a BD**
3. **Més mètriques** (tokens usats, cost estimat, etc.)
4. **Export evaluations** (CSV, JSON)
5. **Grafics de comparació**
6. **Selector de config** (Pep vs Current al chat)
7. **Slow-motion mode** per templates (més delay)
8. **Breakpoints** (pausar template en cert punt)

---

## 📞 Feedback

Si trobes bugs o vols features noves, fes un issue o parla amb l'equip! 🎉

