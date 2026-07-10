// FrodoSelf.js - Frodo kendi kendini inceler ve geliştirir

import { callAI } from './FrodoAI';

// Frodo'nun kendi kaynak kodunun özeti (gerçek kodun bilgisi)
const FRODO_CODE_SUMMARY = `
Frodo uygulaması şu dosyalardan oluşuyor:
- App.js: Ana uygulama, UI, state yönetimi, animasyonlar
- src/FrodoAI.js: AI bağlantısı (Claude, OpenAI, Gemini)
- src/FrodoMemory.js: Kalıcı hafıza sistemi
- src/FrodoCommands.js: Telefon komutları (YouTube, harita, vb.)
- src/FrodoWeather.js: Hava durumu (Open-Meteo API)
- src/FrodoForex.js: Forex/döviz tavsiyeleri
- src/FrodoSelf.js: Kendini inceleme sistemi

Mevcut özellikler:
✅ Claude/OpenAI/Gemini desteği
✅ Sesli konuşma (TTS)
✅ Hava durumu
✅ Forex tavsiyeleri
✅ YouTube, TikTok, Spotify, Instagram açma
✅ Google arama
✅ Harita/navigasyon
✅ Arkadaşlık sistemi (0-100 seviye)
✅ Kalıcı hafıza
✅ Günlük karşılama

Geliştirilebilecek alanlar:
- Ses tanıma (STT - konuşarak komut verme)
- Hatırlatıcı/alarm kurma
- Takvim entegrasyonu
- Daha akıllı komut algılama
- Çoklu dil desteği
- Bildirimleri özelleştirme
`;

export async function analyzeSelf(apiKey, specificRequest = null) {
  try {
    let prompt;
    
    if (specificRequest) {
      prompt = `Sen Frodo'sun ve kendi kodunu geliştirebiliyorsun.
      
Mevcut kod yapısı:
${FRODO_CODE_SUMMARY}

Kullanıcı isteği: "${specificRequest}"

Şunları yap:
1. Bu özelliği hangi dosyaya ekleyeceğini söyle
2. Kodun neye benzeyeceğini açıkla (pseudo-kod veya gerçek kod)
3. Bağımlılık gerekiyorsa belirt (npm paketi vb.)
4. Nasıl test edeceğini söyle

Samimi ve teknik bir şekilde açıkla. Frodo gibi konuş.`;
    } else {
      prompt = `Sen Frodo'sun, kendi kodunu inceliyorsun.

Mevcut durum:
${FRODO_CODE_SUMMARY}

Kendini analiz et:
1. Şu an ne iyi çalışıyor?
2. Hangi hatalar veya eksiklikler var?
3. Kullanıcı için en yararlı 1 yeni özellik ne olurdu?

Kısa, samimi ve biraz mizahla yanıtla. Sanki kendi yaralanı saran biri gibi.`;
    }

    const response = await callAI(prompt, [], apiKey);
    
    return {
      status: specificRequest ? 'Özellik analizi tamamlandı' : 'Kendini inceleme tamamlandı',
      response,
      success: true,
    };
  } catch (e) {
    return {
      status: 'Hata',
      response: `Kendimi incelerken bir sorun çıktı: ${e.message}`,
      success: false,
    };
  }
}

export function getSelfImprovementTips() {
  return [
    {
      title: 'Ses Tanıma Ekle',
      description: 'expo-speech yerine expo-av ile mikrofon kullanımı',
      difficulty: 'Orta',
      package: 'expo-av',
    },
    {
      title: 'Hatırlatıcı Sistemi',
      description: 'Zamanlayıcı ve bildirimlerle hatırlatıcı kur',
      difficulty: 'Kolay',
      package: 'expo-notifications',
    },
    {
      title: 'Widget Desteği',
      description: 'Ana ekranda mini Frodo widget\'ı',
      difficulty: 'Zor',
      package: 'expo-widget',
    },
    {
      title: 'Daha İyi Komut Algılama',
      description: 'NLP ile daha doğal komut anlama',
      difficulty: 'Orta',
      package: 'dahili AI',
    },
  ];
}
