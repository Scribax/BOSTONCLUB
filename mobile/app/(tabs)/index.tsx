import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, Animated, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Crown, Star, Flame, Ticket, ArrowRight, User as UserIcon, MapPin, CreditCard, Gift, QrCode, History, X, Calendar, TrendingUp, Zap } from 'lucide-react-native';
import api, { getAuthToken, logout } from '../../lib/api';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Dimensions, LogBox, Alert } from 'react-native';
import { initNotifications, registerForPushNotificationsAsync } from '../../lib/notificationHelper';
import { VideoPlayer } from '../../components/VideoPlayer';
import { FadeInView } from '../../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
  '[Reanimated] Writing to `value` during component render'
]);

// Initialize notifications configuration (solo en nativo)
if (Platform.OS !== 'web') {
  initNotifications();
}

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  points: number;
  membershipLevel: string;
  streak?: number;
  lastStreakDate?: string;
  referralCode?: string;
};

type BannerEvent = {
  id: string;
  title: string;
  description: string;
  benefits?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType: 'IMAGE' | 'VIDEO';
};

// Componente helper para animaciones optimizadas removido de acá y movido a components/FadeInView.tsx

const StreakBadge = ({ streak }: { streak: number }) => {
  if (streak <= 0) return null;
  
  const multiplier = streak >= 7 ? 'x2.0' : (streak >= 3 ? 'x1.5' : '');

  return (
    <FadeInView 
      className="flex-row items-center bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-full px-3 py-1 self-start mt-2"
    >
      <Flame size={12} color="#FF3B30" fill="#FF3B30" />
      <Text className="text-[#FF3B30] font-black text-[9px] uppercase tracking-tighter ml-1.5">
        Racha {streak} {streak === 1 ? 'visita' : 'visitas'} {multiplier ? `• ${multiplier}` : ''}
      </Text>
    </FadeInView>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CAROUSEL_WIDTH = SCREEN_WIDTH - 48; // SCREEN_WIDTH minus px-6 (24px * 2)
  const [user, setUser] = useState<UserData | null>(null);
  const [banners, setBanners] = useState<BannerEvent[]>([]);
  const [promoBanners, setPromoBanners] = useState<BannerEvent[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [currentPromoIdx, setCurrentPromoIdx] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const [errorStatus, setErrorStatus] = useState<null | 'connection' | 'session'>(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [vipBenefits, setVipBenefits] = useState<any[]>([]);
  const [vipBenefitsLoading, setVipBenefitsLoading] = useState(false);
  const [redeemingVipId, setRedeemingVipId] = useState<string | null>(null);

  // FIX: New Architecture requiere que estas referencias sean estables (no recreadas en cada render)
  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentBannerIdx(viewableItems[0].index ?? 0);
    }
  });

  const onPromoViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPromoIdx(viewableItems[0].index ?? 0);
    }
  });

  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
  const bannerListRef = useRef<FlatList>(null);
  const promoListRef = useRef<FlatList>(null);

  // Auto-scroll effect para Banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        const nextIdx = (currentBannerIdx + 1) % banners.length;
        bannerListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [banners, currentBannerIdx]);

  // Auto-scroll effect para Promos
  useEffect(() => {
    if (promoBanners.length > 1) {
      const interval = setInterval(() => {
        const nextIdx = (currentPromoIdx + 1) % promoBanners.length;
        promoListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [promoBanners, currentPromoIdx]);

  const loadProfile = async () => {
    try {
      setErrorStatus(null);
      const token = await getAuthToken();
      if (!token) {
        return;
      }
      const [userDataRes, eventsRes, settingsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: null }))
      ]);
      
      setUser(userDataRes.data);
      setSettings(settingsRes.data);
      
      const allEvents = eventsRes.data || [];
      const topBanners = allEvents.filter((e: any) => e.type === "BANNER" && e.isActive !== false);
      const bottomPromos = allEvents.filter((e: any) => e.type === "PROMO" && e.isActive !== false);
      
      setBanners(topBanners);
      setPromoBanners(bottomPromos);
    } catch (err: any) {
      console.error('Load Profile Error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorStatus('session');
        await logout();
      } else {
        setErrorStatus('connection');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVipBenefits = async () => {
    setVipBenefitsLoading(true);
    try {
      const res = await api.get('/vip-benefits/me');
      setVipBenefits(res.data);
    } catch (err) {
      console.error('Error fetching VIP benefits', err);
    } finally {
      setVipBenefitsLoading(false);
    }
  };

  const handleRedeemVipBenefit = async (benefit: any) => {
    if (benefit.isLocked) {
      Alert.alert('Bloqueado 🔒', benefit.lockReason || 'Este beneficio no está disponible ahora');
      return;
    }
    setRedeemingVipId(benefit.id);
    try {
      const res = await api.post('/redemptions/generate', { vipBenefitId: benefit.id });
      setShowBenefits(false);
      router.push({
        pathname: '/reward-qr',
        params: { token: res.data.qrToken, reward: benefit.title }
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo generar el QR');
    } finally {
      setRedeemingVipId(null);
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

  const [activeRedemption, setActiveRedemption] = useState<any>(null);

  const fetchActiveRedemption = async () => {
    try {
      const res = await api.get('/redemptions/active');
      setActiveRedemption(res.data);
    } catch (err) {
      console.error('Error fetching active redemption', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      loadProfile().then(() => {
        // Ejecutar petición de notificaciones luego de cargar usuario (si no es Expo Go)
        registerForPushNotificationsAsync();
        fetchActiveRedemption();
      });
      return () => {
        setIsScreenFocused(false); // Pause video when leaving this tab
      };
    }, [])
  );



  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const calculateNextTier = () => {
    if (!user || !settings) return undefined;
    
    const pts = user.points;
    let nextTierName = "";
    let nextTierPts = 0;
    let currentTierPts = 0;

    if (pts < settings.goldThreshold) {
      nextTierName = "ORO";
      nextTierPts = settings.goldThreshold;
      currentTierPts = 0;
    } else if (pts < settings.platinumThreshold) {
      nextTierName = "PLATINO";
      nextTierPts = settings.platinumThreshold;
      currentTierPts = settings.goldThreshold;
    } else if (pts < settings.diamondThreshold) {
      nextTierName = "DIAMANTE";
      nextTierPts = settings.diamondThreshold;
      currentTierPts = settings.platinumThreshold;
    } else if (pts < settings.superVipThreshold) {
      nextTierName = "SÚPER VIP";
      nextTierPts = settings.superVipThreshold;
      currentTierPts = settings.diamondThreshold;
    } else {
      return undefined;
    }

    const progress = Math.min(100, Math.max(0, ((pts - currentTierPts) / (nextTierPts - currentTierPts)) * 100));
    
    return {
      name: nextTierName,
      pointsNeeded: nextTierPts,
      currentProgress: progress
    };
  };

  if (loading || (!user && !errorStatus)) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
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
          className="bg-boston-gold py-4 px-10 rounded-2xl shadow-lg shadow-boston-gold/20"
        >
          <Text className="text-black font-black uppercase text-xs tracking-widest">Reintentar Conexión</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={async () => {
            await api.post('/auth/logout').catch(() => {}); // Intentar avisar al server
            await logout();
          }}
          className="mt-6"
        >
          <Text className="text-white/20 font-bold uppercase text-[9px] tracking-widest underline">Cambiar de cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) return null; // Safety check

  const pts = user.points;

  const getAuraColor = () => {
    switch (user.membershipLevel) {
      case 'ORO': return 'bg-[#D4AF37]';
      case 'PLATINO': return 'bg-white';
      case 'DIAMANTE': return 'bg-cyan-400';
      case 'SÚPER VIP': return 'bg-[#FF3B30]';
      default: return 'bg-[#CC6633]';
    }
  };

  const banner = banners[currentBannerIdx];

  return (
    <View className="flex-1 bg-[#050505] relative">
      <StatusBar style="light" />
      
      {/* Background Aura */}
      <View className={`absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-[100px] ${getAuraColor()}`} />

      <ScrollView 
        className="flex-1 bg-[#050505]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        {/* Header & Hero Carousel Section */}
        <View className="relative">
          {/* Top Bar Overlay */}
          <View className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 pt-16">
            <View className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
               <Text className="text-white font-black text-[10px] tracking-widest uppercase italic">Boston Club</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              className="w-11 h-11 rounded-full bg-black/40 border border-white/10 items-center justify-center shadow-2xl backdrop-blur-md"
            >
              <UserIcon size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Hero Carousel */}
          <View style={{ height: Dimensions.get('window').height * 0.75 }}>
             <FlatList
                ref={bannerListRef}
                data={banners.length > 0 ? banners : [{ id: 'empty', title: 'Bienvenido', description: 'Cargando novedades...', mediaType: 'IMAGE' } as any]}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChangedRef.current}
                viewabilityConfig={viewabilityConfigRef.current}
                getItemLayout={(data, index) => ({
                   length: Dimensions.get('window').width,
                   offset: Dimensions.get('window').width * index,
                   index,
                })}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                    style={{ width: Dimensions.get('window').width, height: '100%' }} 
                    className="relative bg-[#0c0c0c]"
                  >
                    {item.mediaType === 'VIDEO' && item.videoUrl ? (
                      // Unmount completely when tab loses focus so the native video
                      // surface doesn't bleed through the camera scanner
                      isScreenFocused ? (
                        <VideoPlayer
                          uri={resolveImageUrl(item.videoUrl) || ''}
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Image
                          source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=1000' }}
                          style={{ width: '100%', height: '100%', opacity: 0.7 }}
                          resizeMode="cover"
                        />
                      )
                    ) : (
                      <Image 
                        source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=1000' }} 
                        className="w-full h-full opacity-70"
                        resizeMode="cover"
                      />
                    )}
                    
                    {/* Gradient Overlay */}
                    <View className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30" />

                    {/* Banner Content Overlay */}
                    <View className="absolute bottom-24 left-0 right-0 px-8">
                       <FadeInView delay={300}>
                          <View className="bg-white px-4 py-2 rounded-sm self-start mb-4 shadow-2xl">
                             <Text className="text-black font-black text-xs uppercase italic tracking-tighter">
                               ¡HOLA, {user.firstName.toUpperCase()}!
                             </Text>
                          </View>
                          <Text className="text-white text-5xl font-black uppercase italic tracking-tighter leading-[42px] mb-2 drop-shadow-2xl">
                             {item.title}
                          </Text>
                          <Text className="text-white/70 text-sm font-bold uppercase tracking-widest">
                             {item.description}
                          </Text>
                          <View className="bg-boston-gold/20 self-start px-3 py-1.5 rounded-full mt-4 border border-boston-gold/30">
                             <Text className="text-boston-gold font-black text-[8px] tracking-widest uppercase">Toca para ver más</Text>
                          </View>
                       </FadeInView>
                    </View>
                  </TouchableOpacity>
                )}
             />
             
             {/* Pagination Dots */}
             <View className="absolute bottom-16 w-full flex-row justify-center gap-2">
                {banners.map((_, idx) => (
                  <View key={idx} className={`h-1 rounded-full transition-all ${idx === currentBannerIdx ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
                ))}
             </View>
          </View>
        </View>

        {/* Active Ticket Banner - New Dynamic Component */}
        {activeRedemption && (
          <FadeInView className="px-6 mt-4 mb-2 z-[60]">
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/reward-qr',
                params: { token: activeRedemption.qrToken, reward: activeRedemption.title }
              })}
              className="bg-boston-gold rounded-[2rem] p-5 flex-row items-center shadow-2xl shadow-boston-gold/20"
            >
              <View className="w-12 h-12 rounded-2xl bg-black items-center justify-center mr-4">
                <QrCode size={24} color="#D4AF37" />
              </View>
              <View className="flex-1">
                <Text className="text-black font-black text-[9px] uppercase tracking-[0.2em] mb-1">Tienes un canje listo</Text>
                <Text className="text-black font-black text-xl italic uppercase tracking-tighter" numberOfLines={1}>
                  {activeRedemption.title}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-black/10 items-center justify-center">
                <ArrowRight size={20} color="black" />
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* Floating Tier Card - New Skeuomorphic Style */}
          <FadeInView delay={500} className="px-6 mt-4 z-50">
             <TouchableOpacity 
               activeOpacity={0.9}
               onPress={() => { setShowBenefits(true); fetchVipBenefits(); }}
               style={{
                 shadowColor: '#ff0000',
                 shadowOffset: { width: 0, height: 10 },
                 shadowOpacity: 0.2,
                 shadowRadius: 20,
                 elevation: 10
               }}
               className="bg-[#0a0a0a] rounded-[2.5rem] p-6 border border-white/5"
             >
                {/* Header Section */}
                <View className="flex-row justify-between items-start mb-6">
                   <View className="flex-row items-center">
                      {/* Round Logo Placeholder */}
                      <View className="w-14 h-14 rounded-full bg-black border-2 border-white/10 items-center justify-center mr-4">
                         <View className="items-center justify-center">
                            <Text className="text-white text-[8px] font-black italic tracking-tighter leading-none">BOSTON</Text>
                            <View className="h-[1px] w-8 bg-boston-red my-0.5" />
                            <Crown size={12} color="#D4AF37" />
                         </View>
                      </View>
                      
                      <View>
                          <View className="flex-row items-center">
                            <Text className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-1 italic">NIVEL</Text>
                          </View>
                          <Text className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none">
                             {user.membershipLevel.toUpperCase()}
                          </Text>
                          <TouchableOpacity onPress={() => router.push('/club-info')} activeOpacity={0.7}>
                            <StreakBadge streak={user.streak || 0} />
                          </TouchableOpacity>
                         <View className="flex-row items-center mt-2">
                            <View className="h-[1px] flex-1 bg-boston-red/30" />
                            <Star size={8} color="white" fill="white" className="mx-2" />
                            <View className="h-[1px] flex-1 bg-boston-red/30" />
                         </View>
                      </View>
                   </View>

                   {/* Points Pill */}
                   <View className="bg-black border border-boston-red/30 rounded-2xl p-2 flex-row items-center px-4 shadow-lg shadow-boston-red/20">
                      <View className="w-8 h-8 bg-boston-red rounded-full items-center justify-center mr-3">
                         <Star size={14} color="white" fill="white" />
                      </View>
                      <View>
                         <Text className="text-white font-black text-xl italic tracking-tighter leading-none">{user.points}</Text>
                         <Text className="text-boston-red font-black text-[8px] uppercase tracking-widest mt-0.5">PUNTOS</Text>
                      </View>
                      <ArrowRight size={12} color="white" className="ml-3 opacity-30" />
                   </View>
                </View>

                {/* New 3D Progress Bar */}
                <View className="relative mb-6">
                   <View className="h-4 bg-black rounded-full w-full border border-white/5 overflow-hidden">
                      {/* Track Background Texture */}
                      <View className="absolute inset-0 opacity-20 flex-row">
                         {[...Array(20)].map((_, i) => (
                           <View key={i} className="w-1 h-full bg-white/20 mr-4 -rotate-45" />
                         ))}
                      </View>
                      
                      {/* Progress Fill with Gloss */}
                      <View 
                        style={{ width: `${calculateNextTier()?.currentProgress || 100}%` }} 
                        className="absolute top-0 left-0 h-full"
                      >
                         <LinearGradient
                           colors={['#ff4d4d', '#cc0000', '#990000']}
                           start={{ x: 0, y: 0 }}
                           end={{ x: 0, y: 1 }}
                           style={{ flex: 1, borderRadius: 10 }}
                         />
                         {/* Gloss Overlay */}
                         <View className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-full mx-1 mt-0.5" />
                      </View>
                   </View>
                   
                   {/* Progress Thumb - Burger Icon Style */}
                   <View 
                     style={{ left: `${(calculateNextTier()?.currentProgress || 100) - 2}%` }}
                     className="absolute top-[-4px] w-6 h-6 rounded-full bg-boston-red border-2 border-[#1a1a1a] items-center justify-center shadow-xl shadow-boston-red/50"
                   >
                      <View className="w-2.5 h-0.5 bg-white rounded-full mb-0.5" />
                      <View className="w-3.5 h-1 bg-boston-gold rounded-sm mb-0.5" />
                      <View className="w-3 h-0.5 bg-white rounded-full" />
                   </View>
                </View>
                
                {/* Milestones */}
                <View className="flex-row justify-between px-2">
                   <View className="items-center">
                      <Star size={10} color={user.points >= (settings?.goldThreshold || 500) ? '#D4AF37' : '#333'} fill={user.points >= (settings?.goldThreshold || 500) ? '#D4AF37' : 'transparent'} className="mb-2" />
                      <Text className={`text-[10px] font-black uppercase italic ${user.points >= (settings?.goldThreshold || 500) ? 'text-white' : 'text-white/20'}`}>ORO</Text>
                   </View>
                   <View className="items-center">
                      <Star size={10} color={user.points >= (settings?.platinumThreshold || 1500) ? '#D4AF37' : '#333'} fill={user.points >= (settings?.platinumThreshold || 1500) ? '#D4AF37' : 'transparent'} className="mb-2" />
                      <Text className={`text-[10px] font-black uppercase italic ${user.points >= (settings?.platinumThreshold || 1500) ? 'text-white' : 'text-white/20'}`}>PLATINO</Text>
                   </View>
                   <View className="items-center">
                      <Star size={10} color={user.points >= (settings?.diamondThreshold || 5000) ? '#D4AF37' : '#333'} fill={user.points >= (settings?.diamondThreshold || 5000) ? '#D4AF37' : 'transparent'} className="mb-2" />
                      <Text className={`text-[10px] font-black uppercase italic ${user.points >= (settings?.diamondThreshold || 5000) ? 'text-white' : 'text-white/20'}`}>DIAMANTE</Text>
                   </View>
                </View>
             </TouchableOpacity>
          </FadeInView>
           {/* Premium Guide Banner */}
           <FadeInView delay={600} className="px-6 mt-8">
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => router.push('/club-info')}
                className="relative overflow-hidden"
              >
                 <LinearGradient
                   colors={['#D4AF37', '#8A6D3B']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 0 }}
                   style={{ borderRadius: 24, padding: 1, overflow: 'hidden' }}
                 >
                    <View className="bg-black/90 rounded-[23px] p-5 flex-row items-center justify-between">
                       <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-2xl bg-boston-gold/10 items-center justify-center border border-boston-gold/20 mr-4">
                             <Zap size={24} color="#D4AF37" />
                          </View>
                          <View className="flex-1">
                             <Text className="text-white font-black uppercase text-[11px] tracking-widest italic">¿Cómo sumar más puntos?</Text>
                             <Text className="text-boston-gold font-bold text-[8px] uppercase tracking-tighter mt-0.5">Domina el Club Boston y gana premios</Text>
                          </View>
                       </View>
                       <View className="bg-boston-gold px-4 py-2 rounded-xl">
                          <ArrowRight size={14} color="black" />
                       </View>
                    </View>
                 </LinearGradient>
              </TouchableOpacity>
           </FadeInView>

          {/* New Premium Action Grid */}
        <View className="px-6 mt-12">
           <View className="flex-row items-center justify-center mb-8">
              <View className="h-[1px] w-8 bg-white/10" />
              <Star size={8} color="#FF3B30" fill="#FF3B30" className="mx-3" />
              <Text className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Menú Boston VIP</Text>
              <Star size={8} color="#FF3B30" fill="#FF3B30" className="mx-3" />
              <View className="h-[1px] w-8 bg-white/10" />
           </View>
           
           <View className="flex-row justify-between">
              {/* Rewards Card */}
              <TouchableOpacity 
                onPress={() => router.push('/rewards')}
                activeOpacity={0.8}
                className="w-[31%] aspect-[0.7] bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-4 items-center justify-between shadow-2xl shadow-black"
              >
                 <View className="w-12 h-12 rounded-2xl border border-[#FF3B30]/30 items-center justify-center bg-white/5">
                    <Gift size={24} color="#FF3B30" />
                 </View>
                 <View className="items-center">
                    <Text className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Premios</Text>
                    <Text className="text-white/30 font-bold uppercase text-[7px] text-center">Canjea tus puntos</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-boston-red items-center justify-center">
                    <ArrowRight size={14} color="white" />
                 </View>
              </TouchableOpacity>

              {/* Agenda Card */}
              <TouchableOpacity 
                onPress={() => router.push('/events')}
                activeOpacity={0.8}
                className="w-[31%] aspect-[0.7] bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-4 items-center justify-between shadow-2xl shadow-black"
              >
                 <View className="w-12 h-12 rounded-2xl border border-[#FF3B30]/30 items-center justify-center bg-white/5 relative">
                    <Calendar size={24} color="#FF3B30" />
                    <View className="absolute top-1 right-1">
                       <Star size={8} color="#FF3B30" fill="#FF3B30" />
                    </View>
                 </View>
                 <View className="items-center">
                    <Text className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Agenda</Text>
                    <Text className="text-white/30 font-bold uppercase text-[7px] text-center">Eventos y promos</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-boston-red items-center justify-center">
                    <ArrowRight size={14} color="white" />
                 </View>
              </TouchableOpacity>

              {/* Activity Card */}
              <TouchableOpacity 
                onPress={() => router.push('/history')}
                activeOpacity={0.8}
                className="w-[31%] aspect-[0.7] bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-4 items-center justify-between shadow-2xl shadow-black"
              >
                 <View className="w-12 h-12 rounded-2xl border border-[#FF3B30]/30 items-center justify-center bg-white/5">
                    <TrendingUp size={24} color="#FF3B30" />
                 </View>
                 <View className="items-center">
                    <Text className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Actividad</Text>
                    <Text className="text-white/30 font-bold uppercase text-[7px] text-center">Tus movimientos</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-boston-red items-center justify-center">
                    <ArrowRight size={14} color="white" />
                 </View>
              </TouchableOpacity>
           </View>
        </View>

        {/* Promos Destacadas Section - Bottom Placement */}
        {promoBanners.length > 0 && (
           <View className="mt-12 mb-8">
              <View className="px-6 flex-row justify-between items-end mb-6">
                 <View>
                    <Text className="text-white/20 font-black text-[8px] uppercase tracking-[0.4em] mb-1">Especiales de hoy</Text>
                    <Text className="text-white text-2xl font-black uppercase italic tracking-tighter">Promos Destacadas</Text>
                 </View>
                 <TouchableOpacity className="flex-row items-center bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Text className="text-boston-red font-black text-[9px] uppercase tracking-widest mr-2">Ver Todas</Text>
                    <ArrowRight size={10} color="#FF3B30" />
                 </TouchableOpacity>
              </View>

              <View style={{ height: 180 }}>
                 <FlatList
                    ref={promoListRef}
                    data={promoBanners}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                    snapToInterval={SCREEN_WIDTH * 0.85 + 16}
                    decelerationRate="fast"
                    onViewableItemsChanged={onPromoViewableItemsChangedRef.current}
                    viewabilityConfig={viewabilityConfigRef.current}
                    getItemLayout={(data, index) => ({
                       length: SCREEN_WIDTH * 0.85 + 16,
                       offset: (SCREEN_WIDTH * 0.85 + 16) * index,
                       index,
                    })}
                    renderItem={({ item }: { item: any }) => (
                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => item.id !== 'empty' && router.push(`/banner/${item.id}`)}
                        style={{ width: SCREEN_WIDTH * 0.85, height: 160 }} 
                        className="relative bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl"
                      >
                      <View className="flex-1 relative">
                         {/* Image Content (Absolute background on the right) */}
                         <View className="absolute top-0 right-0 w-[60%] h-full">
                            <Image 
                              source={{ uri: resolveImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500' }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                            {/* Gradient to blend image with text area */}
                            <LinearGradient
                               colors={['#0c0c0c', 'rgba(12,12,12,0.7)', 'transparent']}
                               start={{ x: 0, y: 0.5 }}
                               end={{ x: 0.7, y: 0.5 }}
                               style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%' }}
                            />
                         </View>

                         {/* Text Content (Foreground) */}
                         <View className="flex-1 p-6 justify-center z-10">
                            <Text 
                              className="text-white text-4xl font-black uppercase italic tracking-tighter leading-[34px] mb-1"
                              numberOfLines={2}
                            >
                               {item.title}
                            </Text>
                            <Text className="text-white/80 font-black uppercase text-[10px] tracking-widest mb-4">
                               {item.description}
                            </Text>
                            <View className="bg-white/10 self-start px-2 py-1 rounded-md">
                               <Text className="text-white/40 font-bold uppercase text-[7px] tracking-widest">
                                  {item.condition || 'Válido hoy'}
                               </Text>
                            </View>
                         </View>
                      </View>
                      </TouchableOpacity>
                    )}
                 />
              </View>
              
              {/* Pagination Dots - Redesigned */}
              <View className="flex-row justify-center gap-2 mt-4">
                 {promoBanners.map((_, idx) => (
                   <View 
                     key={idx} 
                     className={`h-1.5 rounded-full transition-all ${idx === currentPromoIdx ? 'w-8 bg-boston-red' : 'w-2 bg-white/10'}`} 
                   />
                 ))}
              </View>
           </View>
        )}
      </ScrollView>

      {/* Guide Modal Modal */}
      <Modal visible={showGuide} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center p-6">
           <View className="w-full bg-[#0d0d0d] border border-white/10 rounded-[40px] p-8 overflow-hidden">
              <View className="absolute top-0 right-0 w-32 h-32 bg-boston-red rounded-full opacity-10 blur-[60px]" />
              <View className="flex-row justify-between items-start mb-8 z-10">
                 <View className="flex-1 pr-4">
                    <Text className="text-2xl font-black text-white italic uppercase tracking-tighter" numberOfLines={1}>Guía Boston</Text>
                    <Text className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.3em] mt-1" numberOfLines={1}>Cómo sumar y subir</Text>
                 </View>
                 <TouchableOpacity onPress={() => setShowGuide(false)} className="p-2 bg-white/5 rounded-full">
                    <X size={20} color="white" />
                 </TouchableOpacity>
              </View>

              <View className="flex-col gap-6">
                 <View>
                    <Text className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Regla de Oro</Text>
                    <View className="p-5 rounded-3xl bg-white/5 border border-white/5 flex-row items-center gap-4">
                       <Flame size={32} color="#ff4d4d" />
                       <View className="flex-1">
                          <Text className="text-xl font-black text-white italic" numberOfLines={1}>$1 = 1 PUNTO</Text>
                          <Text className="text-[9px] text-white/40 font-bold mt-1 uppercase leading-tight">Cada peso gastado es un punto para tu cuenta.</Text>
                       </View>
                    </View>
                 </View>

                 <View>
                    <Text className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Paso a paso</Text>
                    <View className="flex-col gap-4">
                      <View className="flex-row items-start gap-3">
                        <Text className="text-[#D4AF37] font-black italic text-xs mt-0.5">01</Text>
                        <Text className="text-[10px] text-white/70 font-medium leading-relaxed uppercase flex-1">Disfruta tu cena o bebida favorita en Boston.</Text>
                      </View>
                      <View className="flex-row items-start gap-3">
                        <Text className="text-[#D4AF37] font-black italic text-xs mt-0.5">02</Text>
                        <Text className="text-[10px] text-white/70 font-medium leading-relaxed uppercase flex-1">Al pagar, solicita tu código QR al staff o POSNET.</Text>
                      </View>
                      <View className="flex-row items-start gap-3">
                        <Text className="text-[#D4AF37] font-black italic text-xs mt-0.5">03</Text>
                        <Text className="text-[10px] text-white/70 font-medium leading-relaxed uppercase flex-1">Usa tu escáner para sumar puntos o pagar.</Text>
                      </View>
                    </View>
                 </View>
              </View>
           </View>
        </View>
      </Modal>

      {/* Benefits Modal - Motivational Redesign */}
       <Modal visible={showBenefits} transparent animationType="slide" onRequestClose={() => setShowBenefits(false)}>
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
            <View style={{ width: '100%', backgroundColor: '#0c0c0c', borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', height: '85%', overflow: 'hidden' }}>
               {/* Modal Header with Gradient */}
               <View style={{ height: 180, position: 'relative' }}>
                  <LinearGradient 
                    colors={['#FF3B30', '#881B16', '#0c0c0c']} 
                    style={{ position: 'absolute', inset: 0 }}
                  />
                  <View style={{ padding: 32, flex: 1, justifyContent: 'flex-end' }}>
                     <TouchableOpacity 
                       onPress={() => setShowBenefits(false)} 
                       style={{ position: 'absolute', top: 24, right: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}
                     >
                        <X size={20} color="white" />
                     </TouchableOpacity>
                     
                     <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Tu Estatus Actual</Text>
                     <Text style={{ color: 'white', fontSize: 44, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -2 }}>{user.membershipLevel}</Text>
                  </View>
               </View>

               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 32, paddingBottom: 60 }}>
                                     {/* Current Benefits - Dynamic VIP */}
                   <View style={{ marginBottom: 40 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                         <Crown size={18} color="#D4AF37" />
                         <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginLeft: 12, letterSpacing: 1 }}>Tus Beneficios</Text>
                      </View>
                      {vipBenefitsLoading ? (
                        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                          <ActivityIndicator color="#D4AF37" />
                        </View>
                      ) : vipBenefits.length === 0 ? (
                        <View style={{ padding: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, alignItems: 'center' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>No hay beneficios configurados para tu nivel</Text>
                        </View>
                      ) : (
                        <View style={{ gap: 12 }}>
                          {vipBenefits.filter(b => ["BRONCE", "ORO", "PLATINO", "DIAMANTE", "SÚPER VIP"].indexOf(b.level) <= ["BRONCE", "ORO", "PLATINO", "DIAMANTE", "SÚPER VIP"].indexOf(user.membershipLevel)).map((benefit: any) => (
                            <View key={benefit.id} style={{ backgroundColor: benefit.isLocked ? 'rgba(255,255,255,0.02)' : 'rgba(212,175,55,0.05)', borderRadius: 20, borderWidth: 1, borderColor: benefit.isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.2)', overflow: 'hidden', opacity: benefit.isLocked ? 0.7 : 1 }}>
                              <View style={{ padding: 16 }}>
                                <Text style={{ color: benefit.isLocked ? 'rgba(255,255,255,0.4)' : 'white', fontSize: 14, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }} numberOfLines={2}>{benefit.title}</Text>
                                {benefit.description ? <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>{benefit.description}</Text> : null}
                              </View>
                              {benefit.isLocked ? (
                                <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                                  <Text style={{ color: 'rgba(255,255,255,0.25)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{benefit.lockReason || 'No disponible'}</Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => handleRedeemVipBenefit(benefit)}
                                  disabled={redeemingVipId === benefit.id}
                                  style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' }}
                                >
                                  {redeemingVipId === benefit.id ? (
                                    <ActivityIndicator size="small" color="#D4AF37" />
                                  ) : (
                                    <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>✦ Activar Beneficio</Text>
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                   </View>

                   {/* Next Level Incentive (What you're missing) */}
                  {calculateNextTier() && (
                    <View style={{ marginBottom: 40 }}>
                       <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                          <Flame size={18} color="#FF3B30" />
                          <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginLeft: 12, letterSpacing: 1 }}>Desbloquea en Rango {calculateNextTier()?.name}</Text>
                       </View>
                       
                       <View style={{ padding: 24, backgroundColor: 'rgba(255,59,48,0.05)', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)', borderStyle: 'dashed' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>Lo que te estás perdiendo:</Text>
                          <View style={{ gap: 16 }}>
                              {vipBenefits.filter(b => b.level === calculateNextTier()?.name).slice(0, 3).map((benefit: any) => (
                                 <View key={benefit.id} style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.6 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 12 }} />
                                    <Text style={{ flex: 1, color: 'white', fontSize: 12, fontWeight: '500', fontStyle: 'italic' }}>{benefit.title}</Text>
                                 </View>
                              ))}
                              {vipBenefits.filter(b => b.level === calculateNextTier()?.name).length === 0 && (
                                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, textAlign: 'center', fontStyle: 'italic' }}>Beneficios a confirmar por el staff</Text>
                              )}
                           </View>
                          
                          <View style={{ marginTop: 24, alignItems: 'center' }}>
                             <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>A solo {calculateNextTier()!.pointsNeeded - pts} pts</Text>
                             </View>
                          </View>
                       </View>
                    </View>
                  )}

                  {/* Future Tiers List */}
                  <View>
                     <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Próximas Metas</Text>
                     <View style={{ gap: 12 }}>
                        {[
                          { name: "ORO", pts: settings?.goldThreshold || 5000, color: '#D4AF37' },
                          { name: "PLATINO", pts: settings?.platinumThreshold || 20000, color: '#FFFFFF' },
                          { name: "DIAMANTE", pts: settings?.diamondThreshold || 50000, color: '#22D3EE' },
                          { name: "SÚPER VIP", pts: settings?.superVipThreshold || 100000, color: '#FF3B30' },
                        ].filter(t => {
                          const tiers = ['BRONCE', 'ORO', 'PLATINO', 'DIAMANTE', 'SÚPER VIP'];
                          return tiers.indexOf(t.name) > tiers.indexOf(user.membershipLevel);
                        }).map((tier, idx) => (
                           <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                 <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                    <Star size={14} color={tier.color} fill={idx === 0 ? tier.color : 'transparent'} />
                                 </View>
                                 <View>
                                    <Text style={{ color: tier.color, fontWeight: '900', fontSize: 14, fontStyle: 'italic', textTransform: 'uppercase' }}>{tier.name}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700' }}>META: {tier.pts} PUNTOS</Text>
                                 </View>
                              </View>
                              <ArrowRight size={16} color="rgba(255,255,255,0.1)" />
                           </View>
                        ))}
                     </View>
                  </View>
               </ScrollView>
            </View>
         </View>
       </Modal>


    </View>
  );
}
