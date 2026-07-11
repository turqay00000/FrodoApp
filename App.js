import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Animated, KeyboardAvoidingView,
  Platform, StatusBar, ActivityIndicator, Linking, AppState
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { callAI } from './src/FrodoAI';
import { FrodoMemory } from './src/FrodoMemory';
import { getWeather } from './src/FrodoWeather';
import { getForexTip } from './src/FrodoForex';
import { handleCommand } from './src/FrodoCommands';
import { analyzeSelf } from './src/FrodoSelf';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [setupStep, setSetupStep] = useState('loading');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wakeMode, setWakeMode] = useState(false);
  const [frodoMood, setFrodoMood] = useState('neutral');
  const [friendshipLevel, setFriendshipLevel] = useState(0);
  const [selfCheckStatus, setSelfCheckStatus] = useState('');

  const scrollRef = useRef();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const micAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);
  const memory = useRef(new FrodoMemory());
  const wakeModeRef = useRef(false);

  // ── SES TANIMA ──
  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results?.[0]?.transcript || '';
    if (!text.trim()) return;
    const lower = text.toLowerCase();

    if (wakeModeRef.current) {
      if (lower.includes('frodo') || lower.includes('fredo') || lower.includes('froda') || lower.includes('фродо')) {
        wakeModeRef.current = false;
        setWakeMode(false);
        ExpoSpeechRecognitionModule.stop();
        speak('Evet?');
        setTimeout(() => startListening(), 1000);
      }
    } else {
      stopListening();
      sendMessage(text);
    }
  });

  useSpeechRecognitionEvent('error', () => {
    if (wakeModeRef.current) {
      setTimeout(() => {
        ExpoSpeechRecognitionModule.start({ lang: 'az-AZ', interimResults: true, continuous: true, androidNoBluetooth: true });
      }, 1000);
    } else {
      stopListening();
    }
  });

  useEffect(() => {
    initApp();
    startFloatAnimation();
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (isActive) { startPulse(); startGlow(); }
    else { pulseAnim.setValue(1); glowAnim.setValue(0); }
  }, [isActive]);

  const startFloatAnimation = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 2200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ])).start();
  };

  const startPulse = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 1600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
    ])).start();
  };

  const startGlow = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
    ])).start();
  };

  const startMicPulse = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(micAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
      Animated.timing(micAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  };

  const handleAppStateChange = async (nextState) => {
    if (appState.current.match(/inactive|background/) && nextState === 'active') {
      checkMorningGreeting();
    }
    appState.current = nextState;
  };

  const checkMorningGreeting = async () => {
    const today = new Date().toDateString();
    const lastMorning = await AsyncStorage.getItem('frodo_morning_date');
    const hour = new Date().getHours();
    if (lastMorning !== today && hour >= 6 && hour <= 11 && isActive) {
      await AsyncStorage.setItem('frodo_morning_date', today);
      doMorningGreeting();
    }
  };

  const doMorningGreeting = async () => {
    let weatherInfo = '';
    try {
      const loc = await Location.getCurrentPositionAsync({});
      weatherInfo = await getWeather(loc.coords.latitude, loc.coords.longitude);
    } catch (e) { }
    const savedName = await AsyncStorage.getItem('frodo_user_name');
    const savedKey = await AsyncStorage.getItem('frodo_api_key');
    const savedLevel = parseInt(await AsyncStorage.getItem('frodo_friendship') || '0');
    const greeting = await callAI(
      `Sabah karşılaması yap. ${weatherInfo ? 'Hava: ' + weatherInfo : ''} Kısa, enerjik ol.`,
      [], savedKey || '', savedName || 'arkadaşım', savedLevel, ''
    );
    addMessage('assistant', greeting);
    speak(greeting);
  };

  const initApp = async () => {
    await memory.current.load();
    const savedKey = await AsyncStorage.getItem('frodo_api_key');
    const savedName = await AsyncStorage.getItem('frodo_user_name');
    const savedLevel = await AsyncStorage.getItem('frodo_friendship');
    const savedActive = await AsyncStorage.getItem('frodo_active');
    if (savedKey) setApiKey(savedKey);
    if (savedLevel) setFriendshipLevel(parseInt(savedLevel) || 0);
    if (savedName) {
      setUserName(savedName);
      setSetupStep('ready');
      if (savedActive === 'true') {
        setIsActive(true);
        setTimeout(() => bootSequence(savedName, savedKey || '', parseInt(savedLevel) || 0), 500);
      }
    } else {
      setSetupStep('intro');
    }
    await requestPermissions();

  };

  const requestPermissions = async () => {
    await Notifications.requestPermissionsAsync();
    await Location.requestForegroundPermissionsAsync();
    await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  };

  const bootSequence = async (name, key, level) => {
    setIsLoading(true);
    setSelfCheckStatus('Kendimi kontrol ediyorum...');
    await analyzeSelf(key);
    setSelfCheckStatus('');
    let weatherInfo = '';
    try {
      const loc = await Location.getCurrentPositionAsync({});
      weatherInfo = await getWeather(loc.coords.latitude, loc.coords.longitude);
    } catch (e) { }
    const today = new Date().toDateString();
    const lastMorning = await AsyncStorage.getItem('frodo_morning_date');
    const hour = new Date().getHours();
    const isMorning = hour >= 6 && hour <= 11;
    let greetPrompt;
    if (lastMorning !== today && isMorning) {
      await AsyncStorage.setItem('frodo_morning_date', today);
      greetPrompt = `Sabah karşılaması yap. ${weatherInfo ? 'Hava: ' + weatherInfo : ''} Kısa tut.`;
    } else if (level === 0) {
      greetPrompt = `${name} ile ilk tanışma. Kendini Frodo olarak tanıt, kısa ve samimi ol.`;
    } else {
      greetPrompt = `${name} uygulamayı açtı. Kısa merhaba de. ${weatherInfo ? 'Hava: ' + weatherInfo : ''}`;
    }
    const context = memory.current.getContext();
    const greeting = await callAI(greetPrompt, [], key, name, level, context);
    setIsLoading(false);
    addMessage('assistant', greeting);
    speak(greeting);
    await increaseFriendship(2);
  };

  // ── MİKROFON ──
  const startListening = async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        addMessage('assistant', 'Mikrofon izni gerekiyor!');
        return;
      }
      setIsListening(true);
      setFrodoMood('listening');
      startMicPulse();
      ExpoSpeechRecognitionModule.start({ lang: 'tr-TR', interimResults: false, continuous: false });
    } catch (e) {
      setIsListening(false);
      setFrodoMood('neutral');
      micAnim.stopAnimation();
      addMessage('assistant', 'Mikrofon başlatılamadı.');
    }
  };

  const stopListening = () => {
    micAnim.stopAnimation();
    micAnim.setValue(1);
    setIsListening(false);
    setFrodoMood('neutral');
    try { ExpoSpeechRecognitionModule.stop(); } catch (e) { }
  };

  const toggleWakeMode = async () => {
    if (wakeMode) {
      wakeModeRef.current = false;
      setWakeMode(false);
      try { ExpoSpeechRecognitionModule.stop(); } catch (e) { }
      addMessage('assistant', 'Dinlemeyi durdurdum.');
    } else {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) { addMessage('assistant', 'Mikrofon izni gerekiyor!'); return; }
      wakeModeRef.current = true;
      setWakeMode(true);
      ExpoSpeechRecognitionModule.start({ lang: 'az-AZ', interimResults: true, continuous: true, androidNoBluetooth: true });
      addMessage('assistant', 'Hazırım! "Hey Frodo" de, seni duyacağım 👂');
      speak('Hazırım.');
    }
  };

  const speak = (text) => {
    Speech.stop();
    setIsSpeaking(true);
    setFrodoMood('speaking');
    const cleanText = text.replace(/[*_~`]/g, '').replace(/https?:\/\/\S+/g, 'link');
    Speech.speak(cleanText, {
      language: detectLanguage(cleanText),
      pitch: 1.0,
      rate: 0.92,
      onDone: () => { setIsSpeaking(false); setFrodoMood('neutral'); },
      onStopped: () => { setIsSpeaking(false); setFrodoMood('neutral'); },
      onError: () => { setIsSpeaking(false); setFrodoMood('neutral'); },
    });
  };

  const detectLanguage = (text) => {
    if (/[əöüğşçıƏÖÜĞŞÇI]/.test(text)) return 'az-AZ';
    if (/[çğışöüÇĞİŞÖÜ]/.test(text)) return 'tr-TR';
    return 'en-US';
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
    setFrodoMood('neutral');
  };

  const addMessage = (role, content, extra = {}) => {
    setMessages(prev => [...prev, { role, content, time: new Date(), ...extra }]);
  };

  const increaseFriendship = async (amount) => {
    setFriendshipLevel(prev => {
      const next = Math.min(100, prev + amount);
      AsyncStorage.setItem('frodo_friendship', String(next));
      return next;
    });
  };

  const sendMessage = async (textOverride) => {
    const text = (textOverride || inputText).trim();
    if (!text || isLoading) return;
    setInputText('');
    addMessage('user', text);
    setFrodoMood('thinking');
    setIsLoading(true);
    await memory.current.addInteraction(text);
    const commandResult = await handleCommand(text, apiKey);
    if (commandResult.handled) {
      setIsLoading(false);
      setFrodoMood('neutral');
      addMessage('assistant', commandResult.response, { action: commandResult.action });
      speak(commandResult.response);
      if (commandResult.execute) commandResult.execute();
      await increaseFriendship(1);
      return;
    }
    if (text.includes('kendini geliştir') || text.includes('hata düzelt') ||
      (text.includes('ekle') && text.includes('özellik'))) {
      const result = await analyzeSelf(apiKey, text);
      setIsLoading(false);
      setFrodoMood('neutral');
      addMessage('assistant', result.response);
      speak(result.response);
      await increaseFriendship(3);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }
    if (['forex', 'döviz', 'dolar', 'euro', 'parite'].some(w => text.toLowerCase().includes(w))) {
      const tip = await getForexTip(text, apiKey);
      setIsLoading(false);
      setFrodoMood('neutral');
      addMessage('assistant', tip);
      speak(tip);
      await increaseFriendship(1);
      return;
    }
    const context = memory.current.getContext();
    const reply = await callAI(text, messages.slice(-8), apiKey, userName, friendshipLevel, context);
    setIsLoading(false);
    setFrodoMood('neutral');
    addMessage('assistant', reply);
    speak(reply);
    await increaseFriendship(1);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const toggleActive = async (val) => {
    setIsActive(val);
    await AsyncStorage.setItem('frodo_active', val ? 'true' : 'false');
    if (val) {
      bootSequence(userName, apiKey, friendshipLevel);
    } else {
      Speech.stop();
      setMessages([]);
    }
  };

  const getFriendshipLabel = () => {
    if (friendshipLevel < 10) return 'Yeni tanışıyoruz';
    if (friendshipLevel < 30) return 'Tanıdık';
    if (friendshipLevel < 60) return 'Arkadaş';
    if (friendshipLevel < 85) return 'Yakın arkadaş';
    return 'En iyi arkadaş 🔥';
  };

  const getMoodEmoji = () => {
    switch (frodoMood) {
      case 'speaking': return '🗣️';
      case 'thinking': return '💭';
      case 'listening': return '👂';
      default: return '🧙';
    }
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(99,179,237,0.05)', 'rgba(99,179,237,0.35)'],
  });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (setupStep === 'loading') {
    return (
      <View style={s.center}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <ActivityIndicator size="large" color="#63B3ED" />
        <Text style={s.loadText}>Frodo uyanıyor...</Text>
      </View>
    );
  }

  if (setupStep === 'intro') {
    return (
      <LinearGradient colors={['#020617', '#0F172A', '#020617']} style={s.setupScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center' }}>
          <View style={s.bigOrb}>
            <Text style={s.bigOrbEmoji}>🧙</Text>
            <View style={s.ring1} /><View style={s.ring2} />
          </View>
          <Text style={s.titleText}>Frodo</Text>
          <Text style={s.subtitleText}>Dijital Arkadaşın</Text>
          <Text style={s.descText}>
            Sadece asistan değil — arkadaş.{'\n'}
            Seninle büyüyecek, öğrenecek,{'\n'}
            şakalaşacak. Telefon artık bir insan.
          </Text>
          <TouchableOpacity style={s.bigBtn} onPress={() => setSetupStep('name')}>
            <Text style={s.bigBtnText}>Başlayalım ✨</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  if (setupStep === 'name') {
    return (
      <LinearGradient colors={['#020617', '#0F172A', '#020617']} style={s.setupScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <Text style={s.setupQ}>Adın ne?</Text>
        <Text style={s.setupHint}>Frodo seni nasıl çağırsın?</Text>
        <TextInput style={s.setupInput} placeholder="Adını yaz..."
          placeholderTextColor="#334155" value={userName}
          onChangeText={setUserName} autoFocus />
        <TouchableOpacity style={[s.bigBtn, !userName.trim() && { opacity: 0.3 }]}
          disabled={!userName.trim()} onPress={() => setSetupStep('key')}>
          <Text style={s.bigBtnText}>Devam →</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (setupStep === 'key') {
    return (
      <LinearGradient colors={['#020617', '#0F172A', '#020617']} style={s.setupScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <Text style={s.setupQ}>API Key</Text>
        <Text style={s.setupHint}>Claude, OpenAI veya Gemini key gir.{'\n'}Boş bırakırsan ücretsiz Gemini dener.</Text>
        <TextInput style={s.setupInput} placeholder="sk-ant-... veya boş bırak"
          placeholderTextColor="#334155" value={apiKey} onChangeText={setApiKey}
          secureTextEntry autoCapitalize="none" />
        <TouchableOpacity style={s.bigBtn} onPress={async () => {
          await AsyncStorage.setItem('frodo_api_key', apiKey);
          await AsyncStorage.setItem('frodo_user_name', userName);
          setSetupStep('ready');
        }}>
          <Text style={s.bigBtnText}>Frodo'yu Uyandır 🧙</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSetupStep('name')}>
          <Text style={s.backText}>← Geri</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#020617', '#080F1E', '#020617']} style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      <View style={s.header}>
        <Animated.View style={[s.avatar, { transform: [{ scale: pulseAnim }, { translateY: floatAnim }] }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 26, backgroundColor: glowColor }]} />
          <Text style={s.avatarEmoji}>{getMoodEmoji()}</Text>
        </Animated.View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.frodoName}>Frodo</Text>
          <Text style={s.friendLabel}>{getFriendshipLabel()}</Text>
          <View style={s.friendBar}>
            <View style={[s.friendFill, { width: `${friendshipLevel}%` }]} />
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Switch value={isActive} onValueChange={toggleActive}
            trackColor={{ false: '#1E293B', true: '#1D4ED866' }}
            thumbColor={isActive ? '#63B3ED' : '#475569'} />
          <Text style={[s.statusText, { color: isActive ? '#63B3ED' : '#475569' }]}>
            {isActive ? '● AKTİF' : '○ UYUYOR'}
          </Text>
        </View>
      </View>

      {selfCheckStatus ? (
        <View style={s.statusBar}>
          <ActivityIndicator size="small" color="#63B3ED" />
          <Text style={s.statusBarText}>{selfCheckStatus}</Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.chipsScroll} contentContainerStyle={s.chips}>
        <TouchableOpacity style={s.chip} onPress={() => setSetupStep('key')}>
          <Text style={s.chipText}>🔑 Key</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.chip} onPress={async () => {
          const tip = await getForexTip('güncel döviz kurları', apiKey);
          addMessage('assistant', tip); speak(tip);
        }}>
          <Text style={s.chipText}>📈 Forex</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.chip} onPress={async () => {
          try {
            const loc = await Location.getCurrentPositionAsync({});
            const w = await getWeather(loc.coords.latitude, loc.coords.longitude);
            addMessage('assistant', w); speak(w);
          } catch { addMessage('assistant', 'Konum izni gerekiyor.'); }
        }}>
          <Text style={s.chipText}>🌤 Hava</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.chip} onPress={async () => {
          const r = await analyzeSelf(apiKey);
          addMessage('assistant', r.response); speak(r.response);
        }}>
          <Text style={s.chipText}>🔧 Kendini İncele</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.chip} onPress={doMorningGreeting}>
          <Text style={s.chipText}>☀️ Sabah</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.chip, wakeMode && { borderColor: '#22C55E88', backgroundColor: '#052e16' }]}
          onPress={toggleWakeMode}>
          <Text style={[s.chipText, wakeMode && { color: '#22C55E' }]}>
            {wakeMode ? '👂 Dinliyor...' : '🔊 Hey Frodo'}
          </Text>
        </TouchableOpacity>
        {isSpeaking && (
          <TouchableOpacity style={[s.chip, { borderColor: '#EF444466' }]} onPress={stopSpeaking}>
            <Text style={[s.chipText, { color: '#EF4444' }]}>⏹ Dur</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {!isActive ? (
        <View style={s.sleepView}>
          <Animated.Text style={[{ fontSize: 56 }, { transform: [{ translateY: floatAnim }] }]}>😴</Animated.Text>
          <Text style={s.sleepText}>Frodo uyuyor</Text>
          <Text style={s.sleepSub}>Toggle'ı aç, uyanıyor</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scrollRef} style={s.chatArea}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((msg, i) => (
              <View key={i} style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
                {msg.role === 'assistant' && <Text style={s.bubbleName}>🧙 Frodo</Text>}
                <Text style={s.bubbleText}>{msg.content}</Text>
                {msg.action && (
                  <View style={s.actionTag}>
                    <Text style={s.actionTagText}>⚡ {msg.action}</Text>
                  </View>
                )}
                <Text style={s.bubbleTime}>{formatTime(msg.time)}</Text>
              </View>
            ))}
            {isLoading && (
              <View style={[s.bubble, s.bubbleBot, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Text style={s.bubbleName}>🧙 Frodo</Text>
                <ActivityIndicator size="small" color="#63B3ED" />
              </View>
            )}
          </ScrollView>

          <View style={s.inputRow}>
            <TextInput style={s.chatInput} placeholder="Frodo'ya söyle..."
              placeholderTextColor="#334155" value={inputText}
              onChangeText={setInputText} multiline maxLength={500} />
            <Animated.View style={{ transform: [{ scale: micAnim }] }}>
              <TouchableOpacity
                style={[s.micBtn, isListening && s.micBtnActive]}
                onPress={isListening ? stopListening : startListening}>
                <Text style={s.micIcon}>{isListening ? '🔴' : '🎙️'}</Text>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={[s.sendBtn, isLoading && { opacity: 0.4 }]}
              onPress={() => sendMessage()} disabled={isLoading}>
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={s.sendGrad}>
                <Text style={s.sendIcon}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

    </LinearGradient>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' },
  loadText: { color: '#475569', marginTop: 16, fontSize: 14, letterSpacing: 2 },
  setupScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bigOrb: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: 28, position: 'relative' },
  bigOrbEmoji: { fontSize: 52 },
  ring1: { position: 'absolute', width: 124, height: 124, borderRadius: 62, borderWidth: 1, borderColor: '#3B82F220' },
  ring2: { position: 'absolute', width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: '#3B82F210' },
  titleText: { fontSize: 44, fontWeight: '900', color: '#F1F5F9', letterSpacing: 8, marginBottom: 4 },
  subtitleText: { fontSize: 12, color: '#63B3ED', letterSpacing: 4, marginBottom: 24 },
  descText: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 26, marginBottom: 36 },
  bigBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 44, paddingVertical: 16, borderRadius: 50 },
  bigBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  setupQ: { fontSize: 26, fontWeight: '900', color: '#F1F5F9', marginBottom: 8 },
  setupHint: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  setupInput: { width: '100%', backgroundColor: '#0F172A', color: '#F1F5F9', borderWidth: 1, borderColor: '#1E293B', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 18 },
  backText: { color: '#475569', fontSize: 14, marginTop: 14 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#1E3A5F' },
  avatarEmoji: { fontSize: 26 },
  frodoName: { color: '#F1F5F9', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  friendLabel: { color: '#63B3ED', fontSize: 10, letterSpacing: 1, marginBottom: 3 },
  friendBar: { width: 90, height: 2, backgroundColor: '#1E293B', borderRadius: 1, overflow: 'hidden' },
  friendFill: { height: '100%', backgroundColor: '#63B3ED', borderRadius: 1 },
  statusText: { fontSize: 10, letterSpacing: 2, marginTop: 4 },
  statusBar: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 16, backgroundColor: '#0A1628', gap: 10 },
  statusBarText: { color: '#63B3ED', fontSize: 12 },
  chipsScroll: { maxHeight: 46, borderBottomWidth: 1, borderBottomColor: '#0A1628' },
  chips: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#0F172A', borderRadius: 20, borderWidth: 1, borderColor: '#1E293B' },
  chipText: { color: '#64748B', fontSize: 12 },
  sleepView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  sleepText: { color: '#1E293B', fontSize: 20, fontWeight: '800', letterSpacing: 4 },
  sleepSub: { color: '#1E293B', fontSize: 13 },
  chatArea: { flex: 1 },
  bubble: { maxWidth: '82%', padding: 13, borderRadius: 18, marginBottom: 10 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#1D4ED8', borderBottomRightRadius: 5 },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', borderBottomLeftRadius: 5 },
  bubbleName: { color: '#63B3ED', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  bubbleText: { color: '#E2E8F0', fontSize: 15, lineHeight: 23 },
  bubbleTime: { color: '#334155', fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  actionTag: { marginTop: 7, backgroundColor: '#1E293B', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  actionTagText: { color: '#63B3ED', fontSize: 11 },
  inputRow: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#0A1628', paddingBottom: Platform.OS === 'ios' ? 28 : 10, alignItems: 'flex-end' },
  chatInput: { flex: 1, backgroundColor: '#0F172A', color: '#F1F5F9', borderWidth: 1, borderColor: '#1E293B', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, maxHeight: 100 },
  micBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  micBtnActive: { borderColor: '#EF4444', backgroundColor: '#1A0A0A' },
  micIcon: { fontSize: 20 },
  sendBtn: { alignSelf: 'flex-end' },
  sendGrad: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#FFF', fontSize: 20, fontWeight: '900' },

});