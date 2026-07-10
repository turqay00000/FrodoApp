import { Linking } from 'react-native';

export async function handleCommand(text, apiKey) {
  const lower = text.toLowerCase();

  // ── YouTube ──
  if (lower.includes('youtube') || lower.includes('youtubede') || lower.includes('yutubda') ||
      lower.includes('yutubde') || lower.includes('yutubu') ||
      (lower.includes('musiqi') && (lower.includes('aç') || lower.includes('tap'))) ||
      (lower.includes('müzik') && lower.includes('aç'))) {
    const query = extractQuery(text, ['youtube','youtubede','yutubda','yutubde','yutubu',
      'müzik','musiqi','aç','çal','tap','axtar','de','bul','gəl']);
    if (query && query.length > 1) {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      return {
        handled: true,
        response: `YouTube-da "${query}" axtarıram! 🎵`,
        action: 'YouTube',
        execute: () => Linking.openURL(url),
      };
    }
    return {
      handled: true,
      response: 'YouTube açılıyor! 🎵',
      action: 'YouTube Aç',
      execute: () => Linking.openURL('https://www.youtube.com'),
    };
  }

  // ── Spotify ──
  if (lower.includes('spotify')) {
    const query = extractQuery(text, ['spotify','aç','çal','tap','axtar']);
    const url = query && query.length > 1
      ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
      : 'https://open.spotify.com';
    return {
      handled: true,
      response: query ? `Spotify-da "${query}" axtarıram! 🎧` : 'Spotify açılıyor! 🎧',
      action: 'Spotify',
      execute: () => Linking.openURL(url).catch(() => Linking.openURL('https://open.spotify.com')),
    };
  }

  // ── TikTok ──
  if (lower.includes('tiktok') || lower.includes('tik tok')) {
    const query = extractQuery(text, ['tiktok','tik tok','aç','tap','axtar']);
    const url = query && query.length > 1
      ? `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`
      : 'https://www.tiktok.com';
    return {
      handled: true,
      response: 'TikTok açılıyor! 🎬',
      action: 'TikTok',
      execute: () => Linking.openURL(url),
    };
  }

  // ── Google Arama ──
  if (lower.includes('google') || lower.includes('axtar') || lower.includes('ara')) {
    const query = extractQuery(text, ['google','googleda','googlede','axtar','ara','tap']);
    const url = `https://www.google.com/search?q=${encodeURIComponent(query || text)}`;
    return {
      handled: true,
      response: `Google-da axtarıram: "${query}" 🔍`,
      action: 'Google',
      execute: () => Linking.openURL(url),
    };
  }

  // ── Instagram ──
  if (lower.includes('instagram') || lower.includes('insta')) {
    return {
      handled: true,
      response: 'Instagram açılıyor! 📸',
      action: 'Instagram',
      execute: () => Linking.openURL('https://www.instagram.com'),
    };
  }

  // ── WhatsApp ──
  if (lower.includes('whatsapp') || lower.includes('vatsap')) {
    return {
      handled: true,
      response: 'WhatsApp açılıyor! 💬',
      action: 'WhatsApp',
      execute: () => Linking.openURL('whatsapp://').catch(() => Linking.openURL('https://web.whatsapp.com')),
    };
  }

  // ── Harita ──
  if (lower.includes('xəritə') || lower.includes('harita') || lower.includes('yol') ||
      lower.includes('hara') || lower.includes('nerede') || lower.includes('naviqasiya')) {
    const place = extractQuery(text, ['xəritə','harita','yol','hara','nerede','naviqasiya','get','göstər','tap']);
    const url = place && place.length > 1
      ? `https://maps.google.com/?q=${encodeURIComponent(place)}`
      : 'https://maps.google.com';
    return {
      handled: true,
      response: place ? `${place} üçün xəritə açılır! 🗺️` : 'Xəritə açılır! 🗺️',
      action: 'Harita',
      execute: () => Linking.openURL(url),
    };
  }

  // ── Gmail ──
  if (lower.includes('gmail') || lower.includes('mail') || lower.includes('poçt')) {
    return {
      handled: true,
      response: 'Gmail açılıyor! 📧',
      action: 'Gmail',
      execute: () => Linking.openURL('https://mail.google.com'),
    };
  }

  // ── Google Drive ──
  if (lower.includes('drive') || lower.includes('fayl') || lower.includes('dosya')) {
    return {
      handled: true,
      response: 'Google Drive açılıyor! 📂',
      action: 'Drive',
      execute: () => Linking.openURL('https://drive.google.com'),
    };
  }

  // ── Slides / Slayt ──
  if (lower.includes('slayd') || lower.includes('slayt') || lower.includes('sunum') || lower.includes('slides')) {
    return {
      handled: true,
      response: 'Google Slides açılıyor! 📊',
      action: 'Slides',
      execute: () => Linking.openURL('https://docs.google.com/presentation/create'),
    };
  }

  // ── Telefon / Zəng ──
  if (lower.includes('zəng') || lower.includes('ara ') || lower.includes('telefon et')) {
    const num = text.match(/[\d\s\-\+]+/)?.[0]?.replace(/\s/g, '');
    if (num && num.length > 4) {
      return {
        handled: true,
        response: `${num} nömrəsinə zəng edilir! 📞`,
        action: 'Telefon',
        execute: () => Linking.openURL(`tel:${num}`),
      };
    }
  }

  // ── Hesab makinesi ──
  if (lower.includes('hesabla') || lower.includes('nə qədər') || lower.includes('kaç eder')) {
    const mathResult = solveMath(text);
    if (mathResult) {
      return { handled: true, response: mathResult, action: 'Hesaplama' };
    }
  }

  // ── Haber ──
  if (lower.includes('xəbər') || lower.includes('haber') || lower.includes('gündem')) {
    return {
      handled: true,
      response: 'Xəbərlər açılıyor! 📰',
      action: 'Haberler',
      execute: () => Linking.openURL('https://news.google.com'),
    };
  }

  return { handled: false };
}

function extractQuery(text, removeWords) {
  let query = text.toLowerCase();
  removeWords.forEach(w => {
    query = query.replace(new RegExp(w, 'gi'), '');
  });
  // Gereksiz kelimeleri temizle
  ['mənə', 'bana', 'için', 'üçün', 'bir', 'the', 'lütfen', 'zəhmət olmasa',
   'olsun', 'açılsın', 'de', 'da', 'mı', 'mi', 'var', 'yox'].forEach(w => {
    query = query.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
  });
  return query.replace(/['"]/g, '').trim();
}

function solveMath(text) {
  const match = text.match(/[\d\s\+\-\*\/\.\(\)]+/);
  if (match) {
    try {
      const expr = match[0].trim();
      if (expr.length > 1) {
        const result = Function(`"use strict"; return (${expr})`)();
        return `${expr} = ${result} 🧮`;
      }
    } catch (e) {}
  }
  return null;
}