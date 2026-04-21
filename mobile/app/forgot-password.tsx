import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, ArrowRight, Mail, ChevronLeft } from 'lucide-react-native';
import api from '../lib/api';
import { StatusBar } from 'expo-status-bar';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Código Enviado', 'Si el correo está registrado, recibirás un código de 6 dígitos.', [
        { text: 'Continuar', onPress: () => router.push({ pathname: '/reset-password', params: { email } }) }
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#050505] px-6 pt-20"
    >
      <StatusBar style="light" />

      <TouchableOpacity 
        onPress={() => router.back()}
        className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10 mb-8"
      >
        <ChevronLeft size={24} color="white" />
      </TouchableOpacity>
      
      <View className="items-center mb-10">
        <View className="w-20 h-20 bg-boston-gold/10 rounded-3xl items-center justify-center border border-boston-gold/20 mb-6">
          <KeyRound size={40} color="#D4AF37" />
        </View>
        <Text className="text-3xl font-black text-white uppercase italic text-center">Recuperar Acceso</Text>
        <Text className="text-white/40 text-center mt-4 px-6 leading-5 uppercase text-[10px] tracking-widest font-bold">
          Ingresa tu email para recibir un código de seguridad
        </Text>
      </View>

      <View className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <View className="space-y-1.5 mb-6">
          <Text className="text-[10px] font-black text-white/30 uppercase ml-1 tracking-widest">Email Corporativo</Text>
          <View className="relative justify-center">
            <View className="absolute left-4 z-10">
              <Mail size={16} color="rgba(255,255,255,0.2)" />
            </View>
            <TextInput 
              value={email} onChangeText={setEmail} placeholder="tu@email.com" 
              placeholderTextColor="rgba(255,255,255,0.1)" autoCapitalize="none" keyboardType="email-address"
              className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-4 pl-11 pr-4 font-medium" 
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleRequestCode}
          disabled={loading}
          className="bg-boston-gold py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <>
              <Text className="text-black font-black uppercase text-xs tracking-widest mr-2">Enviar Código</Text>
              <ArrowRight size={18} color="black" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
