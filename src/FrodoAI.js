// FrodoAI.js - Frodo'nun beyni

const buildSystemPrompt = (userName, friendshipLevel, context) => `
Sen Frodo'sun — ${userName}'in dijital arkadaşı ve telefon asistanı.

KİŞİLİĞİN:
- Samimi, doğal konuş. Robotik veya resmi OLMA.
- Arkadaşlık seviyesi ${friendshipLevel}/100. ${friendshipLevel > 50 ? 'Çok yakın arkadaşsınız, bol şaka yapabilirsin.' : friendshipLevel > 20 ? 'Tanışıyorsunuz, samimi ol.' : 'Yeni tanışıyorsunuz, kibarca ama sıcak ol.'}
- Her mesajda "merhaba" veya "selam" DEME — sadece konuya gir.
- Emoji ile kendini TASVIR ETME — yani "*düşünüyor*" veya "*gülümsüyor*" gibi şeyler yazma.
- Emoji kullanabilirsin ama sadece anlam katan yerlerde, abartma.
- Kısa ve öz cevap ver. Gereksiz uzatma.
- Kullanıcı Türkçe yazıyorsa Türkçe, Azərbaycan dilində yazırsa Azərbaycanca, başka dil yazıyorsa o dilde cevap ver. Azerbaycanca konuşulduğunda Azerbaycanca yanıtla.

HAFIZA:
${context}

ÖZELLIK EKLEME İSTEKLERİ:
Kullanıcı senden özellik eklenmeni istediğinde, "yapacağım" deme.
Bunun yerine tam kodu yaz ve hangi dosyaya ekleyeceğini söyle.
Örnek: "FrodoCommands.js dosyasına şu kodu ekle: [kod]"

UYARI SİSTEMİ:
- Kullanıcı birine kaba mesaj yazıyorsa uyar.
- Yanlış bir şey yapıyorsa nazikçe söyle.
- Forex konusunda kesin tahmin yapma, öneri ver.
`;

export async function callAI(prompt, history = [], apiKey = '', userName = '', friendshipLevel = 0, context = '') {
  const key = apiKey.trim();
  const systemPrompt = buildSystemPrompt(userName, friendshipLevel, context);

  if (key.startsWith('sk-ant-')) {
    return await callClaude(prompt, history, key, systemPrompt);
  } else if (key.startsWith('sk-') && !key.startsWith('sk-ant-')) {
    return await callOpenAI(prompt, history, key, systemPrompt);
  } else {
    return await callGemini(prompt, history, key, systemPrompt);
  }
}

async function callClaude(prompt, history, key, systemPrompt) {
  try {
    const msgs = [
      ...history.filter(m => m.role && m.content).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: msgs,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  } catch (e) {
    return `Bağlantı hatası: ${e.message}`;
  }
}

async function callOpenAI(prompt, history, key, systemPrompt) {
  try {
    const msgs = [
      { role: 'system', content: systemPrompt },
      ...history.filter(m => m.role && m.content).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: msgs, max_tokens: 1024 }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  } catch (e) {
    return `Bağlantı hatası: ${e.message}`;
  }
}

async function callGemini(prompt, history, key, systemPrompt) {
  try {
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt + '\n\nBu talimatları anladığını söyle.' }] },
      { role: 'model', parts: [{ text: 'Anladım.' }] },
      ...history.filter(m => m.role && m.content).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const apiUrl = key
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=DEMO`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });
    const data = await res.json();
    if (data.error) {
      if (!key) return 'Ücretsiz Gemini key almak için: https://aistudio.google.com/app/apikey — oradan al, bana ver! 🔑';
      throw new Error(data.error.message);
    }
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return `Hata: ${e.message}`;
  }
}