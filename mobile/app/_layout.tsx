import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, LogBox } from 'react-native';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
  '[Reanimated] Writing to `value` during component render'
]);
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { getAuthToken, logout, onAuthStateChange } from '../lib/api';
import "../global.css";
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Lock } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...FontAwesome.font });
  const [authState, setAuthState] = useState({ isLoading: true, isLoggedIn: false });
  const [isLocked, setIsLocked] = useState(false);
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const router = useRouter();
  const colorScheme = useColorScheme();

  // 1. Carga inicial y Autenticación reactiva
  useEffect(() => {
    const unsubscribe = onAuthStateChange((loggedIn) => {
      setAuthState({ isLoading: false, isLoggedIn: loggedIn });
    });

    async function init() {
      try {
        const token = await getAuthToken();
        const loggedIn = !!token;

        if (loggedIn) {
          const bioEnabled = await SecureStore.getItemAsync('biometrics_enabled');
          if (bioEnabled === 'true') {
            setIsLocked(true);
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Bienvenido a Boston Club',
            });
            if (result.success) setIsLocked(false);
          }
        }

        setAuthState({ isLoading: false, isLoggedIn: loggedIn });
      } catch (e) {
        setAuthState({ isLoading: false, isLoggedIn: false });
      }
    }
    if (loaded) init();

    return () => unsubscribe();
  }, [loaded]);

  // FIX: Ocultar el splash SOLO cuando ambas condiciones estén listas.
  // En producción el bundle carga muy rápido y el finally del init()
  // se ejecutaba antes de que `loaded` fuera true, dejando el splash colgado.
  useEffect(() => {
    if (loaded && !authState.isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authState.isLoading]);

  // 2. Proteger rutas
  useEffect(() => {
    if (authState.isLoading || !loaded) return;

    const currentSegments = segmentsRef.current;
    const inAuthGroup =
      currentSegments[0] === 'login' ||
      currentSegments[0] === 'verify-email' ||
      currentSegments[0] === 'forgot-password' ||
      currentSegments[0] === 'reset-password';

    // FIX: Pequeño delay para garantizar que el Navigator esté montado
    // antes de hacer replace(). En producción el bundle es instantáneo
    // y el router puede no estar listo todavía → flash de pantalla negra.
    const redirect = () => {
      if (!authState.isLoggedIn && !inAuthGroup) {
        router.replace('/login');
      } else if (authState.isLoggedIn && currentSegments[0] === 'login') {
        router.replace('/(tabs)');
      }
    };

    const timer = setTimeout(redirect, 50);
    return () => clearTimeout(timer);
  }, [authState.isLoggedIn, authState.isLoading, loaded]);

  // FIX: Escuchar si el usuario tocó una notificación Push
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data?.type &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const type = lastNotificationResponse.notification.request.content.data.type;
      if (type === 'NEW_EVENT' || type === 'NEW_BANNER' || type === 'EVENT_REMINDER') {
        // Redirigir a la pantalla de eventos si toca la notificación
        router.push('/events');
      }
    }
  }, [lastNotificationResponse, authState.isLoggedIn, authState.isLoading, loaded]);

  const handleUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Boston Club',
    });
    if (result.success) setIsLocked(false);
  };

  const handleLogout = async () => {
    await logout();
    setAuthState({ isLoading: false, isLoggedIn: false });
    setIsLocked(false);
    router.replace('/login');
  };

  if (!loaded || authState.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4AF37" />
        <Text style={{ color: 'rgba(212, 175, 55, 0.4)', marginTop: 20, fontSize: 10, fontWeight: 'bold', letterSpacing: 4 }}>BOSTON CLUB</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>

      {isLocked && (
        <View className="absolute inset-0 bg-[#050505] items-center justify-center px-10 z-[9999]">
          <View className="w-20 h-20 bg-white/5 rounded-3xl items-center justify-center border border-white/10 mb-8 font-black">
            <Lock size={32} color="#D4AF37" />
          </View>
          <Text className="text-white text-2xl font-black italic uppercase tracking-tighter text-center mb-2">Acceso Protegido</Text>
          <Text className="text-white/50 text-xs font-medium text-center mb-10">Tu sesión está resguardada por biometría.</Text>
          <TouchableOpacity onPress={handleUnlock} className="bg-boston-gold py-4 px-8 rounded-2xl w-full items-center shadow-lg shadow-boston-gold/20">
            <Text className="text-black font-black uppercase text-xs tracking-widest">Desbloquear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} className="mt-6">
            <Text className="text-white/30 font-bold uppercase text-[10px] tracking-widest underline">Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </ThemeProvider>
  );
}
