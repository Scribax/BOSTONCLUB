import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Zap, Shirt, Star } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { HistoryProps } from './types';

const CELESTE = '#75AADB';
const GOLD    = '#F0C040';
const NAVY    = '#020B1A';

export default function HistoryArgentina(props: HistoryProps) {
  const router = useRouter();
  const { loading, refreshing, onRefresh, selectedMonth, setSelectedMonth, months, filteredHistory, stats, theme } = props;

  const getSourceIcon = (source: string, pointsGained: number) => {
    if (source.includes('RACHA') || source === 'STREAK_BONUS' || source === 'DAILY_CHECKIN')
      return <Zap size={20} color={GOLD} fill={GOLD} />;
    if (source === 'CANJE_PROMO' || pointsGained < 0)
      return <Trophy size={20} color={CELESTE} />;
    return <Star size={20} color={CELESTE} fill={CELESTE} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      <StatusBar style="light" />

      {/* Glow */}
      <View style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 999, backgroundColor: CELESTE, opacity: 0.06 }} />

      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24, backgroundColor: NAVY, zIndex: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={22} color={CELESTE} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <Star size={8} color={GOLD} fill={GOLD} />
              <Star size={8} color={GOLD} fill={GOLD} />
              <Star size={8} color={GOLD} fill={GOLD} />
            </View>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 }}>
              Planilla de Juego
            </Text>
            <Text style={{ color: CELESTE, fontSize: 8, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
              Historial de Gloria
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: `${CELESTE}22` }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
              Gloria Total
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' }}>{stats.total}</Text>
              <Text style={{ color: CELESTE, fontSize: 8, fontWeight: '900' }}>PTS</Text>
            </View>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: `${GOLD}22` }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
              Mejor Partido
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', fontStyle: 'italic' }}>{stats.bestMonth.slice(0, 7)}</Text>
              <Star size={10} color={GOLD} fill={GOLD} />
            </View>
          </View>
        </View>

        {/* Month filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
          {months.map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMonth(m)}
              style={{
                paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
                backgroundColor: selectedMonth === m ? CELESTE : 'transparent',
                borderWidth: 1, borderColor: selectedMonth === m ? CELESTE : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: selectedMonth === m ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CELESTE} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {filteredHistory.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
            <View style={{ width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <Text style={{ fontSize: 36 }}>🇦🇷</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.2)', marginTop: 20, textAlign: 'center', letterSpacing: 3, fontSize: 9, textTransform: 'uppercase', fontWeight: '900' }}>
              Sin movimientos este período
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, paddingTop: 8 }}>
            {filteredHistory.map((item, index) => {
              const isPositive = item.pointsGained > 0;
              const isRedeem   = item.source === 'CANJE_PROMO';
              const date       = new Date(item.createdAt);
              const dayStr     = date.toLocaleDateString();
              const prevDay    = index > 0 ? new Date(filteredHistory[index - 1].createdAt).toLocaleDateString() : null;

              return (
                <View key={item.id}>
                  {dayStr !== prevDay && (
                    <View style={{ marginTop: 16, marginBottom: 8, marginLeft: 4 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' }}>
                        {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{
                    backgroundColor: '#060D18', borderRadius: 24, padding: 18,
                    flexDirection: 'row', alignItems: 'center',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                  }}>
                    <View style={{
                      width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isPositive ? `${CELESTE}14` : 'rgba(239,68,68,0.1)',
                      borderWidth: 1, borderColor: isPositive ? `${CELESTE}22` : 'rgba(239,68,68,0.2)',
                    }}>
                      {getSourceIcon(item.source, item.pointsGained)}
                    </View>

                    <View style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: -0.3, marginBottom: 4 }} numberOfLines={1}>
                        {item.description || (isRedeem ? 'Canje de Trofeo' : isPositive ? 'Gloria Ganada' : 'Operación Boston')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isPositive ? CELESTE : '#EF4444' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} HS
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      {isRedeem ? (
                        <View style={{ backgroundColor: `${CELESTE}1A`, borderWidth: 1, borderColor: `${CELESTE}44`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                          <Text style={{ color: CELESTE, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>CANJE</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={{ color: isPositive ? '#fff' : '#EF4444', fontWeight: '900', fontSize: 18, fontStyle: 'italic' }}>
                            {isPositive ? '+' : ''}{item.pointsGained}
                          </Text>
                          <Text style={{ color: isPositive ? CELESTE : 'rgba(239,68,68,0.6)', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                            GLORIA
                          </Text>
                        </>
                      )}
                    </View>
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
