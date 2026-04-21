import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, ArrowRight, ShieldAlert, ChevronLeft } from 'lucide-react-native';
import api from '../lib/api';
import { StatusBar } from 'expo-status-bar';

export default function ResetPasswordScreen() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const handleReset = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'El código debe ser de 6 dígitos');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      Alert.alert('¡Éxito!', 'Tu contraseña ha sido actualizada.', [
        { text: 'Ir al Login', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Código incorrecto o expirado';
      Alert.alert('Error', msg);
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-20">
        
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10 mb-8"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>

        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-boston-red/10 rounded-3xl items-center justify-center border border-boston-red/20 mb-6">
            <ShieldAlert size={40} color="#ff4d4d" />
          </View>
          <Text className="text-3xl font-black text-white uppercase italic text-center text-red-500">Nueva Contraseña</Text>
          <Text className="text-white/40 text-center mt-4 px-6 leading-5 uppercase text-[10px] tracking-widest font-bold">
            Ingresa el código enviado a tu email y tu nueva contraseña
          </Text>
        </View>

        <View className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl mb-12">
          
          <View className="space-y-1.5 mb-6">
            <Text className="text-[10px] font-black text-white/30 uppercase ml-1 tracking-widest">Código de Seguridad</Text>
            <TextInput 
              value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} 
              placeholder="000000" keyboardType="numeric" placeholderTextColor="rgba(255,255,255,0.1)"
              className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-4 px-4 text-center text-2xl font-black tracking-[0.5em]" 
            />
          </View>

          <View className="space-y-1.5 mb-6">
            <Text className="text-[10px] font-black text-white/30 uppercase ml-1 tracking-widest">Nueva Contraseña</Text>
            <View className="relative justify-center">
              <View className="absolute left-4 z-10">
                <Lock size={16} color="rgba(255,255,255,0.2)" />
              </View>
              <TextInput 
                value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" 
                placeholderTextColor="rgba(255,255,255,0.1)" secureTextEntry
                className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-4 pl-11 pr-4 font-medium" 
              />
            </View>
          </View>

          <View className="space-y-1.5 mb-8">
            <Text className="text-[10px] font-black text-white/30 uppercase ml-1 tracking-widest">Confirmar Contraseña</Text>
            <View className="relative justify-center">
              <View className="absolute left-4 z-10">
                <Lock size={16} color="rgba(255,255,255,0.2)" />
              </View>
              <TextInput 
                value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" 
                placeholderTextColor="rgba(255,255,255,0.1)" secureTextEntry
                className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-4 pl-11 pr-4 font-medium" 
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleReset}
            disabled={loading}
            className="bg-boston-gold py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
          >
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <>
                <Text className="text-black font-black uppercase text-xs tracking-widest mr-2">Actualizar Contraseña</Text>
                <ArrowRight size={18} color="black" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
