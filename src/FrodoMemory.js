// FrodoMemory.js - Frodo'nun hafızası

import AsyncStorage from '@react-native-async-storage/async-storage';

export class FrodoMemory {
  constructor() {
    this.data = {
      interactions: [],
      userFacts: {},
      dailyTips: [],
      lastGreetDate: null,
      totalChats: 0,
    };
  }

  async load() {
    try {
      const saved = await AsyncStorage.getItem('frodo_memory');
      if (saved) {
        this.data = { ...this.data, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }

  async save() {
    try {
      await AsyncStorage.setItem('frodo_memory', JSON.stringify(this.data));
    } catch (e) {}
  }

  async addInteraction(text) {
    this.data.interactions.push({
      text: text.substring(0, 100),
      time: new Date().toISOString(),
    });
    // Keep only last 50
    if (this.data.interactions.length > 50) {
      this.data.interactions = this.data.interactions.slice(-50);
    }
    this.data.totalChats = (this.data.totalChats || 0) + 1;

    // Extract user facts from text
    this.extractFacts(text);
    await this.save();
  }

  extractFacts(text) {
    const lower = text.toLowerCase();
    // Simple fact extraction
    if (lower.includes('seviyorum') || lower.includes('severim')) {
      this.data.userFacts.likes = this.data.userFacts.likes || [];
      this.data.userFacts.likes.push(text.substring(0, 50));
    }
    if (lower.includes('forex') || lower.includes('döviz')) {
      this.data.userFacts.interestedInForex = true;
    }
    if (lower.includes('müzik') || lower.includes('şarkı')) {
      this.data.userFacts.likesMusic = true;
    }
  }

  getContext() {
    const facts = [];
    if (this.data.totalChats > 0) {
      facts.push(`Toplam ${this.data.totalChats} konuşma yapıldı`);
    }
    if (this.data.userFacts.interestedInForex) {
      facts.push('Kullanıcı forex ile ilgileniyor');
    }
    if (this.data.userFacts.likesMusic) {
      facts.push('Kullanıcı müziği seviyor');
    }
    if (this.data.interactions.length > 0) {
      const recent = this.data.interactions.slice(-3).map(i => i.text).join(', ');
      facts.push(`Son konuşmalar: ${recent}`);
    }
    return facts.join('. ') || 'Yeni tanışıyoruz';
  }

  async getDailyTip() {
    const today = new Date().toDateString();
    if (this.data.lastGreetDate === today) return null;
    this.data.lastGreetDate = today;
    await this.save();

    const tips = [
      'Günaydın! ☀️ Bugün su içmeyi unutma, beyin %75 sudan oluşur!',
      'Hey! Bugün bir yabancıya gülümse, kim bilir ne kadar etki eder 😊',
      'Forex: Sabahları piyasa açılışında volatilite yüksek, dikkatli ol 📈',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  async clearMemory() {
    this.data = {
      interactions: [],
      userFacts: {},
      dailyTips: [],
      lastGreetDate: null,
      totalChats: 0,
    };
    await this.save();
  }
}
