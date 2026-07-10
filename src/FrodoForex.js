// FrodoForex.js - Forex tavsiyeleri ve döviz bilgisi

import { callAI } from './FrodoAI';

export async function getForexTip(question, apiKey) {
  try {
    // Get live exchange rates - frankfurter.app ücretsiz
    const rates = await getLiveRates();
    
    const prompt = `Sen bir forex uzmanısın ve aynı zamanda Frodo adında samimi bir arkadaşsın.
Güncel döviz kurları: ${rates}
Kullanıcı sorusu: "${question}"

Şunları yap:
1. Güncel kurları belirt
2. Kısa bir teknik/temel analiz ver
3. Risk uyarısı ekle (ama abartma)
4. Samimi bir dille konuş, "kesin al/sat" deme, öneri ver
5. Maksimum 4 cümle`;

    return await callAI(prompt, [], apiKey);
  } catch (e) {
    return 'Forex verisi alınamadı. İnternet bağlantını kontrol et.';
  }
}

async function getLiveRates() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY,EUR,GBP,JPY');
    const data = await res.json();
    const r = data.rates;
    return `1 USD = ${r.TRY?.toFixed(2)} TRY | 1 USD = ${r.EUR?.toFixed(4)} EUR | 1 USD = ${r.GBP?.toFixed(4)} GBP`;
  } catch (e) {
    // Fallback
    try {
      const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await res2.json();
      const r = data.rates;
      return `1 USD = ${r.TRY?.toFixed(2)} TRY | 1 EUR = ${(r.TRY / r.EUR)?.toFixed(2)} TRY`;
    } catch {
      return 'Güncel kur alınamadı';
    }
  }
}

export async function getQuickRates() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY,EUR');
    const data = await res.json();
    return {
      usdtry: data.rates.TRY?.toFixed(2),
      eurtry: (data.rates.TRY / data.rates.EUR)?.toFixed(2),
    };
  } catch {
    return null;
  }
}
