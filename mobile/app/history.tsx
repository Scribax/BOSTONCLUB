import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, History, ArrowUpRight, ArrowDownRight, Gift, CalendarCheck, CheckCircle2 } from 'lucide-react-native';
import api from '../lib/api';
import { StatusBar } from 'expo-status-bar';

type HistoryEvent = {
  id: string;
  pointsGained: number;
  source: string;
  description: string | null;
  createdAt: string;
};

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/points/history');
      setHistory(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    await fetchHistory();
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const getSourceIcon = (source: string, pointsGained: number) => {
    if (source === 'DAILY_CHECKIN' || source === 'QR_CHECKIN') return <CalendarCheck size={20} color="#D4AF37" />;
    if (source === 'COMPRA_POSNET' || source === 'PURCHASE') return <CheckCircle2 size={20} color="#22c55e" />;
    if (source === 'PROMO') return <Gift size={20} color="#D4AF37" />;
    if (pointsGained < 0) return <ArrowDownRight size={20} color="#ff4d4d" />;
    return <ArrowUpRight size={20} color="#D4AF37" />;
  };

  if (loading && history.length === 0) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505] relative">
      <StatusBar style="light" />
      <View className="absolute top-0 left-0 w-80 h-80 bg-[#D4AF37] opacity-5 rounded-full blur-[100px]" />

      <View className="pt-16 pb-4 px-6 flex-row items-center border-b border-white/5 bg-[#050505]/90 z-20">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-12 h-12 bg-white/5 rounded-[1.2rem] items-center justify-center border border-white/10"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="ml-5 flex-1">
          <Text className="text-white font-black text-2xl italic uppercase tracking-tighter">Mi Actividad</Text>
          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em]">Historial de Puntos</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-6 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View className="items-center justify-center mt-32">
            <View className="w-24 h-24 bg-white/5 rounded-full items-center justify-center border border-white/10">
              <History size={40} color="rgba(255,255,255,0.2)" />
            </View>
            <Text className="text-white/40 mt-6 text-center tracking-[0.4em] text-[10px] uppercase font-black">No hay actividad reciente</Text>
          </View>
        ) : (
          <View className="flex-col gap-4 mb-8">
            {history.map((item) => {
              const isPositive = item.pointsGained > 0;
              return (
                <View key={item.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl flex-row items-center">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isPositive ? 'bg-boston-gold/10' : 'bg-boston-red-glow/10'}`}>
                    {getSourceIcon(item.source, item.pointsGained)}
                  </View>
                  <View className="flex-1 ml-4 pr-2">
                    <Text className="text-white font-bold text-sm uppercase tracking-wide mb-1" numberOfLines={2}>
                      {item.description || (isPositive ? 'Puntos Acreditados' : 'Canje de Puntos')}
                    </Text>
                    <Text className="text-white/40 text-[10px] uppercase tracking-widest font-black">
                      {new Date(item.createdAt).toLocaleDateString()} - {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className={`font-black text-lg ${isPositive ? 'text-boston-gold' : 'text-boston-red-glow'}`}>
                      {isPositive ? '+' : ''}{item.pointsGained}
                    </Text>
                    <Text className="text-white/30 text-[8px] uppercase tracking-[0.2em] font-bold">PTS</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
