import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, BackHandler } from 'react-native';
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
      '¿Estás seguro de que deseas cancelar este código QR?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.post('/redemptions/cancel', { qrToken: token });
              Alert.alert('Cancelado', 'Tu código QR ha sido cancelado exitosamente.');
              router.replace('/(tabs)');
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

  const [isCompleted, setIsCompleted] = useState(false);
  const [totpTimestamp, setTotpTimestamp] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!isCompleted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTotpTimestamp(Date.now());
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCompleted]);

  useEffect(() => {
    // Handle Android back button
    const backAction = () => {
      if (!isCompleted && !cancelling) {
        Alert.alert("Canje Pendiente", "Tu código QR sigue activo. Puedes encontrarlo en la sección de 'Mis Canjes' si sales de esta pantalla.", [
          {
            text: "Entendido",
            onPress: () => router.back(),
            style: "cancel"
          },
          { text: "Seguir Aquí", onPress: () => null }
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Polling logic to check if admin scanned the QR
    if (token && !isCompleted) {
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/redemptions/status/${token}`);
          if (res.data?.status === 'COMPLETED') {
            setIsCompleted(true);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error checking status", err);
        }
      }, 3000); // Check every 3 seconds

      return () => {
        clearInterval(interval);
        backHandler.remove();
      };
    }

    return () => backHandler.remove();
  }, [token, isCompleted]);

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
                   <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 border ${isCompleted ? 'bg-green-500/20 border-green-500/30' : 'bg-boston-gold/20 border-boston-gold/30'}`}>
                     {isCompleted ? <CheckCircle2 size={24} color="#22c55e" /> : <Ticket size={24} color="#D4AF37" />}
                   </View>
                   <View className="flex-1">
                     <Text className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${isCompleted ? 'text-green-400' : 'text-boston-gold'}`}>
                       {isCompleted ? 'Premio Entregado' : 'Canje Aprobado'}
                     </Text>
                     <Text className="text-white font-black text-xl italic uppercase tracking-tighter" numberOfLines={2}>
                       {reward}
                     </Text>
                   </View>
                 </View>

                 {isCompleted ? (
                   <View className="py-10 items-center">
                     <Text className="text-white font-black text-3xl uppercase tracking-tighter mb-2 text-center">¡A Disfrutar!</Text>
                     <Text className="text-white/50 text-xs font-medium text-center uppercase tracking-widest leading-relaxed">Tu premio ha sido entregado exitosamente por el staff.</Text>
                   </View>
                 ) : (
                   <>
                     <View className="bg-white p-6 rounded-3xl shadow-xl mb-4 relative overflow-hidden border-4 border-boston-gold/20">
                        <QRCode
                          value={`${token}|${totpTimestamp}`}
                          size={200}
                          color="#000"
                          backgroundColor="#fff"
                        />
                     </View>

                     {/* TOTP Progress Bar */}
                     <View className="w-full mb-6 items-center">
                        <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">
                           Actualizando en <Text className="text-boston-gold">{timeLeft}s</Text>
                        </Text>
                        <View className="w-3/4 h-1 bg-white/10 rounded-full overflow-hidden">
                           <View 
                             className="h-full bg-boston-gold rounded-full" 
                             style={{ width: `${(timeLeft / 30) * 100}%` }} 
                           />
                        </View>
                     </View>

                     <Text className="text-boston-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-center">
                       Seguridad Anti-Fraude
                     </Text>
                     <Text className="text-white/50 text-xs font-medium text-center uppercase tracking-tight leading-relaxed">
                       Este código es dinámico y expira cada 30 seg. No son válidas las capturas de pantalla.
                     </Text>
                   </>
                 )}
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => router.replace('/(tabs)')}
                className="w-full mt-8 rounded-[1.5rem] p-[1px] relative overflow-hidden"
              >
                 <View className="absolute inset-0 bg-boston-gold opacity-50" />
                 <View className="flex-row items-center justify-center bg-boston-black py-4 rounded-[1.5rem] border border-boston-gold/50 space-x-3">
                    <Ticket size={18} color="#D4AF37" />
                    <Text className="text-xs font-black text-white uppercase tracking-[0.2em]">Volver al Inicio</Text>
                 </View>
               </TouchableOpacity>

               {/* Botón de Cancelar Canje */}
               {!isCompleted && (
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
               )}
           </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
