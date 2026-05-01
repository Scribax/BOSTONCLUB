import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { History as HistoryIcon, User, Gift, Clock, CheckCircle2 } from 'lucide-react-native';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';

export default function StaffHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/redemptions/history');
      // Filtramos solo los que escaneó el usuario actual? 
      // Por ahora mostramos el historial global de staff
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching staff history", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      // Guard de rol: si un cliente llegara a esta pantalla, lo redirigimos
      api.get('/auth/me').then(res => {
        const role = res.data.role?.toUpperCase();
        if (role !== 'ADMIN' && role !== 'STAFF') {
          router.replace('/(tabs)');
          return;
        }
        // Limpiamos el historial anterior antes de recargar
        setHistory([]);
        fetchHistory();
      }).catch(() => router.replace('/login'));
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-4 overflow-hidden">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-boston-gold/10 items-center justify-center mr-3">
             <User size={18} color="#D4AF37" />
          </View>
          <View>
             <Text className="text-white font-bold text-sm uppercase italic tracking-tight">{item.userName}</Text>
             <Text className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-1">DNI: {item.userDni}</Text>
          </View>
        </View>
        <View className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
           <Text className="text-green-400 text-[8px] font-black uppercase">Validado</Text>
        </View>
      </View>

      <View className="flex-row items-center bg-black/40 rounded-2xl p-4 border border-white/5">
        <View className="w-8 h-8 rounded-lg bg-white/5 items-center justify-center mr-3">
          <Gift size={16} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-white/60 text-[9px] font-bold uppercase tracking-widest mb-1">Premio / Beneficio</Text>
          <Text className="text-white font-black text-sm uppercase italic" numberOfLines={1}>
            {item.details || 'Canje Boston'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-4">
        <Clock size={12} color="rgba(255,255,255,0.2)" />
        <Text className="text-white/20 text-[10px] font-bold ml-2">
           {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.time).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="pt-16 pb-6 px-6 border-b border-white/5 bg-black/80">
        <View className="flex-row items-center">
          <View className="p-3 bg-boston-gold/10 rounded-2xl mr-4 border border-boston-gold/20">
             <HistoryIcon size={24} color="#D4AF37" />
          </View>
          <View>
            <Text className="text-[10px] font-black text-boston-gold uppercase tracking-[0.3em] mb-1">Auditoría</Text>
            <Text className="text-2xl font-black uppercase tracking-tight text-white italic">HISTORIAL SCAN</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
               <HistoryIcon size={64} color="rgba(255,255,255,0.05)" />
               <Text className="text-white/20 font-bold uppercase tracking-widest mt-6 text-center text-xs">Aún no se han realizado{'\n'}validaciones hoy.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
