import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, Dimensions } from 'react-native';
import { Skull, Moon, Ghost, Flame, FlaskConical, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Reward, RewardsProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'ALL', label: 'Todo', icon: Moon },
  { id: 'COMIDA', label: 'Hechizos', icon: Flame },
  { id: 'BEBIDA', label: 'Pociones', icon: FlaskConical },
  { id: 'OTRO', label: 'Reliquias', icon: Skull },
];

export default function RewardsHalloween({ userPoints, rewards, loading, theme }: RewardsProps) {
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
      Alert.alert('Maldición', err.response?.data?.message || 'Tus poderes son débiles para invocar esto.');
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
      <View style={{ flex: 1, backgroundColor: '#0a050f', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a050f' }}>
      <StatusBar style="light" />
      
      {/* Spooky Aura Background */}
      <View style={{ backgroundColor: theme.primary }} className={`absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-[100px]`} />

      {/* Dynamic Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, zIndex: 50 }}>
         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
            <View>
               <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Tus Almas</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: 'white', fontSize: 36, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1, textShadowColor: theme.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>{pts}</Text>
                  <Ghost size={16} color={theme.primary} style={{ marginLeft: 8 }} />
               </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${theme.primary}66` }}
            >
               <Skull size={20} color={theme.primary} />
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
                      backgroundColor: isActive ? `${theme.primary}33` : 'rgba(255,255,255,0.05)',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isActive ? theme.primary : 'rgba(255,255,255,0.1)'
                    }}
                  >
                     <Icon size={14} color={isActive ? theme.primary : 'rgba(255,255,255,0.5)'} />
                     <Text style={{ color: isActive ? theme.primary : 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', marginLeft: 8, letterSpacing: 1 }}>{cat.label}</Text>
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
               <View style={{ width: '100%', height: 220, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: `${theme.primary}66`, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}>
                  <Image 
                    source={{ uri: resolveImageUrl(featuredReward.imageUrl) || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500' }} 
                    style={{ width: '100%', height: '100%', opacity: 0.8 }}
                    resizeMode="cover"
                  />
                  <LinearGradient 
                    colors={['transparent', 'rgba(10,5,15,0.8)', '#0a050f']} 
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' }} 
                  />
                  <View style={{ position: 'absolute', top: 20, left: 20, backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                     <Text style={{ color: 'black', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: 2 }}>Reliquia Suprema</Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
                     <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', textShadowColor: 'black', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>{featuredReward.name}</Text>
                     <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                         <Ghost size={12} color={theme.primary} />
                         <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 12, marginLeft: 6, letterSpacing: 1 }}>{featuredReward.pointsRequired} ALMAS</Text>
                     </View>
                  </View>
               </View>
            </TouchableOpacity>
         )}

         {/* Section Title */}
         <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1 }}>Mercado de Pociones</Text>
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
                         backgroundColor: '#0d0714', 
                         borderRadius: 24, 
                         borderWidth: 1, 
                         borderColor: canRedeem ? theme.primary : 'rgba(255,255,255,0.05)',
                         overflow: 'hidden',
                         opacity: canRedeem ? 1 : 0.6,
                         flexDirection: 'row',
                         height: 140,
                         shadowColor: canRedeem ? theme.primary : 'transparent',
                         shadowOffset: { width: 0, height: 4 },
                         shadowOpacity: canRedeem ? 0.3 : 0,
                         shadowRadius: 10
                       }}
                     >
                        {/* Left side: Image */}
                        <View style={{ width: 140, height: '100%', backgroundColor: '#05020a', position: 'relative' }}>
                           {reward.imageUrl ? (
                              <Image source={{ uri: resolveImageUrl(reward.imageUrl) || '' }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                           ) : (
                              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                 {reward.type === 'BEBIDA' ? <FlaskConical size={40} color={`${theme.primary}66`} /> : <Flame size={40} color={`${theme.primary}66`} />}
                              </View>
                           )}
                           
                           {/* Gradient to blend with background */}
                           <LinearGradient
                             colors={['transparent', '#0d0714']}
                             start={{ x: 0.5, y: 0 }}
                             end={{ x: 1, y: 0 }}
                             style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 40 }}
                           />
                        </View>

                        {/* Right side: Content */}
                        <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
                           <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 2, lineHeight: 20 }} numberOfLines={2}>
                              {reward.name}
                           </Text>
                           <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
                              {reward.pointsRequired} ALMAS
                           </Text>
                           
                           {/* Progress Bar for non-redeemable items */}
                           {!canRedeem && (
                              <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                                 <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: theme.primary, opacity: 0.5 }} />
                              </View>
                           )}

                           <View style={{ 
                             paddingVertical: 10, 
                             backgroundColor: canRedeem ? `${theme.primary}33` : 'rgba(255,255,255,0.05)', 
                             borderRadius: 12, 
                             borderWidth: 1,
                             borderColor: canRedeem ? theme.primary : 'rgba(255,255,255,0.1)',
                             alignItems: 'center'
                           }}>
                              {redeemingId === reward.id ? (
                                 <ActivityIndicator size="small" color={theme.primary} />
                              ) : (
                                 <Text style={{ color: canRedeem ? theme.primary : 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>
                                    {canRedeem ? 'PACTAR' : `Faltan ${reward.pointsRequired - pts}`}
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
               <Ghost size={48} color="rgba(255,255,255,0.1)" />
               <Text style={{ color: 'rgba(255,255,255,0.3)', marginTop: 20, textAlign: 'center', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>El caldero está vacío</Text>
            </View>
         )}
      </ScrollView>

      {/* CONFIRMATION MODAL - Spooky Style */}
      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={() => setConfirmModal({ visible: false, reward: null })}>
         <View style={{ flex: 1, backgroundColor: 'rgba(5,2,10,0.95)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            {confirmModal.reward && (
               <View style={{ width: '100%', backgroundColor: '#0d0714', borderRadius: 40, borderWidth: 1, borderColor: `${theme.primary}66`, overflow: 'hidden', shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 30 }}>
                  <View style={{ width: '100%', height: 220 }}>
                     <Image source={{ uri: resolveImageUrl(confirmModal.reward.imageUrl) || '' }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                     <LinearGradient colors={['transparent', 'rgba(13,7,20,0.8)', '#0d0714']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' }} />
                     
                     <TouchableOpacity 
                       onPress={() => setConfirmModal({ visible: false, reward: null })}
                       style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                     >
                        <X size={20} color={theme.primary} />
                     </TouchableOpacity>
                  </View>

                  <View style={{ padding: 32, alignItems: 'center' }}>
                     <View style={{ backgroundColor: `${theme.primary}33`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 16 }}>
                        <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Pacto de Sangre</Text>
                     </View>
                     <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', textAlign: 'center', textShadowColor: 'black', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>{confirmModal.reward.name}</Text>
                     <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 22 }}>¿Estás seguro de intercambiar {confirmModal.reward.pointsRequired} almas por este conjuro?</Text>
                     
                     <TouchableOpacity 
                       onPress={() => handleRedeem(confirmModal.reward!)}
                      style={{ backgroundColor: theme.primary, width: '100%', paddingVertical: 24, borderRadius: 24, marginTop: 32, alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 }}
                     >
                        <Text style={{ color: 'black', fontWeight: '900', textTransform: 'uppercase', fontSize: 15, letterSpacing: 3 }}>INBOCAR AHORA</Text>
                     </TouchableOpacity>

                     <TouchableOpacity 
                       onPress={() => setConfirmModal({ visible: false, reward: null })}
                       style={{ marginTop: 24 }}
                     >
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Huir cobardemente</Text>
                     </TouchableOpacity>
                  </View>
                </View>
             )}
         </View>
      </Modal>
    </View>
  );
}
