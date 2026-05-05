import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, useWindowDimensions } from 'react-native';
import { Trophy, Star, Shirt, MapPin, ClipboardList, ArrowRight, User as UserIcon, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayer } from '../../components/VideoPlayer';
import { FadeInView } from '../../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';
import { VipStatusModal } from '../VipStatusModal';
import { DashboardProps } from './types';
import { logout } from '../../lib/api';

export default function DashboardArgentina({
  user, banners, promoBanners, activeRedemption, settings, nextTier,
  loading, setLoading, errorStatus, refreshing, onRefresh, loadProfile,
  theme, router, isScreenFocused, currentPopup, showPopupModal, setShowPopupModal,
  resolveImageUrl, showGuide, setShowGuide, showBenefits, setShowBenefits,
  fetchVipBenefits, vipBenefits, vipBenefitsLoading, redeemingVipId, handleRedeemVipBenefit
}: DashboardProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  if (loading || (!user && !errorStatus)) {
    return (
      <View className="flex-1 bg-[#03080F] items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="text-white/50 uppercase font-black tracking-widest text-[10px] mt-4">Boston Club • Modo Mundial</Text>
      </View>
    );
  }

  if (errorStatus === 'connection') {
    return (
      <View className="flex-1 bg-[#03080F] items-center justify-center px-10">
        <View className="w-20 h-20 bg-white/5 rounded-3xl items-center justify-center border border-white/10 mb-6">
          <Text className="text-4xl">📡</Text>
        </View>
        <Text className="text-white text-xl font-black italic uppercase tracking-tighter text-center mb-2">Error de conexión</Text>
        <Text className="text-white/40 text-[10px] font-bold text-center mb-10 leading-4 uppercase tracking-widest">
          No pudimos conectar con los servidores de Boston. Revisa tus datos móviles o WiFi.
        </Text>

        <TouchableOpacity
          onPress={() => { setLoading(true); loadProfile(); }}
          style={{ backgroundColor: theme.primary }}
          className="py-4 px-10 rounded-2xl shadow-lg"
        >
          <Text className="text-black font-black uppercase text-xs tracking-widest">Reintentar Conexión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={async () => { await logout(); router.replace('/login'); }} className="mt-6">
          <Text className="text-white/20 font-bold uppercase text-[9px] tracking-widest underline">Cambiar de cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View className="flex-1 bg-[#03080F] relative">
      <StatusBar style="light" />

      {/* Argentina Aura */}
      <View style={{ backgroundColor: theme.primary }} className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-[120px]`} />

      <ScrollView
        className="flex-1 bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Top Bar */}
        <View className="w-full z-50 flex-row justify-between items-center px-6 pt-16 mb-6">
          <View style={{ backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` }} className="backdrop-blur-md px-4 py-2 rounded-xl border">
            <Text style={{ color: theme.primary }} className="font-black text-[10px] tracking-widest uppercase italic">Concentración Selección</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            className="w-11 h-11 rounded-full bg-black/50 border border-white/10 items-center justify-center shadow-2xl backdrop-blur-md"
          >
            <UserIcon size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Greeting Section */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center mb-1">
             <Star size={12} color={theme.primary} fill={theme.primary} className="mr-1" />
             <Star size={12} color={theme.primary} fill={theme.primary} className="mr-1" />
             <Star size={12} color={theme.primary} fill={theme.primary} />
          </View>
          <Text className="text-white/50 font-black text-xs uppercase tracking-[0.3em] mb-1">¡Muchachos, hola!</Text>
          <Text className="text-white text-4xl font-black italic uppercase tracking-tighter shadow-black drop-shadow-md">
            Capitán {user.firstName}
          </Text>
        </View>

        {/* Active Ticket Banner - World Cup Style */}
        {activeRedemption && (
          <FadeInView className="px-6 mt-2 mb-6 z-[60]">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/reward-qr',
                params: { token: activeRedemption.qrToken, reward: activeRedemption.title }
              })}
              style={{ backgroundColor: theme.primary }}
              className="rounded-[2.5rem] p-6 flex-row items-center shadow-2xl"
            >
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mr-4 border border-white/10">
                <Trophy size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-[9px] uppercase tracking-[0.3em] mb-1 italic">Trofeo Listo para Canje</Text>
                <Text className="text-white font-black text-2xl italic uppercase tracking-tighter leading-none" numberOfLines={1}>
                  {activeRedemption.title}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                <ArrowRight size={20} color="white" />
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* News Banners Grid */}
        <View className="px-6 flex-row flex-wrap justify-between">
          {banners.slice(0, 2).map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
              style={{ width: '48%', aspectRatio: 0.75 }}
              className="relative rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-[#080F1C] mb-4"
            >
              <Image source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500' }} className="w-full h-full opacity-90" resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(3,8,15,0.9)', '#03080f']} className="absolute inset-0" />
              <View className="absolute bottom-4 left-0 right-0 px-4 items-center">
                <Text className="text-white font-black text-base italic uppercase tracking-tighter text-center leading-tight mb-1" numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={{ backgroundColor: `${theme.primary}33` }} className="px-2 py-1 rounded-full border border-white/10">
                  <Text style={{ color: theme.primary }} className="font-bold text-[7px] uppercase tracking-widest">Leer Nota</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tier Card - Captain Style */}
        <FadeInView delay={400} className="px-6 mt-4">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setShowBenefits(true); fetchVipBenefits(); }}
            style={{ 
               backgroundColor: '#060D18', 
               borderColor: `${theme.primary}4D`, 
               borderWidth: 1, 
               borderRadius: 30, 
               padding: 25,
               shadowColor: theme.primary,
               shadowOffset: { width: 0, height: 10 },
               shadowOpacity: 0.3,
               shadowRadius: 15
            }}
          >
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: `${theme.primary}1A` }} className="w-14 h-14 rounded-2xl items-center justify-center mr-4 border border-white/5">
                  <Shirt size={28} color={theme.primary} />
                </View>
                <View>
                  <Text style={{ color: theme.primary }} className="font-black text-[9px] uppercase tracking-[0.2em] mb-1 italic">JERARQUÍA SELECCIÓN</Text>
                  <Text className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">
                    {user.membershipLevel.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: `${theme.primary}4D`, borderWidth: 1 }} className="rounded-2xl p-3 px-4 items-center">
                <Text className="text-white font-black text-xl italic tracking-tighter leading-none">{user.points}</Text>
                <Text style={{ color: theme.primary }} className="font-black text-[7px] uppercase tracking-widest mt-1">GLORIA</Text>
              </View>
            </View>

            <View className="relative h-2 bg-white/5 rounded-full w-full border border-white/5 overflow-hidden mb-6">
              <View style={{ width: `${nextTier?.currentProgress ?? 100}%`, backgroundColor: theme.primary }} className="absolute top-0 left-0 h-full" />
            </View>

            <View className="flex-row justify-between px-2">
               {[1,2,3].map(i => (
                 <Star key={i} size={14} color={nextTier?.currentProgress && nextTier.currentProgress > (i * 30) ? theme.primary : '#222'} fill={nextTier?.currentProgress && nextTier.currentProgress > (i * 30) ? theme.primary : 'transparent'} />
               ))}
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Action Grid */}
        <View className="px-6 mt-10">
          <View className="flex-row items-center justify-center mb-8">
            <View style={{ backgroundColor: `${theme.primary}33` }} className="h-[1px] w-12" />
            <Text style={{ color: theme.primary }} className="font-black uppercase tracking-[0.4em] text-[9px] mx-4">Entrenamiento</Text>
            <View style={{ backgroundColor: `${theme.primary}33` }} className="h-[1px] w-12" />
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity onPress={() => router.push('/rewards')} activeOpacity={0.8} className="w-[31%] aspect-square bg-[#080F1C] border border-white/10 rounded-[2.5rem] p-4 items-center justify-center">
              <Trophy size={26} color={theme.primary} className="mb-2" />
              <Text className="text-white font-black uppercase text-[9px] tracking-wider mb-1">Trofeos</Text>
              <Text className="text-white/30 font-bold uppercase text-[6px] text-center">Tus premios</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/events')} activeOpacity={0.8} className="w-[31%] aspect-square bg-[#080F1C] border border-white/10 rounded-[2.5rem] p-4 items-center justify-center">
              <MapPin size={26} color={theme.primary} className="mb-2" />
              <Text className="text-white font-black uppercase text-[9px] tracking-wider mb-1">Estadio</Text>
              <Text className="text-white/30 font-bold uppercase text-[6px] text-center">Partidos</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/history')} activeOpacity={0.8} className="w-[31%] aspect-square bg-[#080F1C] border border-white/10 rounded-[2.5rem] p-4 items-center justify-center">
              <ClipboardList size={26} color={theme.primary} className="mb-2" />
              <Text className="text-white font-black uppercase text-[9px] tracking-wider mb-1">Planilla</Text>
              <Text className="text-white/30 font-bold uppercase text-[6px] text-center">Tu juego</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Club Info Banner */}
        <FadeInView delay={600} className="px-6 mt-10">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/club-info')}
            style={{ minHeight: 90, borderRadius: 32, overflow: 'hidden', borderColor: `${theme.primary}33`, borderWidth: 1 }}
            className="relative bg-[#080F1C] shadow-2xl"
          >
            <View className="flex-row items-center p-5 justify-between">
              <View className="flex-row items-center flex-1">
                <View style={{ backgroundColor: `${theme.primary}1A`, borderColor: `${theme.primary}33` }} className="w-14 h-14 rounded-2xl items-center justify-center border mr-4">
                  <Star size={28} color={theme.primary} fill={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-black uppercase text-[12px] tracking-[0.2em] italic">¿Cómo alcanzar la Gloria?</Text>
                  <Text style={{ color: theme.primary }} className="font-bold text-[9px] uppercase tracking-widest mt-1">Aprende a sumar puntos y ser Leyenda</Text>
                </View>
              </View>
              <View style={{ backgroundColor: theme.primary }} className="w-10 h-10 rounded-2xl items-center justify-center shadow-lg">
                <ArrowRight size={18} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Promos */}
        {promoBanners.length > 0 && (
          <View className="mt-12 px-6">
             <Text className="text-white text-2xl font-black uppercase italic tracking-tighter mb-5">Promos de Selección</Text>
             {promoBanners.map(item => (
                <TouchableOpacity 
                  key={item.id}
                  activeOpacity={0.9} 
                  onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                  className="w-full h-36 bg-[#080F1C] border border-white/10 rounded-[2.5rem] mb-5 flex-row overflow-hidden shadow-2xl"
                >
                   <View className="flex-1 p-6 justify-center z-10">
                      <Text className="text-white text-xl font-black uppercase italic tracking-tighter leading-tight mb-2" numberOfLines={2}>
                         {item.title}
                      </Text>
                      <Text className="text-white/40 font-bold uppercase text-[9px] tracking-widest mb-3" numberOfLines={2}>
                         {item.description}
                      </Text>
                      <View style={{ backgroundColor: `${theme.primary}33` }} className="self-start px-3 py-1 rounded-full border border-white/5">
                        <Text style={{ color: theme.primary }} className="text-[7px] font-black uppercase">Ver Promo</Text>
                      </View>
                   </View>
                   <View className="w-1/3 h-full relative">
                      <Image source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500' }} className="w-full h-full" resizeMode="cover" />
                      <LinearGradient colors={['#080F1C', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="absolute inset-0" />
                   </View>
                </TouchableOpacity>
             ))}
          </View>
        )}
      </ScrollView>

      <VipStatusModal isVisible={showBenefits} onClose={() => setShowBenefits(false)} user={user} settings={settings} onRedeemSuccess={handleRedeemVipBenefit} />

      <Modal visible={showPopupModal} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center p-6">
          <View className="w-full max-w-md bg-[#060D18] rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
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
              <TouchableOpacity onPress={() => { setShowPopupModal(false); if (currentPopup?.id) router.push(`/banner/${currentPopup.id}`); }} style={{ backgroundColor: theme.primary }} className="w-full py-5 rounded-3xl">
                <Text className="text-white text-center font-black uppercase tracking-widest text-sm">{currentPopup?.benefits || 'IR A LA CANCHA'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
