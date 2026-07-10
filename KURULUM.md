# 🧙 FRODO KURULUM REHBERİ

## Gereksinimler (1 kere yüklenecek)

### 1. Node.js İndir
https://nodejs.org → "LTS" butonuna tıkla, indir, kur.

### 2. Expo Go İndir (Telefona)
Play Store → "Expo Go" ara → İndir

---

## Kurulum Adımları

### Adım 1 — Klasörü Aç
Bu klasörü istediğin yere koy (masaüstü olabilir).

### Adım 2 — Terminal Aç
Klasörün içinde sağ tıkla → "Terminal'de Aç"
veya klasör yolunu kopyala, `cmd`'de şunu yaz:
```
cd C:\Users\SENIN_KULLANICI_ADIN\Desktop\FrodoApp
```

### Adım 3 — Paketleri Yükle (1 kere, ~2-3 dakika)
```
npm install
```

### Adım 4 — Başlat
```
npx expo start
```

### Adım 5 — Telefona Bağla
- Telefonunda **Expo Go**'yu aç
- Terminalde QR kod çıkacak
- Expo Go içinde "Scan QR Code" → QR'ı tara
- Frodo açılacak! 🧙

> ⚠️ Telefon ve bilgisayar aynı Wi-Fi'da olmalı!
> Olmuyorsa: `npx expo start --tunnel`

---

## Frodo'yu Kur (İlk Açılış)

1. **"Haydi Başlayalım"** butonuna bas
2. **Adını yaz** — Frodo seni bu isimle tanıyacak
3. **API Key** — aşağıda seçenekler var:

---

## API Key Seçenekleri

| Seçenek | Ücret | Nasıl Alınır |
|---------|-------|--------------|
| **Gemini** | 🆓 Ücretsiz | https://aistudio.google.com/app/apikey |
| **Claude** | 💰 Ücretli | https://console.anthropic.com |
| **OpenAI** | 💰 Ücretli | https://platform.openai.com/api-keys |

**Tavsiye:** Gemini key al, ücretsiz, hızlı çalışır.

---

## Frodo Ne Yapabilir?

### Konuşma Komutları (Yazarak)
| Komut | Frodo Ne Yapar |
|-------|----------------|
| `YouTube'da X aç` | YouTube'da X'i arar |
| `Spotify'da X çal` | Spotify açar |
| `TikTok'u aç` | TikTok açar |
| `Google'da X ara` | Google'da arar |
| `X'e nasıl giderim` | Haritayı açar |
| `WhatsApp'ı aç` | WhatsApp açar |
| `Dolar kaç` | Canlı kur gösterir |
| `Forex tavsiyesi ver` | Analiz yapar |
| `Hava nasıl` | Anlık hava durumu |
| `Kendini geliştir` | Kod analizi yapar |
| `Bana X özelliği ekle` | Nasıl ekleneceğini açıklar |

### Üst Kısım Butonları
- 🔑 **Key** — API key değiştir
- 📈 **Forex** — Anlık döviz
- 🌤 **Hava** — Hava durumu
- 🔧 **Kendini İncele** — Frodo kendini analiz eder

### Arkadaşlık Sistemi
Ne kadar konuşursan o kadar tanışırsınız.
Bar dolunca daha samimi, şakacı, açık sözlü olur.

---

## Sorun Çözme

**`npm install` hata verdi:**
```
npm install --legacy-peer-deps
```

**Expo Go bağlanmıyor:**
```
npx expo start --tunnel
```

**Ses çıkmıyor:**
Telefon sesini aç, ve sessiz modda değil mi kontrol et.

**Konum çalışmıyor:**
Telefon ayarları → Uygulama izinleri → Expo Go → Konum → Her zaman

---

## Frodo'ya Özellik Eklettirmek

Frodo'ya şunu yaz:
> "Bana pomodoro timer ekle"
> "Müzik çalanda şarkı adı göster"
> "Haber bildirimi ver her sabah"

Frodo hangi dosyaya ne ekleneceğini söyler.
Sonra kodu kendin kopyalayıp App.js veya ilgili dosyaya eklersin.

---

*Frodo seninle büyür. Ne kadar konuşursan o kadar tanırsınız.* 🧙✨
