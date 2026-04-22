import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
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

export const logout = async () => {
  await SecureStore.deleteItemAsync('boston_club_token');
  notifyListeners(false);
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    if (error.response?.status === 401 || error.response?.status === 403) {
      await logout();
      // Podríamos emitir un evento o usar un set del estado global si tuvieramos uno
    }
    return Promise.reject(error);
  }
);

export default api;
