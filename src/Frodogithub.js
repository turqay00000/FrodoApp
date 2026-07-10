// FrodoGitHub.js - Frodo kendi kodunu GitHub'dan okur ve günceller

const GITHUB_API = 'https://api.github.com';

export class FrodoGitHub {
  constructor(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  // Dosya içeriğini oku
  async readFile(path) {
    try {
      const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`, {
        headers: this.headers,
      });
      const data = await res.json();
      if (data.message) throw new Error(data.message);
      const content = atob(data.content.replace(/\n/g, ''));
      return { content, sha: data.sha };
    } catch (e) {
      return { content: null, sha: null, error: e.message };
    }
  }

  // Dosyayı güncelle
  async updateFile(path, newContent, sha, commitMessage) {
    try {
      const encoded = btoa(unescape(encodeURIComponent(newContent)));
      const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          message: commitMessage || `Frodo: ${path} güncellendi`,
          content: encoded,
          sha: sha,
        }),
      });
      const data = await res.json();
      if (data.message && !data.content) throw new Error(data.message);
      return { success: true, commit: data.commit?.sha };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Tüm repo dosyalarını listele
  async listFiles(path = '') {
    try {
      const res = await fetch(`${GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`, {
        headers: this.headers,
      });
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map(f => ({ name: f.name, path: f.path, type: f.type }));
    } catch (e) {
      return [];
    }
  }

  // AI ile kod geliştir ve commit et
  async improveWithAI(filePath, instruction, aiCallFn) {
    // 1. Mevcut kodu oku
    const { content, sha, error } = await this.readFile(filePath);
    if (!content) return { success: false, error: error || 'Dosya okunamadı' };

    // 2. AI'dan yeni kod al
    const prompt = `Sen bir React Native geliştiricisisin ve Frodo adlı AI asistan uygulamasının kodunu geliştiriyorsun.

Mevcut kod (${filePath}):
\`\`\`javascript
${content.substring(0, 3000)}
\`\`\`

Görev: ${instruction}

Sadece güncellenmiş tam kod dosyasını döndür. Açıklama veya markdown olmadan, sadece kod.`;

    const newCode = await aiCallFn(prompt, [], '', '', 0, '');

    // 3. Kodu temizle (markdown varsa kaldır)
    const cleanCode = newCode
      .replace(/```javascript\n?/g, '')
      .replace(/```js\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // 4. GitHub'a commit et
    const result = await this.updateFile(
      filePath,
      cleanCode,
      sha,
      `Frodo: ${instruction.substring(0, 50)}`
    );

    return result;
  }
}

// GitHub ayarlarını kaydet/yükle
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveGitHubConfig(token, owner, repo) {
  await AsyncStorage.setItem('frodo_github_token', token);
  await AsyncStorage.setItem('frodo_github_owner', owner);
  await AsyncStorage.setItem('frodo_github_repo', repo);
}

export async function loadGitHubConfig() {
  const token = await AsyncStorage.getItem('frodo_github_token');
  const owner = await AsyncStorage.getItem('frodo_github_owner');
  const repo = await AsyncStorage.getItem('frodo_github_repo');
  return { token, owner, repo };
}

export async function getFrodoGitHub() {
  const { token, owner, repo } = await loadGitHubConfig();
  if (!token || !owner || !repo) return null;
  return new FrodoGitHub(token, owner, repo);
}