import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { Gift, Star, Ticket, ArrowLeft, Loader2 } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';

type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
  imageUrl?: string;
};

export default function RewardsScreen() {
  const router = useRouter();
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; reward: Reward | null }>({ visible: false, reward: null });

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, rewardsData] = await Promise.all([
        api.get("/auth/me"),
        api.get("/rewards")
      ]);
      setUserPoints(userData.data.points);
      setRewards(rewardsData.data);
    } catch (err) {
      console.error("Error loading rewards data", err);
      setUserPoints(0);
    } finally {
      setLoading(false);
    }
  };

  const resolveImageUrl = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseUrl = api.defaults.baseURL || 'http://192.168.1.36:8080/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    return `${rootUrl}${url}`;
  };

  const handleRedeem = async (reward: Reward) => {
    setConfirmModal({ visible: false, reward: null });
    setRedeemingId(reward.id);
    try {
      const response = await api.post("/redemptions/generate", { rewardId: reward.id });
      // Redirect to QR page with the token
      router.push({
        pathname: '/reward-qr',
        params: { token: response.data.qrToken, reward: reward.name }
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al procesar el canje');
    } finally {
      setRedeemingId(null);
    }
  };

  const pts = userPoints ?? 0;
  const isDataLoading = userPoints === null || loading;

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="pt-16 pb-4 px-6 border-b border-white/5 bg-black/80 z-20 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="w-10 h-10 items-center justify-center rounded-full mr-3">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold tracking-tight">Catálogo de Premios</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-white/50 uppercase tracking-widest leading-none mb-1">Tus Puntos</Text>
          <View className="bg-boston-gold/10 px-3 py-1 rounded-full border border-boston-gold/20 flex-row items-center">
            <Star size={12} color="#D4AF37" fill="#D4AF37" className="mr-1.5" />
            <Text className="text-boston-gold font-black text-sm">
              {isDataLoading ? "..." : pts}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mb-6 bg-boston-red/10 p-6 rounded-3xl border border-boston-red/20 relative overflow-hidden">
           <View className="absolute top-0 right-0 w-32 h-32 bg-boston-red/20 blur-3xl opacity-50 rounded-full" />
           <Gift size={32} color="#ff4d4d" className="mb-3 relative z-10" />
           <Text className="text-white font-bold text-xl leading-tight relative z-10">
              Canjea tus puntos{'\n'}por experiencias.
           </Text>
           <Text className="text-white/60 text-xs mt-3 relative z-10">
              Acércate a la barra, muestra tu QR generado y disfruta.
           </Text>
        </View>

        {isDataLoading && (
          <View className="space-y-4">
            {[1, 2, 3].map(i => (
               <View key={i} className="h-28 bg-white/5 rounded-[2rem] border border-white/5 opacity-50" />
            ))}
          </View>
        )}

        <View className="space-y-4">
          {!isDataLoading && rewards.map((reward, idx) => {
            const canRedeem = pts >= reward.pointsRequired;
            const isRedeeming = redeemingId === reward.id;

            return (
              <View 
                key={reward.id}
                className={`flex-row items-center p-5 rounded-[2rem] border ${canRedeem ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-50'}`}
              >
                <View className="w-16 h-16 bg-[#111] rounded-2xl items-center justify-center mr-5 shadow-inner border border-white/5 overflow-hidden relative">
                  {reward.imageUrl ? (
                     <Image source={{ uri: resolveImageUrl(reward.imageUrl) || '' }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                  ) : (
                    <Text className="text-3xl relative z-10">
                       {reward.type === 'BEBIDA' ? '🍺' : reward.type === 'COMIDA' ? '🍔' : '🎫'}
                    </Text>
                  )}
                </View>
                
                <View className="flex-1 mr-2">
                  <Text className="text-[9px] text-[#ff4d4d] font-black uppercase tracking-widest">{reward.type}</Text>
                  <Text className="text-white font-bold text-base leading-tight mt-0.5">{reward.name}</Text>
                  <View className="flex-row items-center mt-1.5 opacity-80">
                     <Ticket size={12} color="#D4AF37" className="mr-1.5" />
                     <Text className="text-boston-gold font-black text-xs">{reward.pointsRequired} PTS</Text>
                  </View>
                  {!canRedeem && (
                    <Text className="text-white/30 text-[10px] mt-1.5">Te faltan {reward.pointsRequired - pts} pts</Text>
                  )}
                </View>

                <TouchableOpacity 
                  disabled={!canRedeem || isRedeeming}
                  onPress={() => setConfirmModal({ visible: true, reward })}
                  className={`px-4 py-3 rounded-xl flex-row items-center justify-center ${canRedeem ? 'bg-white shadow-lg' : 'bg-white/10'}`}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${canRedeem ? 'text-black' : 'text-white/30'}`}>Canjear</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {!isDataLoading && rewards.length === 0 && (
          <Text className="text-center text-white/20 uppercase font-black tracking-widest text-[10px] mt-20">
            No hay premios cargados en el catálogo aún.
          </Text>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={confirmModal.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
           {confirmModal.reward && (
             <View className="w-full bg-[#111] rounded-[2.5rem] p-8 border border-white/10 items-center">
                <Gift size={40} color="#D4AF37" className="mb-4" />
                <Text className="text-white text-xl font-black italic uppercase text-center mb-2">¿Confirmar Canje?</Text>
                <Text className="text-white/60 text-center text-sm leading-relaxed mb-8">
                  Estás a punto de canjear <Text className="font-bold text-white">{confirmModal.reward.name}</Text> por <Text className="text-boston-gold font-bold">{confirmModal.reward.pointsRequired} puntos</Text>.
                </Text>
                
                <View className="flex-row space-x-4 w-full">
                   <TouchableOpacity 
                     onPress={() => setConfirmModal({ visible: false, reward: null })}
                     className="flex-1 bg-white/5 py-4 rounded-2xl items-center border border-white/10"
                   >
                     <Text className="text-white/50 font-black text-xs uppercase tracking-widest">Cancelar</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     onPress={() => handleRedeem(confirmModal.reward!)}
                     className="flex-1 bg-boston-gold py-4 rounded-2xl items-center shadow-lg"
                   >
                     <Text className="text-black font-black text-xs uppercase tracking-widest">Confirmar</Text>
                   </TouchableOpacity>
                </View>
             </View>
           )}
        </View>
      </Modal>

    </View>
  );
}
