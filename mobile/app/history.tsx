import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, History, ArrowUpRight, ArrowDownRight, Gift, CalendarCheck, CheckCircle2, Users, Flame } from 'lucide-react-native';
import api from '../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');

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

  const months = useMemo(() => {
    const m = ['TODOS'];
    history.forEach(item => {
      const monthName = new Date(item.createdAt).toLocaleString('es-ES', { month: 'long' }).toUpperCase();
      if (!m.includes(monthName)) m.push(monthName);
    });
    return m;
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (selectedMonth === 'TODOS') return history;
    return history.filter(item => 
      new Date(item.createdAt).toLocaleString('es-ES', { month: 'long' }).toUpperCase() === selectedMonth
    );
  }, [history, selectedMonth]);

  const stats = useMemo(() => {
    const total = history.reduce((acc, curr) => acc + (curr.pointsGained > 0 ? curr.pointsGained : 0), 0);
    
    // Find best month
    const monthTotals: { [key: string]: number } = {};
    history.forEach(item => {
      if (item.pointsGained > 0) {
        const m = new Date(item.createdAt).toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        monthTotals[m] = (monthTotals[m] || 0) + item.pointsGained;
      }
    });
    
    let bestMonth = '-';
    let maxPoints = 0;
    Object.keys(monthTotals).forEach(m => {
      if (monthTotals[m] > maxPoints) {
        maxPoints = monthTotals[m];
        bestMonth = m;
      }
    });

    return { total, bestMonth, maxPoints };
  }, [history]);

  const getSourceIcon = (source: string, pointsGained: number) => {
    if (source === 'DAILY_CHECKIN' || source === 'QR_CHECKIN') return <CalendarCheck size={20} color="#D4AF37" />;
    if (source === 'COMPRA_POSNET' || source === 'PURCHASE') return <CheckCircle2 size={20} color="#22c55e" />;
    if (source === 'PROMO' || source === 'REDEEM') return <Gift size={20} color="#D4AF37" />;
    if (source === 'REFERIDO') return <Users size={20} color="#D4AF37" />;
    if (source.includes('RACHA') || source === 'STREAK_BONUS') return <Flame size={20} color="#FF3B30" />;
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
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />
      
      {/* Header Sticky Section */}
      <View className="pt-16 pb-6 px-6 bg-[#050505] z-50">
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-12 h-12 bg-white/5 rounded-[1.2rem] items-center justify-center border border-white/10"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white font-black text-2xl italic uppercase tracking-tighter">Mi Actividad</Text>
            <Text className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em]">Status & Movimientos</Text>
          </View>
          <View className="w-12" />
        </View>

        {/* Stats Summary */}
        <View className="flex-row gap-3">
          <LinearGradient 
            colors={['#111', '#080808']} 
            className="flex-1 p-4 rounded-3xl border border-white/5"
          >
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Total Ganado</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-2xl font-black italic">{stats.total}</Text>
              <Text className="text-[#D4AF37] text-[8px] font-black ml-1">PTS</Text>
            </View>
          </LinearGradient>
          <LinearGradient 
            colors={['#111', '#080808']} 
            className="flex-1 p-4 rounded-3xl border border-white/5"
          >
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Mejor Mes</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-lg font-black italic">{stats.bestMonth.slice(0, 7)}</Text>
              <Text className="text-[#FF3B30] text-[8px] font-black ml-1">🔥</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Month Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mt-6 -mx-6 px-6"
          contentContainerStyle={{ gap: 8, paddingRight: 40 }}
        >
          {months.map(m => (
            <TouchableOpacity 
              key={m}
              onPress={() => setSelectedMonth(m)}
              className={`px-6 py-2.5 rounded-full border ${selectedMonth === m ? 'bg-white border-white' : 'bg-transparent border-white/10'}`}
            >
              <Text className={`text-[10px] font-black uppercase tracking-widest ${selectedMonth === m ? 'text-black' : 'text-white/40'}`}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {filteredHistory.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center border border-white/5">
              <History size={32} color="rgba(255,255,255,0.1)" />
            </View>
            <Text className="text-white/20 mt-6 text-center tracking-widest text-[9px] uppercase font-black">No hay movimientos en este periodo</Text>
          </View>
        ) : (
          <View className="flex-col gap-3">
            {filteredHistory.map((item, index) => {
              const isPositive = item.pointsGained > 0;
              const date = new Date(item.createdAt);
              
              // Helper to show "Hoy" or "Ayer"
              const today = new Date();
              const yesterday = new Date();
              yesterday.setDate(today.getDate() - 1);
              
              let dateHeader = null;
              const currentDayStr = date.toLocaleDateString();
              const prevItem = filteredHistory[index - 1];
              const prevDayStr = prevItem ? new Date(prevItem.createdAt).toLocaleDateString() : null;

              if (currentDayStr !== prevDayStr) {
                let label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }).toUpperCase();
                if (currentDayStr === today.toLocaleDateString()) label = 'HOY';
                else if (currentDayStr === yesterday.toLocaleDateString()) label = 'AYER';
                
                dateHeader = (
                  <View className="mt-4 mb-2 ml-2">
                    <Text className="text-white/20 text-[9px] font-black tracking-[0.3em] uppercase">{label}</Text>
                  </View>
                );
              }

              return (
                <View key={item.id}>
                  {dateHeader}
                  <TouchableOpacity activeOpacity={0.8} className="bg-[#0c0c0c] border border-white/5 p-5 rounded-[2rem] flex-row items-center shadow-2xl">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isPositive ? 'bg-white/5' : 'bg-red-500/10'}`}>
                      {getSourceIcon(item.source, item.pointsGained)}
                    </View>
                    <View className="flex-1 ml-4 pr-2">
                      <Text className="text-white font-bold text-[13px] uppercase tracking-tight mb-1" numberOfLines={1}>
                        {item.description || (isPositive ? 'Acreditación Boston' : 'Canje Boston')}
                      </Text>
                      <View className="flex-row items-center">
                         <View className={`w-1.5 h-1.5 rounded-full mr-2 ${isPositive ? 'bg-boston-gold' : 'bg-boston-red'}`} />
                         <Text className="text-white/30 text-[9px] uppercase tracking-widest font-black">
                           {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} HS • {item.source}
                         </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-black text-lg italic ${isPositive ? 'text-white' : 'text-boston-red'}`}>
                        {isPositive ? '+' : ''}{item.pointsGained}
                      </Text>
                      <Text className={`text-[8px] font-black uppercase tracking-widest ${isPositive ? 'text-boston-gold' : 'text-boston-red/50'}`}>PTS</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

