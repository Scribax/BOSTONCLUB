import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, Dimensions } from 'react-native';
import { Gift, Star, Ticket, X, Coffee, Pizza, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Reward, RewardsProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'ALL', label: 'Todos', icon: Sparkles },
  { id: 'COMIDA', label: 'Comida', icon: Pizza },
  { id: 'BEBIDA', label: 'Bebida', icon: Coffee },
  { id: 'OTRO', label: 'Más', icon: Gift },
];

export default function RewardsDefault({ userPoints, rewards, loading, theme }: RewardsProps) {
  const router = useRouter();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; reward: Reward | null }>({ visible: false, reward: null });

  const resolveImageUrl = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseUrl = api.defaults.baseURL || 'https://mybostonclub.com/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${rootUrl}${cleanUrl}`;
  };

  const handleRedeem = async (reward: Reward) => {
    setConfirmModal({ visible: false, reward: null });
    setRedeemingId(reward.id);
    try {
      const response = await api.post("/redemptions/generate", { rewardId: reward.id });
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
  const filteredRewards = selectedCategory === 'ALL' 
    ? rewards 
    : rewards.filter(r => r.type === selectedCategory);

  const featuredReward = rewards.length > 0 ? rewards[0] : null;

  if (loading && userPoints === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: 64, paddingHorizontal: 24 }}>
        {/* Header skeleton */}
        <View style={{ height: 20, width: '50%', backgroundColor: '#1a1a1a', borderRadius: 10, marginBottom: 8 }} />
        <View style={{ height: 12, width: '30%', backgroundColor: '#111', borderRadius: 8, marginBottom: 32 }} />
        {/* Card skeletons */}
        {[1, 2, 3].map(i => (
          <View key={i} style={{ height: 110, backgroundColor: '#111', borderRadius: 24, marginBottom: 16, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5, backgroundColor: '#1a1a1a', borderRadius: 24 }} />
            <View style={{ flexDirection: 'row', padding: 16, alignItems: 'center' }}>
              <View style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: '#222' }} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <View style={{ height: 14, width: '70%', backgroundColor: '#222', borderRadius: 8, marginBottom: 8 }} />
                <View style={{ height: 10, width: '50%', backgroundColor: '#1a1a1a', borderRadius: 6, marginBottom: 8 }} />
                <View style={{ height: 10, width: '35%', backgroundColor: '#1a1a1a', borderRadius: 6 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar style="light" />
      
      {/* Dynamic Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: 'black', zIndex: 50 }}>
         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
            <View>
               <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Puntos Boston</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 }}>{pts}</Text>
                  <Star size={16} color={theme.primary} fill={theme.primary} style={{ marginLeft: 8 }} />
               </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            >
               <Ticket size={20} color="white" />
            </TouchableOpacity>
         </View>

         {/* Category Tabs */}
         <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ marginTop: 24 }}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
         >
            {CATEGORIES.map((cat) => {
               const Icon = cat.icon;
               const isActive = selectedCategory === cat.id;
               return (
                  <TouchableOpacity 
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      backgroundColor: isActive ? theme.primary : 'rgba(255,255,255,0.05)',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isActive ? theme.primary : 'rgba(255,255,255,0.1)'
                    }}
                  >
                     <Icon size={14} color={isActive ? 'black' : 'rgba(255,255,255,0.5)'} />
                     <Text style={{ color: isActive ? 'black' : 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', marginLeft: 8 }}>{cat.label}</Text>
                  </TouchableOpacity>
               );
            })}
         </ScrollView>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
         {/* Featured Promo Card */}
         {selectedCategory === 'ALL' && featuredReward && (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setConfirmModal({ visible: true, reward: featuredReward })}
              style={{ marginHorizontal: 24, marginTop: 10, marginBottom: 30 }}
            >
               <View style={{ width: '100%', height: 200, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Image 
                    source={{ uri: resolveImageUrl(featuredReward.imageUrl) || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500' }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.8)', 'black']} 
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' }} 
                  />
                  <View style={{ position: 'absolute', top: 20, left: 20, backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                     <Text style={{ color: 'black', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', fontStyle: 'italic' }}>Destacado</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                     <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>{featuredReward.name}</Text>
                     <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                         <Ticket size={12} color={theme.primary} />
                         <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 12, marginLeft: 6 }}>{featuredReward.pointsRequired} PUNTOS</Text>
                     </View>
                  </View>
               </View>
            </TouchableOpacity>
         )}

         {/* Section Title */}
         <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1 }}>Catálogo de Premios</Text>
         </View>

         {/* Rewards List */}
         <View style={{ paddingHorizontal: 24, flexDirection: 'column' }}>
            {filteredRewards.map((reward, index) => {
               const canRedeem = pts >= reward.pointsRequired;
               const progress = Math.min(1, pts / reward.pointsRequired);
               
               return (
                  <View 
                    key={reward.id}
                    style={{ width: '100%', marginBottom: 16 }}
                  >
                     <TouchableOpacity 
                       activeOpacity={canRedeem ? 0.8 : 1}
                       onPress={() => canRedeem && setConfirmModal({ visible: true, reward })}
                       style={{ 
                         backgroundColor: '#0c0c0c', 
                         borderRadius: 20, 
                         borderWidth: 1, 
                         borderColor: canRedeem ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                         overflow: 'hidden',
                         opacity: canRedeem ? 1 : 0.6,
                         flexDirection: 'row',
                         height: 140
                       }}
                     >
                        {/* Left side: Image */}
                        <View style={{ width: 140, height: '100%', backgroundColor: '#1a1a1a', position: 'relative' }}>
                           {reward.imageUrl ? (
                              <Image source={{ uri: resolveImageUrl(reward.imageUrl) || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                           ) : (
                              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                 <Text style={{ fontSize: 50 }}>{reward.type === 'BEBIDA' ? '🍺' : '🍔'}</Text>
                              </View>
                           )}
                           
                           {/* Gradient to blend with background */}
                           <LinearGradient
                             colors={['transparent', 'rgba(12,12,12,1)']}
                             start={{ x: 0.5, y: 0 }}
                             end={{ x: 1, y: 0 }}
                             style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 30 }}
                           />
                        </View>

                        {/* Right side: Content */}
                        <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
                           <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 2, lineHeight: 20 }} numberOfLines={2}>
                              {reward.name}
                           </Text>
                           <Text style={{ color: theme.secondary || theme.primary, fontWeight: '900', fontSize: 14, textTransform: 'uppercase', marginBottom: 12 }}>
                              {reward.pointsRequired} PTS
                           </Text>
                           
                           {/* Progress Bar for non-redeemable items */}
                           {!canRedeem && (
                              <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                                 <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                              </View>
                           )}

                           <View style={{ 
                             paddingVertical: 10, 
                             backgroundColor: canRedeem ? `${theme.primary}22` : 'rgba(255,255,255,0.05)', 
                             borderRadius: 12, 
                             borderWidth: 1,
                             borderColor: canRedeem ? theme.primary : 'rgba(255,255,255,0.1)',
                             alignItems: 'center'
                           }}>
                              {redeemingId === reward.id ? (
                                 <ActivityIndicator size="small" color="white" />
                              ) : (
                                 <Text style={{ color: canRedeem ? 'white' : 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {canRedeem ? 'Canjear' : `Faltan ${reward.pointsRequired - pts}`}
                                 </Text>
                              )}
                           </View>
                        </View>
                     </TouchableOpacity>
                  </View>
               );
            })}
         </View>

         {filteredRewards.length === 0 && (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 }}>
               <Gift size={48} color="rgba(255,255,255,0.1)" />
               <Text style={{ color: 'rgba(255,255,255,0.3)', marginTop: 20, textAlign: 'center', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Sin premios en esta categoría</Text>
            </View>
         )}
      </ScrollView>

      {/* CONFIRMATION MODAL - Premium Style */}
      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={() => setConfirmModal({ visible: false, reward: null })}>
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            {confirmModal.reward && (
               <View style={{ width: '100%', backgroundColor: '#0c0c0c', borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <View style={{ width: '100%', height: 200 }}>
                     <Image source={{ uri: resolveImageUrl(confirmModal.reward.imageUrl) || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                     <LinearGradient colors={['transparent', 'rgba(12,12,12,0.6)', '#0c0c0c']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' }} />
                     
                     <TouchableOpacity 
                       onPress={() => setConfirmModal({ visible: false, reward: null })}
                       style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
                     >
                        <X size={20} color="white" />
                     </TouchableOpacity>
                  </View>

                  <View style={{ padding: 32, alignItems: 'center' }}>
                     <View style={{ backgroundColor: 'rgba(255,59,48,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 16 }}>
                        <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>Canje de Puntos</Text>
                     </View>
                     <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', textAlign: 'center' }}>{confirmModal.reward.name}</Text>
                     <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 }}>¿Confirmas el canje de este premio por {confirmModal.reward.pointsRequired} puntos?</Text>
                     
                     <TouchableOpacity 
                       onPress={() => handleRedeem(confirmModal.reward!)}
                      style={{ backgroundColor: theme.primary, width: '100%', paddingVertical: 22, borderRadius: 24, marginTop: 32, alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}
                     >
                        <Text style={{ color: 'black', fontWeight: '900', textTransform: 'uppercase', fontSize: 14, letterSpacing: 2 }}>Confirmar Canje</Text>
                     </TouchableOpacity>

                     <TouchableOpacity 
                       onPress={() => setConfirmModal({ visible: false, reward: null })}
                       style={{ marginTop: 20 }}
                     >
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Volver atrás</Text>
                     </TouchableOpacity>
                  </View>
                </View>
             )}
         </View>
      </Modal>
    </View>
  );
}
