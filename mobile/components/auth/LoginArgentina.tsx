import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, Lock, Trophy, ArrowRight, Shirt, Star, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
import { LoginProps } from './types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function LoginArgentina(props: LoginProps) {
  const {
    isLogin, setIsLogin, email, setEmail, password, setPassword,
    firstName, setFirstName, lastName, setLastName, dni, setDni,
    loading, showPassword, setShowPassword,
    videoUrl, theme, handleAuth, resolveVideoUrl
  } = props;

  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar style="light" />
      
      {/* Background Layer */}
      {videoUrl ? (
        <VideoPlayer
          uri={resolveVideoUrl(videoUrl) || ''}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={StyleSheet.absoluteFillObject} className="bg-[#020617]" />
      )}
      
      {/* Mesh Gradient Overlays */}
      <View style={{ backgroundColor: theme.primary }} className="absolute -top-20 -right-20 w-[400px] h-[400px] opacity-[0.1] rounded-full blur-[120px]" />
      <View style={{ backgroundColor: '#ffffff' }} className="absolute -bottom-20 -left-20 w-[400px] h-[400px] opacity-[0.05] rounded-full blur-[120px]" />
      <View className="absolute inset-0 bg-black/60" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
          className="px-6 py-12" 
          showsVerticalScrollIndicator={false}
        >
          {/* Top Badge */}
          <View className="items-center mb-12 z-10">
            <View className="flex-row items-center justify-center mb-4">
               <Star size={14} color="#E8C670" fill="#E8C670" className="mx-1" />
               <Star size={20} color="#E8C670" fill="#E8C670" className="mx-2" />
               <Star size={14} color="#E8C670" fill="#E8C670" className="mx-1" />
            </View>
            <Text className="text-white text-sm font-black tracking-[0.5em] uppercase opacity-40">Mundial Edition</Text>
          </View>

          {/* Login Card */}
          <View className="w-full relative z-10">
            <BlurView intensity={20} tint="dark" className="rounded-[40px] border border-white/10 overflow-hidden">
               <View className="p-8 bg-black/40">
                  <View className="mb-8">
                     <Text className="text-white text-3xl font-black uppercase italic tracking-tighter leading-tight">
                        {isLogin ? 'Camino a\nla Gloria' : 'Nueva\nInscripción'}
                     </Text>
                     <View className="h-1 w-12 bg-white/20 mt-4 rounded-full" />
                  </View>

                  <View className="gap-y-6">
                    {!isLogin && (
                      <View className="gap-y-4">
                        <View className="flex-row gap-x-4">
                          <View className="flex-1">
                            <TextInput 
                              value={firstName} onChangeText={setFirstName} placeholder="NOMBRE" 
                              placeholderTextColor="rgba(255,255,255,0.2)"
                              className="w-full bg-white/5 text-white border-b border-white/10 py-3 text-xs font-black tracking-widest" 
                            />
                          </View>
                          <View className="flex-1">
                            <TextInput 
                              value={lastName} onChangeText={setLastName} placeholder="APELLIDO"
                              placeholderTextColor="rgba(255,255,255,0.2)"
                              className="w-full bg-white/5 text-white border-b border-white/10 py-3 text-xs font-black tracking-widest" 
                            />
                          </View>
                        </View>
                        <TextInput 
                          value={dni} onChangeText={(t) => setDni(t.replace(/\D/g, '').slice(0, 8))} 
                          placeholder="DNI DE JUGADOR" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.2)"
                          className="w-full bg-white/5 text-white border-b border-white/10 py-3 text-xs font-black tracking-widest" 
                        />
                      </View>
                    )}

                    <View className="relative">
                      <TextInput 
                        value={email} onChangeText={setEmail} placeholder="CORREO ELECTRÓNICO" 
                        autoCapitalize="none" keyboardType="email-address" placeholderTextColor="rgba(255,255,255,0.2)"
                        className="w-full bg-white/5 text-white border-b border-white/10 py-3 pl-8 text-xs font-black tracking-widest" 
                      />
                      <View className="absolute left-0 top-3">
                         <Mail size={16} color={theme.primary} />
                      </View>
                    </View>

                    <View className="relative">
                      <TextInput 
                        value={password} onChangeText={setPassword} placeholder="CONTRASEÑA" 
                        secureTextEntry={!showPassword} placeholderTextColor="rgba(255,255,255,0.2)"
                        className="w-full bg-white/5 text-white border-b border-white/10 py-3 pl-8 pr-10 text-xs font-black tracking-widest" 
                      />
                      <View className="absolute left-0 top-3">
                         <Lock size={16} color={theme.primary} />
                      </View>
                      <TouchableOpacity className="absolute right-0 top-3" onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} color="rgba(255,255,255,0.2)" /> : <Eye size={16} color="rgba(255,255,255,0.2)" />}
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      onPress={handleAuth} disabled={loading}
                      className="mt-6"
                    >
                      <LinearGradient 
                        colors={[theme.primary, theme.primaryDark]} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }} 
                        className="w-full rounded-2xl py-5 items-center flex-row justify-center shadow-xl"
                      >
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Text className="text-white font-black uppercase text-xs tracking-[0.2em] mr-3">
                              {isLogin ? 'Ingresar al Estadio' : 'Fichar Jugador'}
                            </Text>
                            <ArrowRight size={16} color="white" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center mt-4">
                      <Text className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                        {isLogin ? '¿No tienes dorsal? ' : '¿Ya eres del equipo? '}
                        <Text style={{ color: theme.primary }}>{isLogin ? 'Únete' : 'Ingresa'}</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
               </View>
            </BlurView>
          </View>

          {/* Footer Info */}
          <View className="mt-16 items-center z-10">
             <View className="flex-row items-center bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <ShieldCheck size={12} color={theme.primary} />
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest ml-2">Acceso Seguro Boston Club</Text>
             </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
