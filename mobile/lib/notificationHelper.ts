import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// IMPORTANTE: En SDK 53, importar expo-notifications en Expo Go Android lanza un error fatal.
// Usamos require dinámico para evitar que el bundle falle al cargar.
let Notifications: any = null;

const getNotifications = () => {
  if (Platform.OS === 'web') return null;
  if (Notifications) return Notifications;
  if (Constants.appOwnership === 'expo') return null;
  
  try {
    Notifications = require('expo-notifications');
    return Notifications;
  } catch (e) {
    return null;
  }
};

export const initNotifications = () => {
  const Notify = getNotifications();
  if (!Notify) return;

  Notify.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const useLastNotificationResponse = () => {
  const Notify = getNotifications();
  if (!Notify || typeof Notify.useLastNotificationResponse !== 'function') {
    return null;
  }
  return Notify.useLastNotificationResponse();
};

export const DEFAULT_ACTION_IDENTIFIER = 'expo.modules.notifications.actions.DEFAULT';

export const registerForPushNotificationsAsync = async () => {
  if (Constants.appOwnership === 'expo') {
    console.log('Push Notifications: Saltando registro en Expo Go (No soportado en SDK 53)');
    return null;
  }

  const Notify = getNotifications();
  if (!Notify) return null;

  let token;
  if (Platform.OS === 'android') {
    await Notify.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notify.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notify.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notify.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permisos de notificaciones no otorgados');
      return null;
    }
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '3c50dc68-3e19-4218-a359-aca0431d7233';
      const pushTokenData = await Notify.getExpoPushTokenAsync({
         projectId
      });
      token = pushTokenData.data;
      
      if (token) {
         await api.patch('/auth/push-token', { token }).catch(() => {});
      }
    } catch (e) {
      console.log('Error obteniendo Push Token:', e);
    }
  }
  return token;
};
