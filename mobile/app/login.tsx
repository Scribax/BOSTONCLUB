import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, ChevronRight, Crown, ArrowRight, User as UserIcon, Phone } from 'lucide-react-native';
import api, { setAuthToken } from '../lib/api';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const resolveVideoUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    // El api.defaults.baseURL suele ser something like http://192.168.1.36:8080/api
    // Necesitamos el root (sin el /api) para acceder a /uploads
    const baseUrl = api.defaults.baseURL || 'http://192.168.1.36:8080/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    return `${rootUrl}${url}`;
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.loginVideoUrl) {
        setVideoUrl(response.data.loginVideoUrl);
      }
    } catch (error) {
      console.error('Error fetching settings for video', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa todos los campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        const { token } = response.data;
        await setAuthToken(token);
        router.replace('/(tabs)');
      } else {
        if (!firstName || !lastName || !dni || !whatsapp) {
          Alert.alert('Error', 'Debes completar todo tu perfil');
          setLoading(false);
          return;
        }
        const response = await api.post('/auth/register', { 
          firstName, 
          lastName, 
          dni, 
          whatsapp, 
          email, 
          password 
        });
        const { token } = response.data;
        await setAuthToken(token);
        // Despues de registrar, mandamos a verificar
        router.replace({ pathname: '/verify-email', params: { email } });
      }
    } catch (error: any) {
      if (error.response?.status === 401 && error.response?.data?.isEmailVerified === false) {
          const { token } = error.response.data;
          // Si el error es falta de verificación, guardamos token (para que verify-email pueda usarlo)
          // y mandamos a la pantalla de verificación
          if (token) await setAuthToken(token);
          router.replace({ pathname: '/verify-email', params: { email } });
          return;
      }
      const msg = error.response?.data?.message || 'Credenciales inválidas o error en el registro';
      Alert.alert('Acceso Denegado', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#050505]"
    >
      <StatusBar style="light" />
      
      {/* Dynamic Video Background */}
      {videoUrl && (
        <Video
          source={{ uri: resolveVideoUrl(videoUrl) || '' }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />
      )}
      
      {/* Background Glows Overlay */}
      <View className="absolute top-0 right-0 w-64 h-64 bg-boston-red opacity-[0.15] rounded-full blur-[80px]" />
      <View className="absolute bottom-0 left-0 w-64 h-64 bg-boston-gold opacity-[0.15] rounded-full blur-[80px]" />
      <View className="absolute inset-0 bg-black/40" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-12">
        {/* Header */}
        <View className="items-center mb-10 z-10">
          <View className="w-20 h-20 bg-[#111] rounded-2xl items-center justify-center shadow-xl border border-white/5 mb-4 border-boston-gold/20">
            <Crown size={40} color="#D4AF37" />
          </View>
          <Text className="text-3xl font-black tracking-tight text-white uppercase text-center italic">
            Boston <Text className="text-[#ff4d4d]">Club</Text>
          </Text>
          <View className="flex-row items-center mt-2 space-x-2">
             <View className="h-[1px] w-4 bg-boston-gold/30" />
             <Text className="text-[10px] font-black tracking-[0.3em] text-boston-gold uppercase opacity-80 mx-2">
               Fidelización Premium
             </Text>
             <View className="h-[1px] w-4 bg-boston-gold/30" />
          </View>
        </View>

        {/* Auth Box */}
        <View className="w-full bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 lg:p-8 relative z-10 shadow-2xl">
          <View className="space-y-5">
            
            {!isLogin && (
              <View className="space-y-4">
                <View className="flex-row space-x-4">
                  <View className="flex-1 space-y-1.5">
                    <Text className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Nombre</Text>
                    <TextInput 
                      value={firstName} onChangeText={setFirstName} placeholder="Juan" 
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-medium" 
                    />
                  </View>
                  <View className="flex-1 space-y-1.5">
                    <Text className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Apellido</Text>
                    <TextInput 
                      value={lastName} onChangeText={setLastName} placeholder="Perez"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-medium" 
                    />
                  </View>
                </View>
                <View className="space-y-1.5">
                  <Text className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">DNI (8 Números)</Text>
                  <TextInput 
                    value={dni} onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))} 
                    placeholder="12345678" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.2)"
                    className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-bold tracking-[0.2em]" 
                  />
                </View>
                <View className="space-y-1.5">
                  <Text className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">WhatsApp</Text>
                  <TextInput 
                    value={whatsapp} onChangeText={(t) => setWhatsapp(t.replace(/\D/g, ''))} 
                    placeholder="1122334455" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.2)"
                    className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-bold tracking-[0.2em]" 
                  />
                </View>
              </View>
            )}

            <View className="space-y-1.5 mt-2">
              <Text className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Email Corporativo</Text>
              <View className="relative justify-center">
                <View className="absolute left-4 z-10">
                  <Mail size={16} color="rgba(255,255,255,0.2)" />
                </View>
                <TextInput 
                  value={email} onChangeText={setEmail} placeholder="tu@empresa.com" 
                  placeholderTextColor="rgba(255,255,255,0.1)" autoCapitalize="none" keyboardType="email-address"
                  className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 h-12 font-medium" 
                />
              </View>
            </View>

            <View className="space-y-1.5 mt-4">
              <Text className="text-[10px] font-bold text-white/30 uppercase ml-1 tracking-widest">Contraseña</Text>
              <View className="relative justify-center">
                <View className="absolute left-4 z-10">
                  <Lock size={16} color="rgba(255,255,255,0.2)" />
                </View>
                <TextInput 
                  value={password} onChangeText={setPassword} placeholder="••••••••" 
                  placeholderTextColor="rgba(255,255,255,0.1)" secureTextEntry
                  className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 h-12 font-medium" 
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/forgot-password')}
              className="mt-4 self-end"
            >
              <Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest">¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleAuth}
              disabled={loading}
              className={`w-full mt-6 rounded-[1rem] p-[1px] relative overflow-hidden ${loading ? 'opacity-50' : ''}`}
            >
              <View className="absolute inset-0 bg-boston-gold opacity-50" />
              <View className="flex-row items-center justify-center bg-boston-black py-4 px-8 rounded-[1rem] border border-boston-gold/50">
                {loading ? (
                  <ActivityIndicator color="#D4AF37" />
                ) : (
                  <>
                    <Text className="text-xs font-black text-white uppercase tracking-[0.2em] mr-3">
                      {isLogin ? "Iniciar Sesión" : "Crear Perfil"}
                    </Text>
                    <ArrowRight size={18} color="#D4AF37" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View className="mt-8 pt-6 border-t border-white/5 items-center">
            <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); }}>
              <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                {isLogin ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya eres socio? Identifícate"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-12 items-center">
          <Text className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em]">
            © 2026 Boston Club Social
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
