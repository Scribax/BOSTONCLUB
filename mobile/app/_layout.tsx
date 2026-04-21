import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { getAuthToken } from '../lib/api';
import "../global.css";
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Lock } from 'lucide-react-native';

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

import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  // Escuchar cuando el usuario toca una notificación
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Si la notificación es de un nuevo evento, mandamos al usuario a la pantalla de eventos
      // Si es un BANNER, lo dejamos en el inicio (donde está el carrusel de banners)
      if (data?.type === 'NEW_EVENT' || data?.type === 'EVENT_REMINDER') {
        // Un pequeño delay para asegurar que la navegación esté lista
        setTimeout(() => {
          router.push('/events');
        }, 500);
      }
    });

    return () => subscription.remove();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function checkLogin() {
      const token = await getAuthToken();
      if (token) {
        setIsLoggedIn(true);
        
        // Verificación Biométrica si está activa
        const bioEnabled = await SecureStore.getItemAsync('biometrics_enabled');
        if (bioEnabled === 'true') {
          setIsLocked(true);
          await handleBiometricAuth();
        }
      } else {
        setTimeout(() => router.replace('/login'), 10);
      }
      setIsAuthChecking(false);
    }

    async function handleBiometricAuth() {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Bienvenido de nuevo a Boston Club',
        fallbackLabel: 'Ingresar con DNI/Contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
      } else {
        // Si falla o cancela, enviamos al login por seguridad
        // a menos que quiera reintentar
        setIsLocked(true);
      }
    }
    
    if (loaded) {
      SplashScreen.hideAsync();
      checkLogin();
    }
  }, [loaded]);

  if (!loaded || isAuthChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  if (isLocked) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center px-10">
        <View className="absolute top-0 right-0 w-80 h-80 bg-boston-gold opacity-10 rounded-full blur-[100px]" />
        
        <View className="w-20 h-20 bg-white/5 rounded-3xl items-center justify-center border border-white/10 mb-8">
          <Lock size={32} color="#D4AF37" />
        </View>
        
        <Text className="text-white text-2xl font-black italic uppercase tracking-tighter text-center mb-2">Acceso Protegido</Text>
        <Text className="text-white/50 text-xs font-medium text-center mb-10">Tu sesión en Boston Club está resguardada por biometría.</Text>
        
        <TouchableOpacity 
          onPress={() => {
            const checkLogin = async () => {
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Bienvenido de nuevo a Boston Club',
                fallbackLabel: 'Usar PIN/Contraseña',
              });
              if (result.success) setIsLocked(false);
            };
            checkLogin();
          }}
          className="bg-boston-gold py-4 px-8 rounded-2xl w-full flex-row justify-center items-center"
        >
          <Text className="text-black font-black uppercase text-xs tracking-widest">Desbloquear App</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={async () => {
             const { logout } = await import('../lib/api');
             await logout();
             setIsLocked(false);
             setIsLoggedIn(false);
             router.replace('/login');
          }}
          className="mt-6"
        >
          <Text className="text-white/30 font-bold uppercase text-[10px] tracking-widest underline">Cerrar Sesión Activa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
