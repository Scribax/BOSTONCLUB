import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// USAR TU VPS PARA PRODUCCIÓN (CON SSL)
const API_URL = 'https://mybostonclub.com/api';

export const getAuthToken = async () => {
  return await SecureStore.getItemAsync('boston_club_token');
};

// Sistema simple de eventos para notificar cambios de auth
type AuthListener = (loggedIn: boolean) => void;
let authListeners: AuthListener[] = [];

export const onAuthStateChange = (callback: AuthListener) => {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter(l => l !== callback);
  };
};

const notifyListeners = (loggedIn: boolean) => {
  authListeners.forEach(l => l(loggedIn));
};

export const setAuthToken = async (token: string) => {
  await SecureStore.setItemAsync('boston_club_token', token);
  notifyListeners(true);
};

// Cache en memoria para GET requests (Stale-While-Revalidate)
// DECLARADO ANTES de logout() para que clearCache() sea accesible
const getCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60000; // 1 minuto de cache instantáneo
const PERSIST_KEY_PREFIX = 'api_cache:';

// Rutas que se persisten en AsyncStorage para offline mode
const PERSIST_ROUTES = ['/auth/me', '/settings', '/rewards', '/events'];

const persistCache = async (url: string, data: any) => {
  try {
    if (PERSIST_ROUTES.some(r => url.includes(r))) {
      await AsyncStorage.setItem(`${PERSIST_KEY_PREFIX}${url}`, JSON.stringify(data));
    }
  } catch {}
};

const getPersistedCache = async (url: string): Promise<any | null> => {
  try {
    const raw = await AsyncStorage.getItem(`${PERSIST_KEY_PREFIX}${url}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const clearCache = () => {
  getCache.clear();
  // Limpiar también el cache persistido al hacer logout
  PERSIST_ROUTES.forEach(r => AsyncStorage.removeItem(`${PERSIST_KEY_PREFIX}${r}`).catch(() => {}));
};

export const logout = async () => {
  await SecureStore.deleteItemAsync('boston_club_token');
  clearCache(); // ¡Crucial! Evita que el próximo login use datos del usuario anterior
  notifyListeners(false);
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const originalGet = api.get;
api.get = async (url: string, config?: any) => {
  // Rutas dinámicas que NO deben cachearse nunca
  const dynamicRoutes = ['/redemptions/active', '/redemptions/history', '/vip-benefits/me'];
  if (dynamicRoutes.some(route => url.includes(route))) {
    return originalGet(url, config);
  }

  const key = url + JSON.stringify(config?.params || {});
  const cached = getCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Background fetch silencioso
    originalGet(url, config).then(res => {
      getCache.set(key, { data: res.data, timestamp: Date.now() });
    }).catch(() => {});
    
    // Retorna inmediato de memoria
    return { data: cached.data } as any;
  }

  try {
    const res = await originalGet(url, config);
    getCache.set(key, { data: res.data, timestamp: Date.now() });
    persistCache(url, res.data);
    return res;
  } catch (err: any) {
    // Sin internet — intentar devolver el último dato persistido
    if (!err.response) {
      const persisted = await getPersistedCache(url);
      if (persisted) return { data: persisted } as any;
    }
    throw err;
  }
};

// Interceptor para añadir el Token
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores (401, etc)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido — limpiar sesión y notificar
      await SecureStore.deleteItemAsync('boston_club_token');
      clearCache();
      notifyListeners(false);
    }
    return Promise.reject(error);
  }
);

export default api;
