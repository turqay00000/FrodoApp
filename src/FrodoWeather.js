// FrodoWeather.js - Hava durumu servisi

export async function getWeather(lat, lon) {
  try {
    // Open-Meteo - tamamen ücretsiz, API key gerektirmez!
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,precipitation&timezone=auto`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    const current = data.current;
    const temp = Math.round(current.temperature_2m);
    const wind = Math.round(current.windspeed_10m);
    const rain = current.precipitation;
    const code = current.weathercode;
    
    const desc = getWeatherDesc(code);
    const emoji = getWeatherEmoji(code);
    
    let msg = `Şu an ${temp}°C, ${desc} ${emoji}`;
    
    if (rain > 0) {
      msg += ` ☔ Yağmur var (${rain}mm), şemsiyeni al!`;
    } else if (wind > 30) {
      msg += ` 💨 Rüzgarlı (${wind} km/s), dikkat et!`;
    }
    
    return msg;
  } catch (e) {
    return 'Hava durumu alınamadı, konum izni kontrol et.';
  }
}

function getWeatherDesc(code) {
  const codes = {
    0: 'Açık',
    1: 'Az bulutlu', 2: 'Parçalı bulutlu', 3: 'Bulutlu',
    45: 'Sisli', 48: 'Dondurucu sis',
    51: 'Hafif çisenti', 53: 'Orta çisenti', 55: 'Yoğun çisenti',
    61: 'Hafif yağmur', 63: 'Orta yağmur', 65: 'Şiddetli yağmur',
    71: 'Hafif kar', 73: 'Orta kar', 75: 'Yoğun kar',
    80: 'Sağanak', 81: 'Orta sağanak', 82: 'Şiddetli sağanak',
    95: 'Gök gürültülü', 96: 'Dolu',
  };
  return codes[code] || 'Değişken';
}

function getWeatherEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}
