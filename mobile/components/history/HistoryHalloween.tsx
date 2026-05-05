import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, History, Flame, Ghost, Moon, Skull, Sparkles, Book, Skull as DeadIcon } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { HistoryProps } from './types';

export default function HistoryHalloween(props: HistoryProps) {
  const router = useRouter();
  const { history, loading, refreshing, onRefresh, selectedMonth, setSelectedMonth, months, filteredHistory, stats, theme } = props;

  const getSourceIcon = (source: string, pointsGained: number) => {
    if (source.includes('RACHA') || source === 'STREAK_BONUS' || source === 'DAILY_CHECKIN') return <Flame size={20} color={theme.primary} />;
    if (source === 'CANJE_PROMO' || pointsGained < 0) return <DeadIcon size={20} color={theme.primary} />;
    return <Ghost size={20} color="white" />;
  };

  return (
    <View className="flex-1 bg-[#0a050f]">
      <StatusBar style="light" />
      <View className="pt-16 pb-6 px-6 bg-[#0a050f] z-50">
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 bg-white/5 rounded-[1.2rem] items-center justify-center border border-white/10">
            <ArrowLeft size={24} color={theme.primary} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white font-black text-2xl italic uppercase tracking-tighter">Registro de Almas</Text>
            <Text style={{ color: theme.primary }} className="text-[9px] font-black uppercase tracking-[0.3em]">Cosecha & Sacrificios</Text>
          </View>
          <View className="w-12" />
        </View>

        <View className="flex-row gap-3">
          <View style={{ borderColor: `${theme.primary}33` }} className="flex-1 p-4 rounded-3xl border bg-[#0d0714]">
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Almas Cosechadas</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-2xl font-black italic">{stats.total}</Text>
              <Text style={{ color: theme.primary }} className="text-[8px] font-black ml-1">ALMAS</Text>
            </View>
          </View>
          <View style={{ borderColor: `${theme.primary}33` }} className="flex-1 p-4 rounded-3xl border bg-[#0d0714]">
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">Noche de Gloria</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-lg font-black italic">{stats.bestMonth.slice(0, 7)}</Text>
              <Sparkles size={10} color={theme.primary} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6 -mx-6 px-6" contentContainerStyle={{ gap: 8, paddingRight: 40 }}>
          {months.map(m => (
            <TouchableOpacity 
              key={m} onPress={() => setSelectedMonth(m)}
              className={`px-6 py-2.5 rounded-full border ${selectedMonth === m ? 'border-white bg-white' : 'border-white/10 bg-transparent'}`}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {filteredHistory.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center border border-white/5">
              <Book size={32} color={theme.primary} style={{ opacity: 0.3 }} />
            </View>
            <Text className="text-white/20 mt-6 text-center tracking-widest text-[9px] uppercase font-black">El libro está en blanco... aún</Text>
          </View>
        ) : (
          <View className="flex-col gap-3">
            {filteredHistory.map((item, index) => {
              const isPositive = item.pointsGained > 0;
              const isPromoRedeem = item.source === 'CANJE_PROMO';
              const date = new Date(item.createdAt);
              let dateHeader = null;
              const currentDayStr = date.toLocaleDateString();
              const prevItem = filteredHistory[index - 1];
              const prevDayStr = prevItem ? new Date(prevItem.createdAt).toLocaleDateString() : null;

              if (currentDayStr !== prevDayStr) {
                let label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }).toUpperCase();
                dateHeader = (
                  <View className="mt-4 mb-2 ml-2">
                    <Text className="text-white/20 text-[9px] font-black tracking-[0.3em] uppercase">{label}</Text>
                  </View>
                );
              }

              return (
                <View key={item.id}>
                  {dateHeader}
                  <TouchableOpacity activeOpacity={0.8} style={{ borderColor: `${theme.primary}20` }} className="bg-[#0d0714] border p-5 rounded-[2rem] flex-row items-center shadow-2xl">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isPositive ? 'bg-white/5' : 'bg-red-500/10'}`}>
                      {getSourceIcon(item.source, item.pointsGained)}
                    </View>
                    <View className="flex-1 ml-4 pr-2">
                      <Text className="text-white font-bold text-[13px] uppercase tracking-tight mb-1" numberOfLines={1}>
                        {item.description || (isPromoRedeem ? 'Sacrificio de Almas' : isPositive ? 'Cosecha Realizada' : 'Pacto Boston')}
                      </Text>
                      <View className="flex-row items-center">
                         <View style={{ backgroundColor: isPositive ? 'white' : theme.primary }} className="w-1.5 h-1.5 rounded-full mr-2" />
                         <Text className="text-white/30 text-[9px] uppercase tracking-widest font-black">
                           {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} HS • {item.source}
                         </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      {isPromoRedeem ? (
                        <View style={{ borderColor: `${theme.primary}66` }} className="border px-3 py-1 rounded-xl">
                          <Text style={{ color: theme.primary }} className="font-black text-[9px] uppercase tracking-widest">SACRIFICIO</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={{ color: isPositive ? 'white' : theme.primary }} className="font-black text-lg italic">
                            {isPositive ? '+' : ''}{item.pointsGained}
                          </Text>
                          <Text style={{ color: isPositive ? 'rgba(255,255,255,0.4)' : `${theme.primary}80` }} className="text-[8px] font-black uppercase tracking-widest">ALMAS</Text>
                        </>
                      )}
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
