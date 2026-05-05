import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Mail, Lock, Crown, ArrowRight, User as UserIcon, Phone, Eye, EyeOff } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
import { LoginProps } from './types';

export default function LoginDefault(props: LoginProps) {
  const {
    isLogin, setIsLogin, email, setEmail, password, setPassword,
    firstName, setFirstName, lastName, setLastName, dni, setDni,
    whatsapp, setWhatsapp, birthDateInput, setBirthDateInput,
    referralCode, setReferralCode, loading, showPassword, setShowPassword,
    videoUrl, theme, handleAuth, resolveVideoUrl
  } = props;

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />
      
      {videoUrl && (
        <VideoPlayer
          uri={resolveVideoUrl(videoUrl) || ''}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      <View style={{ backgroundColor: theme.primary }} className="absolute top-0 right-0 w-64 h-64 opacity-[0.1] rounded-full blur-[80px]" />
      <View style={{ backgroundColor: theme.secondary }} className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.1] rounded-full blur-[80px]" />
      <View className="absolute inset-0 bg-black/60" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-12" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-10 z-10">
          <View style={{ borderColor: `${theme.secondary}33` }} className="w-20 h-20 bg-[#111] rounded-2xl items-center justify-center shadow-xl border border-white/5 mb-4">
            <Crown size={40} color={theme.secondary} />
          </View>
          <Text className="text-3xl font-black tracking-tight text-white uppercase text-center italic">
            Boston <Text style={{ color: theme.primary }}>Club</Text>
          </Text>
          <View className="flex-row items-center mt-2 space-x-2">
             <View style={{ backgroundColor: `${theme.secondary}4D` }} className="h-[1px] w-4" />
             <Text style={{ color: theme.secondary }} className="text-[10px] font-black tracking-[0.3em] uppercase opacity-80 mx-2">
               Fidelización Premium
             </Text>
             <View style={{ backgroundColor: `${theme.secondary}4D` }} className="h-[1px] w-4" />
          </View>
        </View>

        <View className="w-full bg-black/70 border border-white/10 rounded-[2.5rem] p-6 relative z-10 shadow-2xl overflow-hidden">
          <View style={StyleSheet.absoluteFill} className="bg-black/20" />
          
          <View className="gap-y-5">
            {!isLogin && (
              <View className="gap-y-4">
                <View className="flex-row gap-x-4">
                  <View className="flex-1 gap-y-1.5">
                    <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Nombre</Text>
                    <TextInput 
                      value={firstName} onChangeText={setFirstName} placeholder="Juan" 
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-medium" 
                    />
                  </View>
                  <View className="flex-1 gap-y-1.5">
                    <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Apellido</Text>
                    <TextInput 
                      value={lastName} onChangeText={setLastName} placeholder="Perez"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-medium" 
                    />
                  </View>
                </View>
                <View className="gap-y-1.5">
                  <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">DNI (8 Números)</Text>
                  <TextInput 
                    value={dni} onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))} 
                    placeholder="12345678" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.4)"
                    className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-bold tracking-[0.2em]" 
                  />
                </View>
                <View className="flex-row gap-x-4">
                  <View className="flex-[1.2] gap-y-1.5">
                    <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">WhatsApp</Text>
                    <View className="flex-row items-center bg-black/40 border border-white/5 rounded-2xl px-4 h-12">
                      <Phone size={14} color="rgba(255,255,255,0.4)" className="mr-2" />
                      <TextInput 
                        value={whatsapp} onChangeText={(t) => setWhatsapp(t.replace(/\D/g, ''))} 
                        placeholder="1122334455" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.2)"
                        className="flex-1 text-white font-medium" 
                      />
                    </View>
                  </View>
                  <View className="flex-1 gap-y-1.5">
                    <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Nacimiento</Text>
                    <TextInput 
                      value={birthDateInput} 
                      onChangeText={(t) => {
                        let cleaned = t.replace(/\D/g, '');
                        if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
                        let formatted = cleaned;
                        if (cleaned.length > 4) formatted = `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4)}`;
                        else if (cleaned.length > 2) formatted = `${cleaned.slice(0,2)}/${cleaned.slice(2)}`;
                        setBirthDateInput(formatted);
                      }} 
                      placeholder="DD/MM/AAAA" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-3.5 px-4 h-12 font-medium" 
                    />
                  </View>
                </View>
              </View>
            )}

            <View className="gap-y-1.5">
              <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Email</Text>
              <View className="flex-row items-center bg-black/40 border border-white/5 rounded-2xl px-4 h-12">
                <Mail size={16} color="rgba(255,255,255,0.4)" className="mr-3" />
                <TextInput 
                  value={email} onChangeText={setEmail} placeholder="email@ejemplo.com" 
                  autoCapitalize="none" keyboardType="email-address" placeholderTextColor="rgba(255,255,255,0.2)"
                  className="flex-1 text-white font-medium" 
                />
              </View>
            </View>

            <View className="gap-y-1.5">
              <Text className="text-[10px] font-bold text-white/80 uppercase ml-1 tracking-widest">Contraseña</Text>
              <View className="flex-row items-center bg-black/40 border border-white/5 rounded-2xl px-4 h-12">
                <Lock size={16} color="rgba(255,255,255,0.4)" className="mr-3" />
                <TextInput 
                  value={password} onChangeText={setPassword} placeholder="••••••••" 
                  secureTextEntry={!showPassword} placeholderTextColor="rgba(255,255,255,0.2)"
                  className="flex-1 text-white font-medium" 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} color="rgba(255,255,255,0.4)" /> : <Eye size={16} color="rgba(255,255,255,0.4)" />}
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              <View className="gap-y-1.5">
                <Text className="text-[10px] font-bold text-boston-gold uppercase ml-1 tracking-widest">Código de Referido (Opcional)</Text>
                <TextInput 
                  value={referralCode} onChangeText={setReferralCode} placeholder="ABC-123" 
                  autoCapitalize="characters" placeholderTextColor="rgba(212,175,55,0.2)"
                  className="w-full bg-boston-gold/5 text-boston-gold border border-boston-gold/20 rounded-2xl py-3.5 px-4 h-12 font-black tracking-widest" 
                />
              </View>
            )}

            <TouchableOpacity 
              onPress={handleAuth} disabled={loading}
              style={{ backgroundColor: theme.primary, shadowColor: theme.primary }}
              className="w-full rounded-2xl py-4 items-center mt-4 shadow-lg active:opacity-90"
            >
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-black font-black uppercase text-xs tracking-[0.2em] mr-2">
                    {isLogin ? 'Iniciar Sesión' : 'Registrarme'}
                  </Text>
                  <ArrowRight size={16} color="black" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center py-2">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                {isLogin ? '¿No tienes cuenta? ' : '¿Ya eres socio? '}
                <Text style={{ color: theme.secondary }}>{isLogin ? 'Registrate' : 'Inicia Sesión'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-center text-white/20 text-[8px] font-medium uppercase tracking-[0.4em] mt-10 z-10">
          Powered by Boston Technology &copy; 2024
        </Text>
      </ScrollView>
    </View>
  );
}
