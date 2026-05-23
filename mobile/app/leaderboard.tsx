import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Crown, ArrowLeft, Trophy } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { FadeInView } from '../components/FadeInView';

const LEVEL_COLORS: Record<string, string> = {
  'BRONCE': '#CC6633',
  'ORO': '#D4AF37',
  'PLATINO': '#E8E8E8',
  'DIAMANTE': '#67E8F9',
  'SÚPER VIP': '#FF3B30',
};

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const res = await api.get('/points/leaderboard');
          setData(res.data);
        } catch {}
        finally { setLoading(false); }
      };
      load();
    }, [])
  );

  const myEntry = data.find(u => u.isMe);

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />

      {/* Header */}
      <View className="pt-16 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center mr-4">
          <ArrowLeft size={18} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest">Socios Boston</Text>
          <Text className="text-white text-2xl font-black uppercase italic tracking-tighter">Ranking</Text>
        </View>
        <Trophy size={24} color={theme.secondary} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={theme.secondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Top 3 podium */}
          {data.length >= 3 && (
            <FadeInView delay={100} className="flex-row justify-center items-end gap-x-3 mt-6 mb-8">
              {/* 2nd */}
              <View className="items-center flex-1">
                <Text className="text-2xl mb-1">🥈</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl p-3 items-center w-full" style={{ height: 90 }}>
                  <Text className="text-white font-black text-[11px]" numberOfLines={1}>{data[1]?.firstName}</Text>
                  <Text className="text-white/40 text-[9px]">{data[1]?.lastName}</Text>
                  <Text style={{ color: LEVEL_COLORS[data[1]?.membershipLevel] || '#fff' }} className="font-black text-xs mt-1">{data[1]?.points.toLocaleString()} pts</Text>
                </View>
              </View>
              {/* 1st */}
              <View className="items-center flex-1">
                <Text className="text-3xl mb-1">🥇</Text>
                <View style={{ borderColor: `${theme.secondary}66`, borderWidth: 1, height: 110 }} className="bg-white/5 rounded-2xl p-3 items-center w-full justify-center">
                  <Crown size={16} color={theme.secondary} />
                  <Text className="text-white font-black text-[11px] mt-1" numberOfLines={1}>{data[0]?.firstName}</Text>
                  <Text className="text-white/40 text-[9px]">{data[0]?.lastName}</Text>
                  <Text style={{ color: theme.secondary }} className="font-black text-xs mt-1">{data[0]?.points.toLocaleString()} pts</Text>
                </View>
              </View>
              {/* 3rd */}
              <View className="items-center flex-1">
                <Text className="text-2xl mb-1">🥉</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl p-3 items-center w-full" style={{ height: 80 }}>
                  <Text className="text-white font-black text-[11px]" numberOfLines={1}>{data[2]?.firstName}</Text>
                  <Text className="text-white/40 text-[9px]">{data[2]?.lastName}</Text>
                  <Text style={{ color: LEVEL_COLORS[data[2]?.membershipLevel] || '#fff' }} className="font-black text-xs mt-1">{data[2]?.points.toLocaleString()} pts</Text>
                </View>
              </View>
            </FadeInView>
          )}

          {/* Full list */}
          <View className="gap-y-2">
            {data.map((item, index) => (
              <FadeInView key={item.id} delay={index * 50}>
                <View
                  className="flex-row items-center rounded-2xl px-4 py-3 border"
                  style={{
                    backgroundColor: item.isMe ? `${theme.secondary}18` : '#0c0c0c',
                    borderColor: item.isMe ? `${theme.secondary}44` : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Text className="text-white/40 font-black text-[11px] w-7">
                    {index < 3 ? RANK_ICONS[index] : `#${item.rank}`}
                  </Text>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-black text-[12px]">
                      {item.firstName} {item.lastName}
                      {item.isMe && <Text style={{ color: theme.secondary }}> (Vos)</Text>}
                    </Text>
                    <Text style={{ color: LEVEL_COLORS[item.membershipLevel] || '#fff' }} className="text-[9px] font-bold uppercase">
                      {item.membershipLevel}
                    </Text>
                  </View>
                  <Text className="text-white font-black text-sm">{item.points.toLocaleString()}<Text className="text-white/30 text-[9px]"> pts</Text></Text>
                </View>
              </FadeInView>
            ))}
          </View>

          {/* Mi posición si no está en top 10 */}
          {myEntry && myEntry.rank > 10 && (
            <View className="mt-6 border-t border-white/5 pt-4">
              <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest text-center mb-3">Tu posición</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-3 border"
                style={{ backgroundColor: `${theme.secondary}18`, borderColor: `${theme.secondary}44` }}
              >
                <Text className="text-white/40 font-black text-[11px] w-7">#{myEntry.rank}</Text>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-black text-[12px]">{myEntry.firstName} {myEntry.lastName} <Text style={{ color: theme.secondary }}>(Vos)</Text></Text>
                  <Text style={{ color: LEVEL_COLORS[myEntry.membershipLevel] || '#fff' }} className="text-[9px] font-bold uppercase">{myEntry.membershipLevel}</Text>
                </View>
                <Text className="text-white font-black text-sm">{myEntry.points.toLocaleString()}<Text className="text-white/30 text-[9px]"> pts</Text></Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
