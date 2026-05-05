import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, Lock, Trophy, ArrowRight, Shirt, Star, Eye, EyeOff } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
import { LoginProps } from './types';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginArgentina(props: LoginProps) {
  const {
    isLogin, setIsLogin, email, setEmail, password, setPassword,
    firstName, setFirstName, lastName, setLastName, dni, setDni,
    whatsapp, setWhatsapp, birthDateInput, setBirthDateInput,
    referralCode, setReferralCode, loading, showPassword, setShowPassword,
    videoUrl, theme, handleAuth, resolveVideoUrl
  } = props;

  return (
    <View className="flex-1 bg-[#03080F]">
      <StatusBar style="light" />
      
      {/* Background Video or Image fallback */}
      {videoUrl ? (
        <VideoPlayer
          uri={resolveVideoUrl(videoUrl) || ''}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={StyleSheet.absoluteFillObject} className="bg-[#03080F]" />
      )}
      
      {/* Argentina Theme Overlays */}
      <View style={{ backgroundColor: theme.primary }} className="absolute top-0 right-0 w-80 h-80 opacity-[0.15] rounded-full blur-[100px]" />
      <View style={{ backgroundColor: '#ffffff' }} className="absolute bottom-0 left-0 w-80 h-80 opacity-[0.05] rounded-full blur-[100px]" />
      <View className="absolute inset-0 bg-black/50" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
          className="px-6 py-12" 
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-8 z-10">
            <View style={{ borderColor: `${theme.primary}4D` }} className="w-24 h-24 bg-white/5 rounded-full items-center justify-center shadow-2xl border-4 mb-6">
              <Trophy size={48} color={theme.primary} />
            </View>
            
            <View className="items-center">
              <Text className="text-white text-[42px] font-black italic uppercase tracking-tighter text-center leading-[42px]">
                CONCENTRA<Text style={{ color: theme.primary }}>CIÓN</Text>
              </Text>
              <View className="flex-row items-center mt-2">
                 <Star size={12} color={theme.primary} fill={theme.primary} className="mx-1" />
                 <Star size={12} color={theme.primary} fill={theme.primary} className="mx-1" />
                 <Star size={12} color={theme.primary} fill={theme.primary} className="mx-1" />
              </View>
              <Text style={{ color: theme.primary }} className="text-[10px] font-black tracking-[0.4em] uppercase opacity-80 mt-3">
                BOSTON CLUB • MODO MUNDIAL
              </Text>
            </View>
          </View>

          <View className="w-full bg-black/60 border border-white/10 rounded-[3rem] p-7 relative z-10 shadow-2xl overflow-hidden">
            <View style={StyleSheet.absoluteFill} className="bg-black/10" />
            
            <View className="gap-y-5">
              {!isLogin && (
                <View className="gap-y-4">
                  <View className="flex-row gap-x-4">
                    <View className="flex-1 gap-y-1.5">
                      <Text className="text-[9px] font-black text-white/60 uppercase ml-1 tracking-widest">Nombre</Text>
                      <TextInput 
                        value={firstName} onChangeText={setFirstName} placeholder="JUAN" 
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        className="w-full bg-white/5 text-white border border-white/10 rounded-2xl py-3.5 px-4 h-12 font-bold" 
                      />
                    </View>
                    <View className="flex-1 gap-y-1.5">
                      <Text className="text-[9px] font-black text-white/60 uppercase ml-1 tracking-widest">Apellido</Text>
                      <TextInput 
                        value={lastName} onChangeText={setLastName} placeholder="PEREZ"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        className="w-full bg-white/5 text-white border border-white/10 rounded-2xl py-3.5 px-4 h-12 font-bold" 
                      />
                    </View>
                  </View>
                  <View className="gap-y-1.5">
                    <Text className="text-[9px] font-black text-white/60 uppercase ml-1 tracking-widest">DNI</Text>
                    <TextInput 
                      value={dni} onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))} 
                      placeholder="12345678" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-white/5 text-white border border-white/10 rounded-2xl py-3.5 px-4 h-12 font-black tracking-[0.2em]" 
                    />
                  </View>
                </View>
              )}

              <View className="gap-y-1.5">
                <Text className="text-[9px] font-black text-white/60 uppercase ml-1 tracking-widest">Correo del Jugador</Text>
                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-13">
                  <Mail size={18} color={theme.primary} className="mr-3" />
                  <TextInput 
                    value={email} onChangeText={setEmail} placeholder="MESSI@BOSTON.COM" 
                    autoCapitalize="none" keyboardType="email-address" placeholderTextColor="rgba(255,255,255,0.1)"
                    className="flex-1 text-white font-bold" 
                  />
                </View>
              </View>

              <View className="gap-y-1.5">
                <Text className="text-[9px] font-black text-white/60 uppercase ml-1 tracking-widest">Contraseña</Text>
                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-13">
                  <Lock size={18} color={theme.primary} className="mr-3" />
                  <TextInput 
                    value={password} onChangeText={setPassword} placeholder="••••••••" 
                    secureTextEntry={!showPassword} placeholderTextColor="rgba(255,255,255,0.1)"
                    className="flex-1 text-white font-bold" 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="rgba(255,255,255,0.3)" /> : <Eye size={18} color="rgba(255,255,255,0.3)" />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleAuth} disabled={loading}
                className="mt-4"
              >
                <LinearGradient 
                  colors={[theme.primary, theme.primaryDark]} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 0 }} 
                  style={{ shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                  className="w-full rounded-2xl py-4.5 items-center flex-row justify-center"
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <>
                      <Text className="text-black font-black uppercase text-sm tracking-widest mr-3 italic">
                        {isLogin ? 'Salir a la Cancha' : 'Fichar Jugador'}
                      </Text>
                      <Shirt size={18} color="black" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center py-2">
                <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                  {isLogin ? '¿No tienes dorsal? ' : '¿Ya eres del equipo? '}
                  <Text style={{ color: theme.primary }}>{isLogin ? 'Únete a la Scaloneta' : 'Inicia Concentración'}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-center text-white/10 text-[8px] font-black uppercase tracking-[0.5em] mt-12 z-10 italic">
            GLORIA ETERNA • BOSTON CLUB 2024
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
