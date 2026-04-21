import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { getAuthToken } from '../lib/api';
import "../global.css";
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Lock } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function checkLogin() {
      const token = await getAuthToken();
      setIsLoggedIn(!!token);
      setIsAuthChecking(false);
    }
    
    if (loaded) {
      SplashScreen.hideAsync();
      checkLogin();
    }
  }, [loaded]);

  const colorScheme = useColorScheme();

  if (!loaded || isAuthChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  // Patrón Redirect: Si no está logueado, redirigimos de forma declarativa
  if (!isLoggedIn) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Redirect href="/login" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    async function initApp() {
      // 1. Verificación Biométrica inicial
      const bioEnabled = await SecureStore.getItemAsync('biometrics_enabled');
      if (bioEnabled === 'true') {
        setIsLocked(true);
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Bienvenido de nuevo a Boston Club',
          fallbackLabel: 'Ingresar con DNI/Contraseña',
          disableDeviceFallback: false,
        });
        if (result.success) setIsLocked(false);
      }

      // 2. Listener de Notificaciones (dentro del contexto)
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.type === 'NEW_EVENT' || data?.type === 'EVENT_REMINDER') {
          setTimeout(() => router.push('/events'), 500);
        }
      });

      return () => subscription.remove();
    }
    
    initApp();
  }, []);

  const handleLogout = async () => {
    const { logout } = await import('../lib/api');
    await logout();
    router.replace('/login');
  };

  const handleUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Bienvenido de nuevo a Boston Club',
      fallbackLabel: 'Usar PIN/Contraseña',
    });
    if (result.success) setIsLocked(false);
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>

      {isLocked && (
        <View className="absolute inset-0 bg-[#050505] items-center justify-center px-10 z-[9999]">
          <View className="absolute top-0 right-0 w-80 h-80 bg-boston-gold opacity-10 rounded-full blur-[100px]" />
          
          <View className="w-20 h-20 bg-white/5 rounded-3xl items-center justify-center border border-white/10 mb-8">
            <Lock size={32} color="#D4AF37" />
          </View>
          
          <Text className="text-white text-2xl font-black italic uppercase tracking-tighter text-center mb-2">Acceso Protegido</Text>
          <Text className="text-white/50 text-xs font-medium text-center mb-10">Tu sesión en Boston Club está resguardada por biometría.</Text>
          
          <TouchableOpacity 
            onPress={handleUnlock}
            className="bg-boston-gold py-4 px-8 rounded-2xl w-full flex-row justify-center items-center shadow-lg shadow-boston-gold/20"
          >
            <Text className="text-black font-black uppercase text-xs tracking-widest">Desbloquear App</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            className="mt-6"
          >
            <Text className="text-white/30 font-bold uppercase text-[10px] tracking-widest underline">Cerrar Sesión Activa</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
