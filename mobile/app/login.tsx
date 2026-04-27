import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, ChevronRight, Crown, ArrowRight, User as UserIcon, Phone, Eye, EyeOff } from 'lucide-react-native';
import api, { setAuthToken } from '../lib/api';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../components/VideoPlayer';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
  '[Reanimated] Writing to `value` during component render'
]);

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const resolveVideoUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    // Si estamos en producción, usamos el dominio directamente
    const baseUrl = api.defaults.baseURL || 'https://mybostonclub.com/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    
    // Asegurarnos de que no haya dobles barras
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${rootUrl}${cleanUrl}`;
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.loginVideoUrl) {
        setVideoUrl(response.data.loginVideoUrl);
      } else {
        setVideoUrl(null);
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
        if (!firstName || !lastName || !dni || !whatsapp || !birthDateInput) {
          Alert.alert('Error', 'Debes completar todo tu perfil, incluyendo tu fecha de nacimiento.');
          setLoading(false);
          return;
        }

        let birthDateIso = '';
        if (birthDateInput.length === 10) {
            const [dd, mm, yyyy] = birthDateInput.split('/');
            const year = parseInt(yyyy, 10);
            const month = parseInt(mm, 10);
            const day = parseInt(dd, 10);
            
            if (year < 1900 || year > new Date().getFullYear() || month < 1 || month > 12 || day < 1 || day > 31) {
               Alert.alert('Error', 'Ingresa una fecha de nacimiento válida.');
               setLoading(false);
               return;
            }
            birthDateIso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00.000Z`;
        } else {
            Alert.alert('Error', 'Formato de fecha de nacimiento incorrecto (Usa DD/MM/YYYY).');
            setLoading(false);
            return;
        }

        const response = await api.post('/auth/register', { 
          firstName, 
          lastName, 
          dni, 
          whatsapp, 
          email, 
          password,
          birthDate: birthDateIso,
          referralCode: referralCode.trim()
        });
        const { token } = response.data;
        // NO guardamos el token todavía - el guard lo mandaría al dashboard
        // En cambio lo pasamos como parámetro a verify-email
        router.replace({ pathname: '/verify-email', params: { email, pendingToken: token } });
      }
    } catch (error: any) {
      if (error.response?.status === 401 && error.response?.data?.isEmailVerified === false) {
          const { token } = error.response.data;
          // Pasar token como param sin guardarlo
          router.replace({ pathname: '/verify-email', params: { email, pendingToken: token || '' } });
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
        <VideoPlayer
          uri={resolveVideoUrl(videoUrl) || ''}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      {/* Background Glows Overlay */}
      <View className="absolute top-0 right-0 w-64 h-64 bg-boston-red opacity-[0.1] rounded-full blur-[80px]" />
      <View className="absolute bottom-0 left-0 w-64 h-64 bg-boston-gold opacity-[0.1] rounded-full blur-[80px]" />
      <View className="absolute inset-0 bg-black/60" />

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
        <View className="w-full bg-black/70 border border-white/10 rounded-[2.5rem] p-6 lg:p-8 relative z-10 shadow-2xl overflow-hidden">
          <View style={StyleSheet.absoluteFill} className="bg-black/20" />
          
          <View className="space-y-5">
            {!isLogin && (
              <View className="space-y-4">
                <View className="flex-row space-x-4">
                  <View className="flex-1 space-y-1.5">
                    <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Nombre</Text>
                    <TextInput 
                      value={firstName} onChangeText={setFirstName} placeholder="Juan" 
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-medium" 
                    />
                  </View>
                  <View className="flex-1 space-y-1.5">
                    <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Apellido</Text>
                    <TextInput 
                      value={lastName} onChangeText={setLastName} placeholder="Perez"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-medium" 
                    />
                  </View>
                </View>
                <View className="space-y-1.5">
                  <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">DNI (8 Números)</Text>
                  <TextInput 
                    value={dni} onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))} 
                    placeholder="12345678" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.4)"
                    className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-bold tracking-[0.2em]" 
                  />
                </View>
                <View className="flex-row space-x-4">
                  <View className="flex-[1.2] space-y-1.5">
                    <Text className="text-[9px] font-bold text-white/80 uppercase ml-1 tracking-widest">Nacimiento (DD/MM/YYYY)</Text>
                    <TextInput 
                      value={birthDateInput} 
                      onChangeText={(text) => {
                         let t = text.replace(/\D/g, '').slice(0,8);
                         if (t.length >= 5) {
                            setBirthDateInput(`${t.slice(0,2)}/${t.slice(2,4)}/${t.slice(4)}`);
                         } else if (t.length >= 3) {
                            setBirthDateInput(`${t.slice(0,2)}/${t.slice(2)}`);
                         } else {
                            setBirthDateInput(t);
                         }
                      }} 
                      placeholder="DD/MM/YYYY" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.4)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-bold tracking-widest" 
                    />
                  </View>
                  <View className="flex-[0.8] space-y-1.5">
                    <Text className="text-[9px] font-bold text-white/80 uppercase ml-1 tracking-widest">WhatsApp</Text>
                    <TextInput 
                      value={whatsapp} onChangeText={(t) => setWhatsapp(t.replace(/\D/g, ''))} 
                      placeholder="11223344" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.4)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-bold tracking-[0.1em]" 
                    />
                  </View>
                </View>
                <View className="space-y-1.5">
                  <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">¿Código de amigo? (Opcional)</Text>
                  <TextInput 
                    value={referralCode} 
                    onChangeText={(t) => {
                      let cleaned = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (cleaned.startsWith('BST') && cleaned.length > 3) {
                        setReferralCode(`BST-${cleaned.substring(3, 7)}`);
                      } else {
                        setReferralCode(cleaned);
                      }
                    }} 
                    placeholder="BST-XXXX" placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="characters"
                    className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-bold tracking-[0.2em]" 
                  />
                </View>
              </View>
            )}

            <View className="space-y-1.5 mt-2">
              <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Correo electrónico</Text>
              <View className="relative justify-center">
                <View className="absolute left-4 z-10">
                  <Mail size={16} color="rgba(255,255,255,0.4)" />
                </View>
                <TextInput 
                  value={email} onChangeText={setEmail} placeholder="tu@email.com" 
                  placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" keyboardType="email-address"
                  className="w-full bg-black/40 text-white border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 h-12 font-medium" 
                />
              </View>
            </View>

            <View className="space-y-1.5 mt-4">
              <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Contraseña</Text>
              <View className="relative justify-center">
                <View className="absolute left-4 z-10">
                  <Lock size={16} color="rgba(255,255,255,0.4)" />
                </View>
                <TextInput 
                  value={password} onChangeText={setPassword} placeholder="••••••••" 
                  placeholderTextColor="rgba(255,255,255,0.4)" secureTextEntry={!showPassword}
                  className="w-full bg-black/40 text-white border border-white/10 rounded-2xl py-3.5 pl-11 pr-12 h-12 font-medium" 
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-2 z-10 p-2"
                >
                  {showPassword ? (
                    <EyeOff size={22} color="rgba(255,255,255,0.4)" />
                  ) : (
                    <Eye size={22} color="rgba(255,255,255,0.4)" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/forgot-password')}
              className="mt-4 self-end"
            >
              <Text className="text-[10px] font-bold text-white/60 uppercase tracking-widest">¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleAuth}
              disabled={loading}
              className={`w-full mt-6 rounded-[1rem] p-[1px] relative overflow-hidden ${loading ? 'opacity-50' : ''}`}
            >
              <View className="absolute inset-0 bg-boston-gold opacity-50" />
              <View className="flex-row items-center justify-center bg-boston-black py-4 px-8 rounded-[1rem] border border-boston-gold/50 shadow-xl shadow-boston-gold/20">
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
              <Text className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                {isLogin ? (
                  <>¿No tienes cuenta? <Text className="text-boston-gold">Regístrate gratis</Text></>
                ) : (
                  <>¿Ya eres socio? <Text className="text-boston-gold">Identifícate</Text></>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-12 items-center">
          <Text className="text-[9px] font-bold text-white/60 uppercase tracking-[0.4em]">
            © 2026 Boston Club Social
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
