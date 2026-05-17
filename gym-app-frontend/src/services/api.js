import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// NOT: TypeScript tip tanımları (ApiResponse, LoginRequest, vb.)
// JavaScript dosyasında kaldırılarak sadece işlevsellik bırakılmıştır.

/** Expo/Metro bağlandığı bilgisayarın IP'sini alır (telefon + emülatör için). */
function getDevServerHost() {
  try {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const uri = hostUri.startsWith('http') || hostUri.startsWith('exp') ? hostUri : `http://${hostUri}`;
      const host = new URL(uri).hostname;
      if (host && host !== 'localhost') return host;
    }
    const debuggerHost = Constants.manifest?.debuggerHost ?? Constants.manifest2?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      if (host && host !== 'localhost') return host;
    }
    return null;
  } catch {
    return null;
  }
}

const FALLBACK_ANDROID = 'http://10.0.2.2:3000/api';
const FALLBACK_LOCALHOST = 'http://localhost:3000/api';

/** Haftalık beslenme planı (Gemini + büyük JSON) — 60s yetmeyebilir */
const NUTRITION_PLAN_GENERATE_TIMEOUT_MS = 180000;

/** 4 haftalık AI egzersiz programı (Gemini, çoklu hafta) — 60s sık yetmez */
const EXERCISE_PROGRAM_GENERATE_TIMEOUT_MS = 180000;

/** Her istekte güncel base URL (telefonda Constants bazen sonra hazır oluyor). */
function getBaseURL() {
  const envUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  const host = getDevServerHost();
  if (host) return `http://${host}:3000/api`;
  return Platform.select({
    android: FALLBACK_ANDROID,
    ios: FALLBACK_LOCALHOST,
    web: FALLBACK_LOCALHOST,
    default: FALLBACK_LOCALHOST
  }) || FALLBACK_LOCALHOST;
}

class ApiService {
  /** @private @type {import('axios').AxiosInstance} */
  api;
  /** 401 (token expired / invalid) olduğunda çağrılır; Redux clearUser + Login ekranına dönmek için kullanılır */
  onUnauthorizedCallback = null;

  get baseURL() {
    return getBaseURL();
  }

  /** Oturum sona erdiğinde (401) yapılacak aksiyonu kaydeder (örn. Redux clearUser) */
  setOnUnauthorized(callback) {
    this.onUnauthorizedCallback = callback;
  }

  constructor() {
    const initialBaseURL = getBaseURL();
    console.log('API Service initialized with baseURL:', initialBaseURL);
    console.log('Platform:', Platform.OS);

    if (Platform.OS !== 'web' && initialBaseURL.includes('localhost') && !getDevServerHost()) {
      console.warn('⚠️  Telefonda backend için: Aynı Wi-Fi, "npx expo start", uygulamayı QR ile aç.');
    }

    this.api = axios.create({
      baseURL: initialBaseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Axios instance oluşturuldu - Timeout:', this.api.defaults.timeout, 'ms');

    // Request interceptor: her istekte güncel baseURL + auth
    this.api.interceptors.request.use(
      async (config) => {
        config.baseURL = getBaseURL();
        console.log('=== REQUEST INTERCEPTOR ===');
        console.log('Request URL:', config.url);
        console.log('Request method:', config.method);
        console.log('Request baseURL:', config.baseURL);
        console.log('Full URL:', `${config.baseURL}${config.url}`);
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          console.log('Token bulundu, header\'a ekleniyor');
          // Axios 1.x sonrası headers tipi değişimini desteklemek için esnek kullanım
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('Token bulunamadı');
        }
        console.log('Request config:', config);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log('=== RESPONSE INTERCEPTOR (SUCCESS) ===');
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        return response;
      },
      async (error) => {
        console.error('=== RESPONSE INTERCEPTOR (ERROR) ===');
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        console.error('Error message:', error.message);
        if (error.response?.status === 401) {
          console.warn('401 Unauthorized: Clearing storage.');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          if (this.onUnauthorizedCallback) this.onUnauthorizedCallback();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints

  /**
   * Kullanıcı girişi yapar ve token/kullanıcı verisini depolar.
   * @param {object} credentials - { email: string, password: string }
   * @returns {Promise<object>} API yanıt verisi
   */
  async login(credentials) {
    try {
      console.log('=== LOGIN API FONKSİYONU BAŞLADI ===');
      console.log('BaseURL:', this.baseURL);
      console.log('Full URL:', `${this.baseURL}/auth/login`);
      console.log('Credentials:', { ...credentials, password: '***' });
      console.log('Axios instance:', this.api);
      console.log('POST çağrısı yapılıyor...');
      
      const response = await this.api.post('/auth/login', credentials);
      
      console.log('=== POST ÇAĞRISI TAMAMLANDI ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      const { data } = response;

      if (data.success && data.data) {
        console.log('Token kaydediliyor...');
        // Store token and user data
        await AsyncStorage.setItem('authToken', data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        console.log('Token ve kullanıcı bilgileri kaydedildi');
      }
      
      return data;
    } catch (error) {
      console.error('=== LOGIN API HATASI ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      throw this.handleError(error);
    }
  }

  /**
   * Yeni kullanıcı kaydı yapar.
   * @param {object} userData - Kayıt için kullanıcı verileri
   * @returns {Promise<object>} API yanıt verisi
   */
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Kullanıcı profilini getirir.
   * @returns {Promise<object>} API yanıt verisi
   */
  async getProfile() {
    try {
      const response = await this.api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Profil fotoğrafını günceller (data URL veya null ile kaldırma).
   * @param {{ avatarDataUrl: string | null }} payload
   */
  async updateProfileAvatar(payload) {
    try {
      const response = await this.api.put('/auth/profile-avatar', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Pro üyelik (demo): gerçek ödeme yok; sunucuda 30 gün Pro tanımlanır.
   */
  async subscribePro() {
    try {
      const response = await this.api.post('/auth/subscription/pro', {});
      if (response.data?.success && response.data?.data) {
        const prevRaw = await AsyncStorage.getItem('user');
        const prev = prevRaw ? JSON.parse(prevRaw) : {};
        const merged = { ...prev, ...response.data.data };
        await AsyncStorage.setItem('user', JSON.stringify(merged));
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Pro üyeliği iptal; sunucu free tier döner. */
  async cancelProSubscription() {
    try {
      const response = await this.api.post('/auth/subscription/pro/cancel', {});
      if (response.data?.success && response.data?.data) {
        const prevRaw = await AsyncStorage.getItem('user');
        const prev = prevRaw ? JSON.parse(prevRaw) : {};
        const merged = { ...prev, ...response.data.data };
        await AsyncStorage.setItem('user', JSON.stringify(merged));
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rozetler ve seviye özeti (sunucu senkronize eder).
   * @returns {Promise<{ success: boolean, data: { achievements: Array, summary: object } }>}
   */
  async getAchievements() {
    try {
      const response = await this.api.get('/auth/achievements');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Kullanıcıyı uygulamadan çıkarır (Storage temizliği).
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      console.log('Logout successful, storage cleared.');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Health check
  /**
   * API servisinin durumunu kontrol eder.
   * @returns {Promise<object>} API yanıt verisi
   */
  async healthCheck() {
    try {
      // Health check endpoint'i /api prefix'i olmadan tanımlı
      const response = await axios.get(this.baseURL.replace('/api', '') + '/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  /**
   * @private
   * Axios hatalarını daha okunabilir bir Hata (Error) nesnesine dönüştürür.
   * @param {import('axios').AxiosError} error - Axios hata nesnesi
   * @returns {Error} Özelleştirilmiş Hata nesnesi
   */
  handleError(error) {
    console.log('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      request: error.request,
      config: error.config,
      baseURL: this.baseURL
    });
    
    if (error.response) {
      // Sunucu hatası (4xx, 5xx)
      const message = error.response.data?.error?.message || error.response.data?.message || 'Server error';
      const err = new Error(`Server Error (${error.response.status}): ${message}`);
      err.status = error.response.status;
      err.code = error.response.data?.code;
      err.userMessage = error.response.data?.message;
      return err;
    } else if (error.request) {
      const url = error.config?.url ? `${this.baseURL}${error.config.url}` : this.baseURL;
      const reqResp = error.request?._response;
      const isTimeout =
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        String(error.message || '').toLowerCase().includes('timeout') ||
        (error.code === 'ERR_NETWORK' && reqResp === 'timeout');
      if (isTimeout) {
        return new Error(
          `İstek zaman aşımı: Sunucu veya AI yanıtı çok uzun sürdü (${Math.round(
            (error.config?.timeout || 0) / 1000
          )}s limit). Bir süre sonra tekrar deneyin. Adres: ${url}`
        );
      }
      return new Error(
        `Ağ hatası: Sunucudan yanıt alınamadı (${url}). Aynı Wi‑Fi ve backend çalışıyor mu kontrol edin. ` +
          `Uzun süren AI isteklerinde (egzersiz programı) sunucu 1–2 dakika sürebilir; biraz bekleyip tekrar deneyin veya backend/Gemini loglarına bakın.`
      );
    } else {
      // Diğer hatalar
      return new Error(`Error: ${error.message || 'An unexpected error occurred'}`);
    }
  }

  // Get stored user data
  /**
   * Depolanmış kullanıcı verisini getirir.
   * @returns {Promise<object | null>} Kullanıcı nesnesi veya null
   */
  async getStoredUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  /**
   * Kullanıcının kimliği doğrulanmış mı kontrol eder.
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // User details endpoints

  /**
   * Ek kullanıcı detaylarını getirir.
   * @returns {Promise<object>} API yanıt verisi
   */
  async getUserDetails() {
    try {
      const response = await this.api.get('/auth/user-details');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Ek kullanıcı detaylarını günceller.
   * @param {object} details - { height: number, weight: number, injuries: string[] }
   * @returns {Promise<object>} API yanıt verisi
   */
  async updateUserDetails(details) {
    try {
      console.log('API updateUserDetails called with:', details);
      const response = await this.api.put('/auth/user-details', details);
      console.log('API updateUserDetails response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API updateUserDetails error:', error);
      throw this.handleError(error);
    }
  }

  // AI endpoints

  /**
   * AI ile beslenme sorusu sorar.
   * @param {string} question - Kullanıcının sorusu
   * @returns {Promise<object>} AI cevabı
   */
  async askNutritionQuestion(question) {
    try {
      console.log('AI soru gönderiliyor:', question);
      console.log('API BaseURL:', this.baseURL);
      console.log('Full URL:', `${this.baseURL}/ai/nutrition-question`);
      console.log('Timeout ayarı:', this.api.defaults.timeout, 'ms');
      
      // Timeout'u manuel olarak kontrol et ve ayarla
      const config = {
        timeout: 60000 // 60 saniye - AI istekleri için
      };
      
      const response = await this.api.post('/ai/nutrition-question', { question }, config);
      console.log('AI cevap alındı:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI soru hatası detayları:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        request: error.request,
        baseURL: this.baseURL,
        timeout: this.api.defaults.timeout
      });
      throw this.handleError(error);
    }
  }

  /**
   * AI ile kişiselleştirilmiş haftalık beslenme planı oluşturur.
   * @returns {Promise<object>} Haftalık plan: { success, data: { summary: { dailyCalories, protein, carb, fat, recommendations }, week: { Pazartesi: { meals }, ... } } }
   */
  async generateAIPlan() {
    try {
      console.log('AI haftalık plan oluşturuluyor...');
      console.log('Timeout ayarı:', NUTRITION_PLAN_GENERATE_TIMEOUT_MS, 'ms');

      const config = { timeout: NUTRITION_PLAN_GENERATE_TIMEOUT_MS };
      const response = await this.api.post('/ai/nutrition-plan', {}, config);
      console.log('AI haftalık plan alındı:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI plan hatası detayları:', {
        message: error.message,
        code: error.code,
        timeout: this.api.defaults.timeout
      });
      throw this.handleError(error);
    }
  }

  /**
   * Haftalık beslenme planını kaydeder.
   * @param {object} plan - { summary: {...}, week: { Pazartesi: { meals }, ... } }
   * @param {string} [planName] - Plan adı (opsiyonel)
   * @returns {Promise<object>}
   */
  async saveNutritionPlan(plan, planName) {
    try {
      const response = await this.api.post('/ai/nutrition-plans', { plan, planName }, {
        timeout: Math.max(this.api.defaults.timeout, 120000),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Kullanıcının kayıtlı beslenme planlarını listeler.
   * @param {number} [limit=10]
   * @param {number} [offset=0]
   * @returns {Promise<object>} { success, data: [{ id, planName, planData, createdAt, updatedAt }, ...] }
   */
  async getNutritionPlans(limit = 10, offset = 0) {
    try {
      const response = await this.api.get('/ai/nutrition-plans', { params: { limit, offset } });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * ID ile beslenme planı getirir.
   * @param {number} id - Plan ID
   * @returns {Promise<object>}
   */
  async getNutritionPlanById(id) {
    try {
      const response = await this.api.get(`/ai/nutrition-plans/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Beslenme planını günceller (düzenler).
   * @param {number} id - Plan ID
   * @param {object} plan - { summary, week }
   * @param {string} [planName]
   * @returns {Promise<object>}
   */
  async updateNutritionPlan(id, plan, planName) {
    try {
      const response = await this.api.put(`/ai/nutrition-plans/${id}`, { plan, planName });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Beslenme planını siler.
   * @param {number} id - Plan ID
   * @returns {Promise<object>}
   */
  async deleteNutritionPlan(id) {
    try {
      const response = await this.api.delete(`/ai/nutrition-plans/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * AI ile yemek önerileri alır.
   * @param {string} criteria - Öneri kriterleri
   * @returns {Promise<object>} Yemek önerileri
   */
  async getAIFoodSuggestions(criteria) {
    try {
      const response = await this.api.post('/ai/food-suggestions', { criteria });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * AI ile kişiselleştirilmiş egzersiz programı oluşturur.
   * @param {object} config - { difficulty, daysPerWeek, programName?, survey? }
   * @returns {Promise<object>} Egzersiz programı
   */
  async generateAIExerciseProgram(config = {}) {
    try {
      console.log('AI egzersiz programı oluşturuluyor...', config);
      console.log('Timeout ayarı:', EXERCISE_PROGRAM_GENERATE_TIMEOUT_MS, 'ms');

      const response = await this.api.post('/ai/exercise-program', config, {
        timeout: EXERCISE_PROGRAM_GENERATE_TIMEOUT_MS,
      });
      console.log('AI egzersiz programı alındı:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI egzersiz programı hatası detayları:', {
        message: error.message,
        code: error.code,
        timeout: EXERCISE_PROGRAM_GENERATE_TIMEOUT_MS,
      });
      throw this.handleError(error);
    }
  }

  /**
   * Egzersiz programını kaydeder.
   * @param {object} program - { weeklySchedule: object, weeklySummary?: string }
   * @param {string} programName - Plan adı
   * @returns {Promise<object>}
   */
  async saveExerciseProgram(program, programName) {
    try {
      const response = await this.api.post('/ai/exercise-programs', { program, programName });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Kayıtlı egzersiz programlarını listeler.
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<object>}
   */
  async getExercisePrograms(limit = 20, offset = 0) {
    try {
      const response = await this.api.get('/ai/exercise-programs', { params: { limit, offset } });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * ID ile egzersiz programı getirir.
   * @param {number} id
   * @returns {Promise<object>}
   */
  async getExerciseProgramById(id) {
    try {
      const response = await this.api.get(`/ai/exercise-programs/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Egzersiz programını günceller.
   * @param {number} id
   * @param {object} program
   * @param {string} programName
   * @returns {Promise<object>}
   */
  async updateExerciseProgram(id, program, programName) {
    try {
      const response = await this.api.put(`/ai/exercise-programs/${id}`, { program, programName });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Egzersiz programını siler.
   * @param {number} id
   * @returns {Promise<object>}
   */
  async deleteExerciseProgram(id) {
    try {
      const response = await this.api.delete(`/ai/exercise-programs/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Hareket formu puanlama: video (base64) gönderir, AI puan ve kriterlere göre geri bildirim döner.
   * @param {string} videoBase64 - Video dosyasının base64 string
   * @param {string} [mimeType='video/mp4']
   * @param {string} [exerciseName] - Opsiyonel egzersiz adı
   * @returns {Promise<{ success: boolean, data: { feedback: string } }>}
   */
  async analyzeFormScore(videoBase64, mimeType = 'video/mp4', exerciseName = '') {
    try {
      const response = await this.api.post('/ai/form-score', {
        videoBase64,
        mimeType,
        exerciseName: exerciseName?.trim() || undefined,
      }, { timeout: 90000 });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Tabak fotoğrafı analizi: kalori + makro/mikro döner (yaklaşık)
   * @param {string} imageBase64
   * @param {string} mimeType - Örn. 'image/jpeg' | 'image/png'
   * @param {string} portion - Örn. 'az' | 'orta' | 'çok'
   * @returns {Promise<object>}
   */
  async analyzePlatePhoto(imageBase64, mimeType = 'image/jpeg', portion = 'orta') {
    try {
      const response = await this.api.post('/ai/plate-analyze', {
        imageBase64,
        mimeType,
        portion,
      }, { timeout: 90000 });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export default new ApiService();