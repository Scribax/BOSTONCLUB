import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, ArrowRight, Mail } from 'lucide-react-native';
import api, { setAuthToken } from '../lib/api';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

export default function VerifyEmailScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const { email, pendingToken } = useLocalSearchParams<{ email: string; pendingToken: string }>();

  // Helper para hacer llamadas con el token pendiente (antes de guardarlo)
  const apiWithToken = (token: string) => axios.create({
    baseURL: api.defaults.baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'El código debe ser de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      // Usar el token pendiente si existe, sino usar la instancia normal
      if (pendingToken) {
        await apiWithToken(pendingToken).post('/auth/verify-email', { code });
      } else {
        await api.post('/auth/verify-email', { code });
      }

      // Guardamos el token AHORA que está verificado y vamos al dashboard
      if (pendingToken) {
        await setAuthToken(pendingToken);
        router.replace('/(tabs)');
      } else {
        Alert.alert('¡Éxito!', 'Tu correo ha sido verificado. Ya puedes ingresar.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Código incorrecto o expirado';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      if (pendingToken) {
        await apiWithToken(pendingToken).post('/auth/resend-verification');
      } else {
        await api.post('/auth/resend-verification');
      }
      Alert.alert('Código Enviado', 'Se ha enviado un nuevo código a tu correo.');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al reenviar el código';
      Alert.alert('Error', msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#050505] justify-center px-6"
    >
      <StatusBar style="light" />
      
      <View className="items-center mb-10">
        <View className="w-20 h-20 bg-boston-gold/10 rounded-3xl items-center justify-center border border-boston-gold/20 mb-6">
          <ShieldCheck size={40} color="#D4AF37" />
        </View>
        <Text className="text-3xl font-black text-white uppercase italic text-center">Verifica tu Cuenta</Text>
        <Text className="text-white/40 text-center mt-4 px-6 leading-5">
          Hemos enviado un código de 6 dígitos a su correo electrónico {email ? <Text className="text-boston-gold">{email}</Text> : ''}.
        </Text>
      </View>

      <View className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 text-center">Ingresa el código</Text>
        
        <TextInput 
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor="rgba(255,255,255,0.1)"
          keyboardType="numeric"
          className="w-full bg-black/40 text-white border border-white/5 rounded-2xl py-5 px-4 text-center text-3xl font-black tracking-[0.5em] mb-6"
        />

        <TouchableOpacity 
          onPress={handleVerify}
          disabled={loading || resending}
          className="bg-boston-gold py-4 rounded-2xl flex-row items-center justify-center mb-4"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <>
              <Text className="text-black font-black uppercase text-xs tracking-widest mr-2">Verificar Ahora</Text>
              <ArrowRight size={18} color="black" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleResend}
          disabled={loading || resending}
          className="py-2 items-center"
        >
          {resending ? (
            <ActivityIndicator color="#D4AF37" size="small" />
          ) : (
            <Text className="text-boston-gold text-[10px] font-black uppercase tracking-widest">
              ¿No recibiste el código? Reenviar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        onPress={() => router.replace('/login')}
        className="mt-8 self-center"
      >
        <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Volver al inicio</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
