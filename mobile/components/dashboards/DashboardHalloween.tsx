import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, useWindowDimensions } from 'react-native';
import { Skull, Moon, Ghost, FlaskConical, ArrowRight, User as UserIcon, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
import { FadeInView } from '../../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';
import { VipStatusModal } from '../VipStatusModal';
import HappyHourExplosion from '../../components/HappyHourExplosion';
import { DashboardProps } from './types';
import { logout } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';

export default function DashboardHalloween({
  user, banners, promoBanners, activeRedemption, settings, nextTier,
  loading, setLoading, errorStatus, refreshing, onRefresh, loadProfile,
  router, isScreenFocused, currentPopup, showPopupModal, setShowPopupModal,
  resolveImageUrl, showGuide, setShowGuide, showBenefits, setShowBenefits,
  fetchVipBenefits, vipBenefits, vipBenefitsLoading, redeemingVipId, handleRedeemVipBenefit
}: DashboardProps) {
  const { theme, isHappyHour } = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  if (loading || (!user && !errorStatus)) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="text-white/50 uppercase font-black tracking-widest text-[10px] mt-4">Boston Club</Text>
      </View>
    );
  }

  if (errorStatus === 'connection') {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center px-10">
        <View className="w-20 h-20 bg-white/5 rounded-3xl items-center justify-center border border-white/10 mb-6">
          <Text className="text-4xl">📡</Text>
        </View>
        <Text className="text-white text-xl font-black italic uppercase tracking-tighter text-center mb-2">Error de conexión</Text>
        <Text className="text-white/40 text-[10px] font-bold text-center mb-10 leading-4 uppercase tracking-widest">
          No pudimos conectar con los servidores de Boston. Revisa tus datos móviles o WiFi.
        </Text>

        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            loadProfile();
          }}
          style={{ backgroundColor: theme.primary }}
          className="py-4 px-10 rounded-2xl shadow-lg"
        >
          <Text className="text-black font-black uppercase text-xs tracking-widest">Reintentar Conexión</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          className="mt-6"
        >
          <Text className="text-white/20 font-bold uppercase text-[9px] tracking-widest underline">Cambiar de cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View className="flex-1 bg-[#0a050f] relative">
      <StatusBar style="light" />

      {/* Halloween Aura */}
      <View style={{ backgroundColor: theme.primaryGlow || theme.primary }} className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-[120px]`} />

      {/* Happy Hour Confetti — FUERA del ScrollView */}
      {isHappyHour && <HappyHourExplosion />}

      <ScrollView
        className="flex-1 bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Top Bar */}
        <View className="w-full z-50 flex-row justify-between items-center px-6 pt-16 mb-6">
          <View className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <Text className="text-white font-black text-[10px] tracking-widest uppercase italic">Club del Terror</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            className="w-11 h-11 rounded-full bg-black/50 border border-white/10 items-center justify-center shadow-2xl backdrop-blur-md"
          >
            <UserIcon size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Happy Hour Banner pill */}
        {isHappyHour && (
          <FadeInView delay={300} style={{ width: '100%', zIndex: 40, alignItems: 'center', marginTop: -10, marginBottom: 16 }}>
            <View style={{ backgroundColor: '#9333EA', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, shadowColor: '#9333EA', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 15, borderWidth: 1, borderColor: '#FFF' }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>¡PACTO DE ALMAS! Almas x2</Text>
            </View>
          </FadeInView>
        )}

        {/* Greeting Section */}
        <View className="px-6 mb-6">
          <Text className="text-white/50 font-black text-xs uppercase tracking-[0.3em] mb-1">¡Truco o trato!</Text>
          <Text className="text-white text-4xl font-black italic uppercase tracking-tighter shadow-black drop-shadow-md">
            {user.firstName}
          </Text>
        </View>

        {/* Active Ticket Banner - Spooky Style */}
        {activeRedemption && (
          <FadeInView className="px-6 mt-2 mb-6 z-[60]">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/reward-qr',
                params: { token: activeRedemption.qrToken, reward: activeRedemption.title }
              })}
              style={{ 
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
              }}
              className="rounded-[2.5rem] p-6 flex-row items-center shadow-2xl"
            >
              <View className="w-14 h-14 rounded-2xl bg-black/20 items-center justify-center mr-4 border border-black/10">
                <Skull size={28} color="black" />
              </View>
              <View className="flex-1">
                <Text className="text-black font-black text-[9px] uppercase tracking-[0.3em] mb-1 italic">Invocación Lista</Text>
                <Text className="text-black font-black text-2xl italic uppercase tracking-tighter leading-none" numberOfLines={1}>
                  {activeRedemption.title}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-black/10 items-center justify-center">
                <ArrowRight size={20} color="black" />
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* Tarot Banners Grid */}
        <View className="px-6 flex-row flex-wrap justify-between">
          {banners.slice(0, 2).map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
              style={{ width: '48%', aspectRatio: 0.65 }}
              className="relative rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-[#0d0714] mb-4"
            >
              {item.mediaType === 'VIDEO' && item.videoUrl ? (
                isScreenFocused ? (
                  <VideoPlayer uri={resolveImageUrl(item.videoUrl) || ''} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Image source={{ uri: resolveImageUrl(item.imageUrl) || '' }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                )
              ) : (
                <Image
                  source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?q=80&w=1000' }}
                  className="w-full h-full opacity-80"
                  resizeMode="cover"
                />
              )}

              {/* Spooky Gradient Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(10,5,15,0.8)', '#0a050f']}
                className="absolute inset-0"
              />

              {/* Tarot Card Content */}
              <View className="absolute bottom-4 left-0 right-0 px-4 items-center">
                <Text className="text-white font-black text-lg italic uppercase tracking-tighter text-center leading-tight mb-1">
                  {item.title}
                </Text>
                <View style={{ backgroundColor: `${theme.primary}33` }} className="px-2 py-1 rounded-full border border-white/10">
                  <Text style={{ color: theme.primary }} className="font-bold text-[7px] uppercase tracking-widest">
                    Ver Predicción
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floating Tier Card - Spooky Style */}
        <FadeInView delay={400} className="px-6 mt-4">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setShowBenefits(true); fetchVipBenefits(); }}
            style={{
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 20,
              backgroundColor: '#120a1a', // Deep dark purple
              borderColor: `${theme.primary}4D`,
              borderWidth: 1,
              borderRadius: 30,
              padding: 20
            }}
          >
            {/* Header Section */}
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-black border border-white/20 items-center justify-center mr-4">
                  <Skull size={20} color={theme.primary} />
                </View>
                <View>
                  <Text className="text-white/40 font-black text-[9px] uppercase tracking-[0.2em] mb-1 italic">RANGO DE CULTO</Text>
                  <Text className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">
                    {user.membershipLevel.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderColor: `${theme.primary}4D`, borderWidth: 1 }} className="rounded-xl p-2 px-3 items-center">
                <Text className="text-white font-black text-lg italic tracking-tighter leading-none">{user.points}</Text>
                <Text style={{ color: theme.primary }} className="font-black text-[7px] uppercase tracking-widest mt-1">ALMAS</Text>
              </View>
            </View>

            {/* Spooky Progress Bar */}
            <View className="relative h-2 bg-black rounded-full w-full border border-white/10 overflow-hidden mb-6">
              <View style={{ width: `${nextTier?.currentProgress ?? 100}%`, backgroundColor: theme.primary }} className="absolute top-0 left-0 h-full" />
            </View>

            {/* Milestones */}
            <View className="flex-row justify-between px-4">
              <View className="items-center">
                <Ghost size={12} color={user.points >= (settings?.goldThreshold || 500) ? theme.primary : '#333'} className="mb-2" />
              </View>
              <View className="items-center">
                <Moon size={12} color={user.points >= (settings?.platinumThreshold || 1500) ? theme.primary : '#333'} className="mb-2" />
              </View>
              <View className="items-center">
                <Skull size={12} color={user.points >= (settings?.diamondThreshold || 5000) ? theme.primary : '#333'} className="mb-2" />
              </View>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Action Grid - Spooky Lore */}
        <View className="px-6 mt-10">
          <View className="flex-row items-center justify-center mb-6">
            <View className="h-[1px] w-10 bg-white/10" />
            <Text className="text-white/50 font-black uppercase tracking-[0.4em] text-[8px] mx-4">Tus Rituales</Text>
            <View className="h-[1px] w-10 bg-white/10" />
          </View>

          <View className="flex-row justify-between">
            {/* Pociones Card */}
            <TouchableOpacity onPress={() => router.push('/rewards')} activeOpacity={0.8} className="w-[31%] aspect-square bg-[#120a1a] border border-white/10 rounded-3xl p-3 items-center justify-center">
              <FlaskConical size={24} color={theme.primary} className="mb-2" />
              <Text className="text-white font-black uppercase text-[9px] tracking-wider mb-1">Pociones</Text>
              <Text className="text-white/30 font-bold uppercase text-[6px] text-center">Tus premios</Text>
            </TouchableOpacity>

            {/* Rituales Card */}
            <TouchableOpacity onPress={() => router.push('/events')} activeOpacity={0.8} className="w-[31%] aspect-square bg-[#120a1a] border border-white/10 rounded-3xl p-3 items-center justify-center">
              <Moon size={24} color={theme.primary} className="mb-2" />
              <Text className="text-white font-black uppercase text-[9px] tracking-wider mb-1">Rituales</Text>
              <Text className="text-white/30 font-bold uppercase text-[6px] text-center">Agenda</Text>
            </TouchableOpacity>

            {/* Apariciones Card */}
            <TouchableOpacity onPress={() => router.push('/history')} activeOpacity={0.8} className="w-[31%] aspect-square bg-[#120a1a] border border-white/10 rounded-3xl p-3 items-center justify-center">
              <Ghost size={24} color={theme.primary} className="mb-2" />
              <Text className="text-white font-black uppercase text-[9px] tracking-wider mb-1">Apariciones</Text>
              <Text className="text-white/30 font-bold uppercase text-[6px] text-center">Actividad</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spooky Guide Banner (Club Info) */}
        <FadeInView delay={600} className="px-6 mt-10">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/club-info')}
            style={{ minHeight: 90, borderRadius: 32, overflow: 'hidden', borderColor: `${theme.primary}33`, borderWidth: 1 }}
            className="relative bg-[#0d0714] shadow-2xl"
          >
            <View className="flex-row items-center p-5 justify-between">
              <View className="flex-row items-center flex-1">
                <View style={{ backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` }} className="w-14 h-14 rounded-2xl items-center justify-center border mr-4">
                  <Skull size={28} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-black uppercase text-[12px] tracking-[0.2em] italic">¿Cómo cosechar almas?</Text>
                  <Text style={{ color: theme.primary }} className="font-bold text-[9px] uppercase tracking-widest mt-1">Descubre el mapa del Inframundo Boston</Text>
                </View>
              </View>
              <View style={{ backgroundColor: theme.primary }} className="w-10 h-10 rounded-2xl items-center justify-center shadow-lg">
                <ArrowRight size={18} color="black" />
              </View>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Promos (Bottom List) */}
        {promoBanners.length > 0 && (
          <View className="mt-10 px-6">
             <Text className="text-white text-xl font-black uppercase italic tracking-tighter mb-4">Promos Malditas</Text>
             {promoBanners.map(item => (
                <TouchableOpacity 
                  key={item.id}
                  activeOpacity={0.9} 
                  onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                  className="w-full h-32 bg-[#120a1a] border border-white/10 rounded-3xl mb-4 flex-row overflow-hidden shadow-2xl"
                >
                   <View className="flex-1 p-5 justify-center z-10">
                      <Text className="text-white text-xl font-black uppercase italic tracking-tighter leading-tight mb-1" numberOfLines={2}>
                         {item.title}
                      </Text>
                      <Text className="text-white/50 font-bold uppercase text-[8px] tracking-widest mb-2" numberOfLines={2}>
                         {item.description}
                      </Text>
                   </View>
                   <View className="w-1/3 h-full relative">
                      <Image source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?q=80&w=500' }} className="w-full h-full" resizeMode="cover" />
                      <LinearGradient colors={['#120a1a', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="absolute inset-0" />
                   </View>
                </TouchableOpacity>
             ))}
          </View>
        )}
      </ScrollView>

      {/* Modals from DashboardDefault (can reuse VipStatusModal and Splash Popup with same logic) */}
      <VipStatusModal isVisible={showBenefits} onClose={() => setShowBenefits(false)} user={user} settings={settings} onRedeemSuccess={handleRedeemVipBenefit} />

      <Modal visible={showPopupModal} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center p-6">
          <View className="w-full max-w-md bg-[#0a0a0a] rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
            <TouchableOpacity onPress={() => setShowPopupModal(false)} className="absolute top-4 right-4 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/20">
              <X size={24} color="white" />
            </TouchableOpacity>
            {currentPopup?.mediaType === 'VIDEO' ? (
              <View className="w-full h-[500px]">
                <VideoPlayer uri={resolveImageUrl(currentPopup.videoUrl) || ''} />
              </View>
            ) : (
              <Image source={{ uri: resolveImageUrl(currentPopup?.imageUrl) || '' }} className="w-full h-[500px]" resizeMode="cover" />
            )}
            <View className="p-8 items-center bg-gradient-to-t from-black to-transparent absolute bottom-0 w-full">
              <Text className="text-2xl font-black text-white italic text-center uppercase tracking-tighter mb-2 shadow-black drop-shadow-md">{currentPopup?.title}</Text>
              <Text className="text-white/80 text-center font-bold text-xs mb-6 px-4">{currentPopup?.description}</Text>
              <TouchableOpacity onPress={() => { setShowPopupModal(false); if (currentPopup?.id) router.push(`/banner/${currentPopup.id}`); }} style={{ backgroundColor: theme.primary }} className="w-full py-4 rounded-2xl">
                <Text className="text-black text-center font-black uppercase tracking-widest text-sm">{currentPopup?.benefits || 'VER MÁS'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
