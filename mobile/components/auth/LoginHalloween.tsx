import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Mail, Lock, Skull, Ghost, ArrowRight, User as UserIcon, Phone, Eye, EyeOff, Flame, Moon, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
import { LoginProps } from './types';

export default function LoginHalloween(props: LoginProps) {
  const {
    isLogin, setIsLogin, email, setEmail, password, setPassword,
    firstName, setFirstName, lastName, setLastName, dni, setDni,
    whatsapp, setWhatsapp, birthDateInput, setBirthDateInput,
    referralCode, setReferralCode, loading, showPassword, setShowPassword,
    videoUrl, theme, handleAuth, resolveVideoUrl
  } = props;

  return (
    <View className="flex-1 bg-[#0a050f]">
      <StatusBar style="light" />
      
      {videoUrl && (
        <VideoPlayer
          uri={resolveVideoUrl(videoUrl) || ''}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      {/* Dark Magical Overlays */}
      <View style={{ backgroundColor: theme.primary }} className="absolute top-0 right-0 w-80 h-80 opacity-[0.15] rounded-full blur-[100px]" />
      <View style={{ backgroundColor: '#6b21a8' }} className="absolute bottom-0 left-0 w-80 h-80 opacity-[0.15] rounded-full blur-[100px]" />
      <View className="absolute inset-0 bg-black/75" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-12" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-10 z-10">
          <View style={{ borderColor: `${theme.primary}4D` }} className="w-24 h-24 bg-[#0d0714] rounded-3xl items-center justify-center shadow-2xl border-2 mb-6">
            <Skull size={48} color={theme.primary} />
          </View>
          
          <View className="relative">
            <Text className="text-4xl font-black tracking-tight text-white uppercase text-center italic">
              Boston <Text style={{ color: theme.primary }}>Club</Text>
            </Text>
            <View className="absolute -top-4 -right-4">
              <Sparkles size={16} color={theme.primary} />
            </View>
          </View>

          <View className="flex-row items-center mt-3 space-x-2">
             <Moon size={12} color={theme.primary} className="opacity-50" />
             <Text style={{ color: theme.primary }} className="text-[11px] font-black tracking-[0.4em] uppercase opacity-90 mx-2">
               Aquelarre Premium
             </Text>
             <Moon size={12} color={theme.primary} className="opacity-50" />
          </View>
        </View>

        {/* Auth Box */}
        <View style={{ borderColor: `${theme.primary}33` }} className="w-full bg-[#0d0714]/80 border-2 rounded-[3rem] p-8 relative z-10 shadow-2xl overflow-hidden">
          <View className="gap-y-6">
            <View>
               <Text className="text-white text-xl font-black uppercase italic tracking-tighter mb-1">
                 {isLogin ? 'Entrar al Portal' : 'Unirse al Aquelarre'}
               </Text>
               <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">
                 {isLogin ? 'Ingresa tus credenciales oscuras' : 'Comienza tu pacto con Boston'}
               </Text>
            </View>

            {!isLogin && (
              <View className="gap-y-4">
                <View className="flex-row gap-x-4">
                  <View className="flex-1 gap-y-1.5">
                    <Text className="text-[9px] font-bold text-white/50 uppercase ml-1 tracking-widest">Nombre Terrenal</Text>
                    <TextInput 
                      value={firstName} onChangeText={setFirstName} placeholder="Juan" 
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-black/60 text-white border border-white/5 rounded-2xl py-4 px-4 h-14 font-medium" 
                    />
                  </View>
                  <View className="flex-1 gap-y-1.5">
                    <Text className="text-[9px] font-bold text-white/50 uppercase ml-1 tracking-widest">Apellido</Text>
                    <TextInput 
                      value={lastName} onChangeText={setLastName} placeholder="Perez"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="w-full bg-black/60 text-white border border-white/5 rounded-2xl py-4 px-4 h-14 font-medium" 
                    />
                  </View>
                </View>
                <View className="gap-y-1.5">
                  <Text className="text-[9px] font-bold text-white/50 uppercase ml-1 tracking-widest">Identidad Mortal (DNI)</Text>
                  <TextInput 
                    value={dni} onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))} 
                    placeholder="12345678" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.2)"
                    className="w-full bg-black/60 text-white border border-white/5 rounded-2xl py-4 px-4 h-14 font-bold tracking-[0.2em]" 
                  />
                </View>
                <View className="flex-row gap-x-4">
                  <View className="flex-[1.2] gap-y-1.5">
                    <Text className="text-[9px] font-bold text-white/50 uppercase ml-1 tracking-widest">Línea de Invocación</Text>
                    <View className="flex-row items-center bg-black/60 border border-white/5 rounded-2xl px-4 h-14">
                      <Phone size={14} color={theme.primary} className="mr-2" />
                      <TextInput 
                        value={whatsapp} onChangeText={(t) => setWhatsapp(t.replace(/\D/g, ''))} 
                        placeholder="1122334455" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.1)"
                        className="flex-1 text-white font-medium" 
                      />
                    </View>
                  </View>
                  <View className="flex-1 gap-y-1.5">
                    <Text className="text-[9px] font-bold text-white/50 uppercase ml-1 tracking-widest">Reencarnación</Text>
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
                      placeholder="DD/MM/AAAA" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.1)"
                      className="w-full bg-black/60 text-white border border-white/5 rounded-2xl py-4 px-4 h-14 font-medium" 
                    />
                  </View>
                </View>
              </View>
            )}

            <View className="gap-y-1.5">
              <Text className="text-[9px] font-bold text-white/50 uppercase ml-1 tracking-widest">Contacto Espiritual</Text>
              <View className="flex-row items-center bg-black/60 border border-white/5 rounded-2xl px-4 h-14">
                <Mail size={16} color={theme.primary} className="mr-3" />
                <TextInput 
                  value={email} onChangeText={setEmail} placeholder="email@ejemplo.com" 
                  autoCapitalize="none" keyboardType="email-address" placeholderTextColor="rgba(255,255,255,0.1)"
                  className="flex-1 text-white font-medium" 
                />
              </View>
            </View>

            <View className="gap-y-1.5">
              <Text className="text-[9px] font-bold text-white/50 uppercase ml-1 tracking-widest">Conjuro Secreto</Text>
              <View className="flex-row items-center bg-black/60 border border-white/5 rounded-2xl px-4 h-14">
                <Lock size={16} color={theme.primary} className="mr-3" />
                <TextInput 
                  value={password} onChangeText={setPassword} placeholder="••••••••" 
                  secureTextEntry={!showPassword} placeholderTextColor="rgba(255,255,255,0.1)"
                  className="flex-1 text-white font-medium" 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} color={theme.primary} /> : <Eye size={16} color={theme.primary} />}
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              <View className="gap-y-1.5">
                <Text style={{ color: theme.primary }} className="text-[9px] font-black uppercase ml-1 tracking-widest">Sello de Invocación (Opcional)</Text>
                <TextInput 
                  value={referralCode} onChangeText={setReferralCode} placeholder="ABC-123" 
                  autoCapitalize="characters" placeholderTextColor={`${theme.primary}33`}
                  className="w-full bg-black/60 text-white border rounded-2xl py-4 px-4 h-14 font-black tracking-widest" 
                  style={{ borderColor: `${theme.primary}33`, color: theme.primary }}
                />
              </View>
            )}

            <TouchableOpacity 
              onPress={handleAuth} disabled={loading}
              style={{ backgroundColor: theme.primary, shadowColor: theme.primary }}
              className="w-full rounded-3xl py-5 items-center mt-4 shadow-2xl active:scale-[0.98]"
            >
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-black font-black uppercase text-sm tracking-[0.2em] mr-3">
                    {isLogin ? 'Entrar al Portal' : 'Sellar Pacto'}
                  </Text>
                  <Flame size={18} color="black" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center py-2">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                {isLogin ? '¿Aún no eres un iniciado? ' : '¿Ya eres del aquelarre? '}
                <Text style={{ color: theme.primary }}>{isLogin ? 'Únete aquí' : 'Entra ahora'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-12 items-center opacity-30">
           <Text className="text-white text-[8px] font-black uppercase tracking-[0.5em] mb-2">
             Misterio Boston &copy; 2024
           </Text>
           <View className="flex-row gap-x-4">
              <Ghost size={12} color="white" />
              <Moon size={12} color="white" />
              <Skull size={12} color="white" />
           </View>
        </View>
      </ScrollView>
    </View>
  );
}
