import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, Dimensions, Pressable } from 'react-native';
import { Gift, Star, Ticket, ArrowLeft, Loader2, Info, ChevronRight, X, Flame, Coffee, Pizza, Sparkles } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';

type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: string;
  imageUrl?: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'ALL', label: 'Todos', icon: Sparkles },
  { id: 'COMIDA', label: 'Comida', icon: Pizza },
  { id: 'BEBIDA', label: 'Bebida', icon: Coffee },
  { id: 'OTRO', label: 'Más', icon: Gift },
];

export default function RewardsScreen() {
  const router = useRouter();
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; reward: Reward | null }>({ visible: false, reward: null });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
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
      <View style={{ flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar style="light" />
      
      {/* Dynamic Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, px: 24, backgroundColor: 'black', zIndex: 50 }}>
         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
            <View>
               <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Puntos Boston</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 }}>{pts}</Text>
                  <Star size={16} color="#FF3B30" fill="#FF3B30" style={{ marginLeft: 8 }} />
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
                      backgroundColor: isActive ? '#FF3B30' : 'rgba(255,255,255,0.05)',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isActive ? '#FF3B30' : 'rgba(255,255,255,0.1)'
                    }}
                  >
                     <Icon size={14} color={isActive ? 'white' : 'rgba(255,255,255,0.5)'} />
                     <Text style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', marginLeft: 8 }}>{cat.label}</Text>
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
                  <View style={{ position: 'absolute', top: 20, left: 20, backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                     <Text style={{ color: 'white', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', italic: true }}>Destacado</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                     <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>{featuredReward.name}</Text>
                     <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Ticket size={12} color="#FF3B30" />
                        <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 12, marginLeft: 6 }}>{featuredReward.pointsRequired} PUNTOS</Text>
                     </View>
                  </View>
               </View>
            </TouchableOpacity>
         )}

         {/* Section Title */}
         <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1 }}>Catálogo de Premios</Text>
         </View>

         {/* Rewards Grid */}
         <View style={{ paddingHorizontal: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {filteredRewards.map((reward, index) => {
               const canRedeem = pts >= reward.pointsRequired;
               const progress = Math.min(1, pts / reward.pointsRequired);
               
               return (
                  <Animated.View 
                    entering={FadeInDown.delay(index * 100)}
                    key={reward.id}
                    style={{ width: (SCREEN_WIDTH - 60) / 2, marginBottom: 20 }}
                  >
                     <TouchableOpacity 
                       activeOpacity={canRedeem ? 0.8 : 1}
                       onPress={() => canRedeem && setConfirmModal({ visible: true, reward })}
                       style={{ 
                         backgroundColor: '#0c0c0c', 
                         borderRadius: 24, 
                         borderWidth: 1, 
                         borderColor: canRedeem ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                         overflow: 'hidden',
                         opacity: canRedeem ? 1 : 0.6
                       }}
                     >
                        <View style={{ width: '100%', height: 140, backgroundColor: '#1a1a1a' }}>
                           {reward.imageUrl ? (
                              <Image source={{ uri: resolveImageUrl(reward.imageUrl) || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                           ) : (
                              <View style={{ flex: 1, alignItems: 'center', justifyCenter: 'center' }}>
                                 <Text style={{ fontSize: 40 }}>{reward.type === 'BEBIDA' ? '🍺' : '🍔'}</Text>
                              </View>
                           )}
                           
                           {/* Points overlay */}
                           <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                              <Text style={{ color: canRedeem ? '#FF3B30' : 'white', fontWeight: '900', fontSize: 9 }}>{reward.pointsRequired} PTS</Text>
                           </View>
                        </View>

                        <View style={{ padding: 12 }}>
                           <Text style={{ color: 'white', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', fontStyle: 'italic' }} numberOfLines={1}>{reward.name}</Text>
                           <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '500', marginTop: 2 }} numberOfLines={1}>{reward.description || 'Premio exclusivo'}</Text>
                           
                           {/* Progress Bar for non-redeemable items */}
                           {!canRedeem && (
                              <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                                 <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                              </View>
                           )}

                           <View style={{ 
                             marginTop: 12, 
                             paddingVertical: 8, 
                             backgroundColor: canRedeem ? '#FF3B30' : 'rgba(255,255,255,0.05)', 
                             borderRadius: 12, 
                             alignItems: 'center' 
                           }}>
                              {redeemingId === reward.id ? (
                                 <ActivityIndicator size="small" color="white" />
                              ) : (
                                 <Text style={{ color: canRedeem ? 'white' : 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>
                                    {canRedeem ? 'Canjear' : `Faltan ${reward.pointsRequired - pts}`}
                                 </Text>
                              )}
                           </View>
                        </View>
                     </TouchableOpacity>
                  </Animated.View>
               );
            })}
         </View>

         {filteredRewards.length === 0 && (
            <View style={{ alignItems: 'center', justifyCenter: 'center', marginTop: 60, paddingHorizontal: 40 }}>
               <Gift size={48} color="rgba(255,255,255,0.1)" />
               <Text style={{ color: 'rgba(255,255,255,0.3)', marginTop: 20, textAlign: 'center', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Sin premios en esta categoría</Text>
            </View>
         )}
      </ScrollView>

      {/* CONFIRMATION MODAL - Premium Style */}
      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={() => setConfirmModal({ visible: false, reward: null })}>
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            {confirmModal.reward && (
               <Animated.View entering={FadeInDown} style={{ width: '100%', backgroundColor: '#0c0c0c', borderRadius: 40, borderSize: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <View style={{ width: '100%', height: 200 }}>
                     <Image source={{ uri: resolveImageUrl(confirmModal.reward.imageUrl) || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                     <LinearGradient colors={['transparent', 'rgba(12,12,12,0.6)', '#0c0c0c']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' }} />
                     
                     <TouchableOpacity 
                       onPress={() => setConfirmModal({ visible: false, reward: null })}
                       style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyCenter: 'center' }}
                     >
                        <X size={20} color="white" />
                     </TouchableOpacity>
                  </View>

                  <View style={{ padding: 32, alignItems: 'center' }}>
                     <View style={{ backgroundColor: 'rgba(255,59,48,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 16 }}>
                        <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>Canje de Puntos</Text>
                     </View>
                     <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', textAlign: 'center' }}>{confirmModal.reward.name}</Text>
                     <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 }}>¿Confirmas el canje de este premio por {confirmModal.reward.pointsRequired} puntos?</Text>
                     
                     <TouchableOpacity 
                       onPress={() => handleRedeem(confirmModal.reward!)}
                       style={{ backgroundColor: '#FF3B30', width: '100%', paddingVertical: 22, borderRadius: 24, marginTop: 32, alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}
                     >
                        <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', fontSize: 14, letterSpacing: 2 }}>Confirmar Canje</Text>
                     </TouchableOpacity>

                     <TouchableOpacity 
                       onPress={() => setConfirmModal({ visible: false, reward: null })}
                       style={{ marginTop: 20 }}
                     >
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Volver atrás</Text>
                     </TouchableOpacity>
                  </View>
               </Animated.View>
            )}
         </View>
      </Modal>
    </View>
  );
}
