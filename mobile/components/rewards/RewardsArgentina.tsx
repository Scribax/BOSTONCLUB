import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, Dimensions } from 'react-native';
import { Trophy, Star, Zap, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Reward, RewardsProps } from './types';

const CELESTE = '#75AADB';
const GOLD    = '#F0C040';
const NAVY    = '#020B1A';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'ALL',    label: 'Todo',      icon: Star    },
  { id: 'COMIDA', label: 'Comidas',   icon: Zap     },
  { id: 'BEBIDA', label: 'Bebidas',   icon: Trophy  },
  { id: 'OTRO',   label: 'Extras',    icon: Star    },
];

export default function RewardsArgentina({ userPoints, rewards, loading, theme }: RewardsProps) {
  const router = useRouter();
  const [redeemingId, setRedeemingId]   = useState<string | null>(null);
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
      const response = await api.post('/redemptions/generate', { rewardId: reward.id });
      router.push({ pathname: '/reward-qr', params: { token: response.data.qrToken, reward: reward.name } });
    } catch (err: any) {
      Alert.alert('Sin Puntos Suficientes', err.response?.data?.message || 'No tienes suficiente gloria para canjear esto.');
    } finally {
      setRedeemingId(null);
    }
  };

  const pts = userPoints ?? 0;
  const filteredRewards = selectedCategory === 'ALL' ? rewards : rewards.filter(r => r.type === selectedCategory);
  const featuredReward  = rewards.length > 0 ? rewards[0] : null;

  if (loading && userPoints === null) {
    return (
      <View style={{ flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={CELESTE} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>
      <StatusBar style="light" />

      {/* Glow */}
      <View style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340, borderRadius: 999, backgroundColor: CELESTE, opacity: 0.07 }} />

      {/* Header */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, zIndex: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Star size={9} color={GOLD} fill={GOLD} />
              <Star size={9} color={GOLD} fill={GOLD} />
              <Star size={9} color={GOLD} fill={GOLD} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 }}>Tu Gloria</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ color: '#fff', fontSize: 38, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 }}>{pts.toLocaleString()}</Text>
              <Text style={{ color: CELESTE, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>pts</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={{ width: 50, height: 50, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <Text style={{ fontSize: 24 }}>🇦🇷</Text>
          </TouchableOpacity>
        </View>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: isActive ? `${CELESTE}22` : 'rgba(255,255,255,0.05)',
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                  borderWidth: 1, borderColor: isActive ? CELESTE : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={13} color={isActive ? CELESTE : 'rgba(255,255,255,0.4)'} />
                <Text style={{ color: isActive ? CELESTE : 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Featured card */}
        {selectedCategory === 'ALL' && featuredReward && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setConfirmModal({ visible: true, reward: featuredReward })}
            style={{ marginHorizontal: 24, marginBottom: 28 }}
          >
            <View style={{ width: '100%', height: 220, borderRadius: 32, overflow: 'hidden', borderWidth: 1.5, borderColor: `${CELESTE}55`, shadowColor: CELESTE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 }}>
              <Image
                source={{ uri: resolveImageUrl(featuredReward.imageUrl) || '' }}
                style={{ width: '100%', height: '100%', opacity: 0.85 }}
                resizeMode="cover"
              />
              <LinearGradient colors={['transparent', 'rgba(2,11,26,0.9)', NAVY]} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%' }} />
              <View style={{ position: 'absolute', top: 16, left: 16, backgroundColor: CELESTE, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 }}>
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>Trofeo Destacado</Text>
              </View>
              <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 6 }}>
                  {featuredReward.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Trophy size={13} color={CELESTE} />
                  <Text style={{ color: CELESTE, fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>{featuredReward.pointsRequired} GLORIA</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Section title */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 }}>
            Sala de Trofeos
          </Text>
        </View>

        {/* Rewards list */}
        <View style={{ paddingHorizontal: 24, gap: 14 }}>
          {filteredRewards.map(reward => {
            const canRedeem = pts >= reward.pointsRequired;
            const progress  = Math.min(1, pts / reward.pointsRequired);

            return (
              <TouchableOpacity
                key={reward.id}
                activeOpacity={canRedeem ? 0.85 : 1}
                onPress={() => canRedeem && setConfirmModal({ visible: true, reward })}
                style={{
                  backgroundColor: '#060D18', borderRadius: 24, borderWidth: 1,
                  borderColor: canRedeem ? `${CELESTE}44` : 'rgba(255,255,255,0.06)',
                  overflow: 'hidden', flexDirection: 'row', height: 130,
                  opacity: canRedeem ? 1 : 0.65,
                  shadowColor: canRedeem ? CELESTE : 'transparent',
                  shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
                }}
              >
                {/* Image */}
                <View style={{ width: 130, height: '100%', backgroundColor: '#020B1A' }}>
                  {reward.imageUrl ? (
                    <Image source={{ uri: resolveImageUrl(reward.imageUrl) || '' }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={40} color={`${CELESTE}44`} />
                    </View>
                  )}
                  <LinearGradient colors={['transparent', '#060D18']} start={{ x: 0.5, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 48 }} />
                </View>

                {/* Content */}
                <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -0.3, marginBottom: 2, lineHeight: 18 }} numberOfLines={2}>
                    {reward.name}
                  </Text>
                  <Text style={{ color: CELESTE, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                    {reward.pointsRequired.toLocaleString()} pts
                  </Text>

                  {!canRedeem && (
                    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                      <LinearGradient colors={[CELESTE, '#4A87C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${progress * 100}%` }} />
                    </View>
                  )}

                  <View style={{
                    paddingVertical: 8, alignItems: 'center', borderRadius: 12,
                    backgroundColor: canRedeem ? `${CELESTE}22` : 'rgba(255,255,255,0.04)',
                    borderWidth: 1, borderColor: canRedeem ? `${CELESTE}44` : 'rgba(255,255,255,0.08)',
                  }}>
                    {redeemingId === reward.id ? (
                      <ActivityIndicator size="small" color={CELESTE} />
                    ) : (
                      <Text style={{ color: canRedeem ? CELESTE : 'rgba(255,255,255,0.25)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>
                        {canRedeem ? 'CANJEAR' : `Faltan ${(reward.pointsRequired - pts).toLocaleString()}`}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredRewards.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏆</Text>
            <Text style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
              Sin trofeos en esta categoría
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={() => setConfirmModal({ visible: false, reward: null })}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,11,26,0.95)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {confirmModal.reward && (
            <View style={{ width: '100%', backgroundColor: '#060D18', borderRadius: 40, borderWidth: 1.5, borderColor: `${CELESTE}44`, overflow: 'hidden', shadowColor: CELESTE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 30 }}>
              <View style={{ width: '100%', height: 200, position: 'relative' }}>
                <Image source={{ uri: resolveImageUrl(confirmModal.reward.imageUrl) || '' }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(6,13,24,0.9)', '#060D18']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' }} />
                <TouchableOpacity
                  onPress={() => setConfirmModal({ visible: false, reward: null })}
                  style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 32, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 5, marginBottom: 16 }}>
                  <Star size={12} color={GOLD} fill={GOLD} />
                  <Star size={12} color={GOLD} fill={GOLD} />
                  <Star size={12} color={GOLD} fill={GOLD} />
                </View>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', textAlign: 'center', letterSpacing: -0.5, marginBottom: 12 }}>
                  {confirmModal.reward.name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                  ¿Confirmás canjear <Text style={{ color: CELESTE, fontWeight: '900' }}>{confirmModal.reward.pointsRequired.toLocaleString()} pts</Text> por este trofeo?
                </Text>

                <TouchableOpacity
                  onPress={() => handleRedeem(confirmModal.reward!)}
                  style={{ width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}
                >
                  <LinearGradient colors={[CELESTE, '#4A87C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 22, alignItems: 'center' }}>
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2.5, fontStyle: 'italic' }}>
                      ¡CANJEAR AHORA!
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setConfirmModal({ visible: false, reward: null })}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
