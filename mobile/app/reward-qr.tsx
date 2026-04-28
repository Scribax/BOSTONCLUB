import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Ticket } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { StatusBar } from 'expo-status-bar';
import api from '../lib/api';
import { Alert, ActivityIndicator } from 'react-native';

export default function RewardQRScreen() {
  const { token, reward } = useLocalSearchParams<{ token: string; reward: string }>();
  const router = useRouter();

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar Canje',
      '¿Estás seguro de que deseas cancelar este código QR y recuperar tus puntos?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.post('/redemptions/cancel', { qrToken: token });
              Alert.alert('Cancelado', 'Tu canje ha sido cancelado y tus puntos están disponibles nuevamente.');
              router.replace('/(tabs)/rewards');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Hubo un error al cancelar.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!token) {
    return (
      <View className="flex-1 bg-boston-black items-center justify-center p-6">
        <Text className="text-white text-xl">Sin token de canje válido.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-4 bg-white/10 rounded-xl">
          <Text className="text-white font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />

      {/* Glow */}
      <View className="absolute top-0 right-0 w-64 h-64 bg-boston-gold opacity-10 rounded-full blur-[80px]" />
      
      <View className="pt-16 pb-4 px-6 flex-row items-center relative z-10">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/5"
        >
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 relative z-10">
        <View className="flex-1 justify-center items-center py-6">
           <Animated.View style={{ opacity: fadeAnim }} className="w-full">
              {/* Premium Ticket Card */}
              <View className="bg-white/[0.03] border border-boston-gold/30 rounded-[3rem] p-8 items-center shadow-2xl overflow-hidden relative">
                 {/* Internal Ticket styling elements */}
                 <View className="absolute -left-6 top-1/2 w-12 h-12 bg-[#050505] rounded-full border border-boston-gold/20" />
                 <View className="absolute -right-6 top-1/2 w-12 h-12 bg-[#050505] rounded-full border border-boston-gold/20" />
                 
                 <View className="flex-row items-center w-full mb-8">
                   <View className="w-12 h-12 bg-green-500/20 rounded-full items-center justify-center mr-4 border border-green-500/30">
                     <CheckCircle2 size={24} color="#22c55e" />
                   </View>
                   <View className="flex-1">
                     <Text className="text-[10px] text-green-400 font-bold uppercase tracking-widest leading-none mb-1">
                       Canje Aprobado
                     </Text>
                     <Text className="text-white font-black text-xl italic uppercase tracking-tighter" numberOfLines={1}>
                       {reward}
                     </Text>
                   </View>
                 </View>

                 <View className="bg-white p-6 rounded-3xl shadow-xl mb-8">
                    <QRCode
                      value={token}
                      size={200}
                      color="#000"
                      backgroundColor="#fff"
                    />
                 </View>

                 <Text className="text-boston-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-center">
                   Instrucciones
                 </Text>
                 <Text className="text-white/50 text-xs font-medium text-center uppercase tracking-tight leading-relaxed">
                   Presenta este código QR en la barra de Boston Club para recibir tu premio.
                 </Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)')}
                className="w-full mt-8 rounded-[1.5rem] p-[1px] relative overflow-hidden"
              >
                 <View className="absolute inset-0 bg-boston-gold opacity-50" />
                 <View className="flex-row items-center justify-center bg-boston-black py-4 rounded-[1.5rem] border border-boston-gold/50 space-x-3">
                    <Ticket size={18} color="#D4AF37" />
                    <Text className="text-xs font-black text-white uppercase tracking-[0.2em]">Volver al Inicio</Text>
                 </View>
               </TouchableOpacity>

               {/* Botón de Cancelar Canje */}
               <TouchableOpacity 
                 activeOpacity={0.8}
                 onPress={handleCancel}
                 disabled={cancelling}
                 className="w-full mt-4 rounded-[1.5rem] p-[1px] relative overflow-hidden"
               >
                 <View className="absolute inset-0 bg-[#ff4d4d] opacity-20" />
                 <View className="flex-row items-center justify-center bg-boston-black py-4 rounded-[1.5rem] border border-[#ff4d4d]/30 space-x-3">
                    {cancelling ? (
                       <ActivityIndicator size="small" color="#ff4d4d" />
                    ) : (
                       <Text className="text-xs font-black text-[#ff4d4d] uppercase tracking-[0.2em]">Cancelar Canje</Text>
                    )}
                 </View>
               </TouchableOpacity>
           </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
